---
phase: 01-foundation-pure-engine
reviewed: 2026-04-26T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - src/engine/types.ts
  - src/engine/damage.ts
  - src/engine/damage.test.ts
  - src/engine/turnQueue.ts
  - src/engine/turnQueue.test.ts
  - src/engine/reducer.ts
  - src/engine/reducer.test.ts
  - src/engine/gameStateRef.ts
  - src/engine/enemyAI.ts
  - src/engine/enemyAI.test.ts
  - src/data/characters.ts
  - src/data/enemies.ts
  - src/components/BattleScene.tsx
  - src/components/SpriteFallback.tsx
  - src/styles/sprite-fallback.module.css
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/page.tsx
findings:
  critical: 1
  warning: 5
  info: 3
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-26
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Phase 1 establishes the battle engine foundation: pure functions (`damage.ts`, `turnQueue.ts`), a reducer (`reducer.ts`), an AI stub map (`enemyAI.ts`), a ref-based stale-closure guard (`gameStateRef.ts`), data singletons, and a skeleton React shell. The engineering discipline is high — purity tests exist, phase guards are in place, and the Strict Mode INIT pattern is correctly implemented with `useRef`. However, there are several issues that will cause runtime failures or data corruption when Phase 2 wires up real combat, and one type mismatch in the test suite that makes test coverage of `NEXT_TURN` unreliable.

The critical issue is that the data layer exports mutable singleton objects that are passed by reference into the reducer, creating a corruption vector for multi-encounter play. The most urgent pre-Phase-2 fix is the `ENEMY_ACTION` → `pendingAction` gap, which means enemy turns can never resolve via the existing animation gate.

---

## Critical Issues

### CR-01: Mutable data singletons passed by reference into reducer state

**File:** `src/data/characters.ts:9`, `src/data/enemies.ts:9`, `src/engine/reducer.ts:30-32`

**Issue:** `DEADZONE` and `CASTING_PROBE_MK1` are exported as bare `const` object literals — they are module-level singletons. `BattleScene` passes them directly into `INIT`:

```ts
dispatch({ type: 'INIT', payload: { party: [DEADZONE], enemies: [CASTING_PROBE_MK1] } })
```

The reducer stores these references as-is (`party: action.payload.party`). When Phase 2 combat logic applies HP deltas by mutating characters in the `party` array (e.g., `character.hp -= delta`), it will mutate the exported singleton. Any subsequent `INIT` dispatch (second encounter, game restart) will then begin with the corrupted values — DEADZONE will start at 47 HP if she took 48 damage in the prior encounter.

The purity tests in `reducer.test.ts` (line 77-88) do detect mutation of the state snapshot at the array level, but they don't catch in-place property mutation of elements within the array — `JSON.stringify` comparison would catch it, but only if the same test that mutates also checks. The mutation will happen in Phase 2 reducer cases that don't exist yet.

**Fix:** Freeze or deep-clone singletons at the INIT boundary, and spread characters when applying deltas in Phase 2:

```ts
// In characters.ts / enemies.ts — freeze the singleton
export const DEADZONE: Character = Object.freeze({ ... }) as Character;

// In reducer.ts — INIT case: deep-clone the party and enemies
case 'INIT': {
  const { party, enemies } = action.payload;
  const clonedParty = party.map(c => ({ ...c, statusEffects: [...c.statusEffects] }));
  const clonedEnemies = enemies.map(e => ({ ...e, statusEffects: [...e.statusEffects] }));
  const turnQueue = buildTurnQueue(clonedParty, clonedEnemies);
  return {
    ...initialBattleState,
    party: clonedParty,
    enemies: clonedEnemies,
    turnQueue,
    phase: 'PLAYER_INPUT',
    round: 1,
    log: ['Encontro iniciado.'],
  };
}
```

`Object.freeze` on the singletons ensures any accidental direct mutation throws in strict mode or at minimum becomes a detectable error.

---

## Warnings

### WR-01: `ENEMY_ACTION` never sets `pendingAction` — animation gate will never fire for enemy turns

**File:** `src/engine/reducer.ts:68-71`, `src/components/BattleScene.tsx:40`

**Issue:** The `ENEMY_ACTION` case transitions phase from `ENEMY_TURN` to `RESOLVING` but does not set `pendingAction`:

```ts
case 'ENEMY_ACTION': {
  if (state.phase !== 'ENEMY_TURN') return state;
  return { ...state, phase: 'RESOLVING' };  // pendingAction stays null
}
```

The animation gate in `BattleScene` only starts the 800ms `ACTION_RESOLVED` timer when both conditions are true:

```ts
if (state.phase !== 'RESOLVING' || !state.pendingAction) return;
```

Because `pendingAction` is never set by `ENEMY_ACTION`, the condition `!state.pendingAction` is always `true`, the `setTimeout` is never scheduled, and `ACTION_RESOLVED` is never dispatched. Enemy turns will enter `RESOLVING` permanently — the game will deadlock on the first enemy action.

**Fix:** `ENEMY_ACTION` must produce a `pendingAction` (which Phase 2 will populate from `resolveEnemyAction`). For now, set a placeholder to unblock the gate:

```ts
case 'ENEMY_ACTION': {
  if (state.phase !== 'ENEMY_TURN') return state;
  const enemy = state.enemies.find(e => e.id === action.payload.enemyId);
  return {
    ...state,
    phase: 'RESOLVING',
    pendingAction: {
      actorId: action.payload.enemyId,
      description: enemy ? `${enemy.name} attacks.` : 'Enemy acts.',
      animationType: 'ATTACK',
    },
  };
}
```

### WR-02: `ACTION_RESOLVED` always transitions to `PLAYER_INPUT` — breaks enemy-turn flow

**File:** `src/engine/reducer.ts:59-66`

**Issue:** `ACTION_RESOLVED` unconditionally transitions to `PLAYER_INPUT`:

```ts
case 'ACTION_RESOLVED': {
  if (state.phase !== 'RESOLVING') return state;
  return { ...state, pendingAction: null, phase: 'PLAYER_INPUT' };
}
```

After an enemy action resolves, the game should not return to `PLAYER_INPUT` — it should either move to the next turn (`NEXT_TURN`) and let the turn queue determine who acts next, or it should remain in `ENEMY_TURN` if the next entry in the queue is also an enemy. Returning directly to `PLAYER_INPUT` after every resolved action gives the player an extra turn after every enemy move.

**Fix:** `ACTION_RESOLVED` should dispatch `NEXT_TURN` rather than hard-coding the next phase, or the reducer needs a `resolvedFrom` field. The simplest correct pattern for Phase 2:

```ts
case 'ACTION_RESOLVED': {
  if (state.phase !== 'RESOLVING') return state;
  // Transition to NEXT_TURN logic rather than assuming player goes next
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    return {
      ...state,
      pendingAction: null,
      turnQueue: newQueue,
      currentTurnIndex: 0,
      round: state.round + 1,
      phase: determineNextPhase(newQueue, 0),
    };
  }
  return {
    ...state,
    pendingAction: null,
    currentTurnIndex: nextIndex,
    phase: determineNextPhase(state.turnQueue, nextIndex),
  };
}

function determineNextPhase(queue: TurnEntry[], index: number): BattlePhase {
  return queue[index]?.kind === 'enemy' ? 'ENEMY_TURN' : 'PLAYER_INPUT';
}
```

Alternatively, keep `NEXT_TURN` and `ACTION_RESOLVED` as separate actions that the UI orchestration layer dispatches in sequence — but then `ACTION_RESOLVED` must not set `phase: 'PLAYER_INPUT'` unconditionally.

### WR-03: `reducer.test.ts` uses `speed` field instead of `spd` — type contract not enforced

**File:** `src/engine/reducer.test.ts:145-148`, `src/engine/reducer.test.ts:161`

**Issue:** The `NEXT_TURN` tests manually construct `TurnEntry` objects using a `speed` field:

```ts
turnQueue: [
  { combatantId: 'DEADZONE', speed: 18 },       // line 145
  { combatantId: 'CASTING_PROBE_MK1', speed: 10 }, // line 146
],
```

The `TurnEntry` interface in `types.ts` defines the field as `spd`, not `speed`:

```ts
export interface TurnEntry {
  combatantId: CombatantId;
  kind: 'player' | 'enemy';
  spd: number; // line 60
}
```

The test objects are also missing the `kind` field. TypeScript should reject these with strict mode enabled (`strictNullChecks`, `noImplicitAny`). If the TypeScript config is lenient or the test file is cast through `as any`, the mismatch goes unnoticed and the tests validate the wrong shape. The `turnQueue.length` checks pass because JavaScript arrays don't care about object shape, but any Phase 2 code that reads `entry.spd` from the test queue will get `undefined`.

**Fix:** Correct both test objects to match the `TurnEntry` interface:

```ts
turnQueue: [
  { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
  { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
],
```

Apply the same fix to the single-entry queue at line 161.

### WR-04: `NEXT_TURN` at round boundary does not update `phase`

**File:** `src/engine/reducer.ts:73-83`

**Issue:** When `NEXT_TURN` wraps to a new round, it rebuilds the queue and resets `currentTurnIndex` to 0 but does not update `phase`:

```ts
case 'NEXT_TURN': {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    return {
      ...state,
      turnQueue: newQueue,
      currentTurnIndex: 0,
      round: state.round + 1,
      // phase is NOT updated — stays whatever it was
    };
  }
  return { ...state, currentTurnIndex: nextIndex };
}
```

If the first entry in the new queue is an enemy, the phase must become `ENEMY_TURN`. If it is a player, it must become `PLAYER_INPUT`. Neither mid-round branch (`return { ...state, currentTurnIndex: nextIndex }`) nor the round-wrap branch sets phase. This leaves the UI button disabled/enabled incorrectly and enemy turns silently skipped.

**Fix:** Both branches of `NEXT_TURN` should derive the new phase from the next queue entry (same `determineNextPhase` helper described in WR-02):

```ts
case 'NEXT_TURN': {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    const nextPhase = newQueue[0]?.kind === 'enemy' ? 'ENEMY_TURN' : 'PLAYER_INPUT';
    return {
      ...state,
      turnQueue: newQueue,
      currentTurnIndex: 0,
      round: state.round + 1,
      phase: nextPhase,
    };
  }
  const nextPhase = state.turnQueue[nextIndex]?.kind === 'enemy' ? 'ENEMY_TURN' : 'PLAYER_INPUT';
  return { ...state, currentTurnIndex: nextIndex, phase: nextPhase };
}
```

### WR-05: `resolveEnemyAction` throws inside AI stub — violates reducer "never throws" contract

**File:** `src/engine/enemyAI.ts:33-35`, `src/engine/reducer.ts:17`

**Issue:** The reducer docstring states "never throws." The AI stubs called by `resolveEnemyAction` explicitly throw when no valid targets exist:

```ts
function stubAction(enemy: Enemy, state: BattleState, label: string): ResolvedAction {
  const validTargets = state.party.filter(c => !c.isDefeated);
  if (validTargets.length === 0) {
    throw new Error(`AI ${label}: no valid targets — caller must dispatch GAME_OVER first`);
  }
  ...
}
```

When Phase 2 wires `resolveEnemyAction` into the `ENEMY_ACTION` reducer case, a throw from the AI will propagate out of `useReducer`'s dispatch and become an uncaught exception in the React render cycle. React does not catch errors thrown by reducers — the component tree will unmount unless an error boundary wraps `BattleScene`. There is no error boundary in `page.tsx` or `layout.tsx`.

The defensive check is valuable, but the throw is the wrong mechanism for a reducer-adjacent function. The reducer should handle the "no targets" case gracefully by transitioning to `GAME_OVER` before reaching the AI call.

**Fix 1 (correct ordering — preferred):** In the `ENEMY_ACTION` reducer case (Phase 2), check for living targets before calling the AI:

```ts
case 'ENEMY_ACTION': {
  if (state.phase !== 'ENEMY_TURN') return state;
  const aliveParty = state.party.filter(c => !c.isDefeated);
  if (aliveParty.length === 0) {
    return { ...state, phase: 'GAME_OVER' };
  }
  // Safe to call AI now
  const enemy = state.enemies.find(e => e.id === action.payload.enemyId)!;
  const resolved = resolveEnemyAction(enemy, state);
  return { ...state, phase: 'RESOLVING', pendingAction: resolved };
}
```

**Fix 2 (defensive — belt and suspenders):** Add an error boundary to `page.tsx`:

```tsx
// src/app/page.tsx
import { BattleScene } from '@/components/BattleScene';
import { BattleErrorBoundary } from '@/components/BattleErrorBoundary';

export default function Page() {
  return (
    <BattleErrorBoundary>
      <BattleScene />
    </BattleErrorBoundary>
  );
}
```

---

## Info

### IN-01: `globals.css` — self-referential CSS variable for font token

**File:** `src/app/globals.css:13`

**Issue:** The `@theme` block contains:

```css
--font-pixel: var(--font-pixel);
```

This is a circular self-reference — the Tailwind `@theme` token `--font-pixel` resolves to the CSS custom property `--font-pixel`, which is the same variable being defined. This works in practice because `layout.tsx` sets `--font-pixel` on `<html>` via `next/font`'s `pressStart.variable` class, and the CSS cascade means the custom property on `:root` or `html` takes precedence. However, the self-reference is fragile: if `next/font` ever changes the variable name, or if someone removes the `className={pressStart.variable}` from `<html>`, the fallback chain collapses and the font silently disappears with no compile-time error.

**Fix:** Document the dependency explicitly or reference the known stable variable name:

```css
/* In @theme — the actual variable is set by next/font on <html> via pressStart.variable */
--font-pixel: var(--font-pixel, monospace); /* fallback ensures text is always readable */
```

Adding `monospace` as a fallback makes font failure visible rather than invisible.

### IN-02: `SpriteFallback` prop type accepts `'boss'` for `kind` but `BattleScene` never passes it

**File:** `src/components/SpriteFallback.tsx:17`, `src/components/BattleScene.tsx:69-73`

**Issue:** The `Props` interface declares `kind: 'player' | 'enemy' | 'boss'` but `BattleScene` only passes `'player'` and `'enemy'`. The CSS module has a `[data-kind="boss"]` rule that applies the boss pulse animation. This is fine as forward-compatibility, but the `CombatantId` type includes `AEGIS_7` which maps to the magenta boss color — when AEGIS-7 is eventually rendered, callers will need to remember to pass `kind="boss"` to trigger the animation. This is an easy miss since nothing in the type system enforces the `AEGIS_7` → `boss` mapping.

**Fix (Info-level):** Consider deriving `kind` from `combatantId` inside `SpriteFallback` or providing a helper, so callers cannot accidentally render AEGIS-7 as a standard enemy:

```ts
function resolveKind(id: CombatantId): 'player' | 'enemy' | 'boss' {
  if (id === 'AEGIS_7') return 'boss';
  if (id === 'DEADZONE' || id === 'TORC' || id === 'TRINETRA') return 'player';
  return 'enemy';
}
```

### IN-03: `enemyAI.test.ts` — exhaustiveness of `AI_BEHAVIORS` checked by value count, not type

**File:** `src/engine/enemyAI.test.ts:18-25`

**Issue:** The test verifies all four `EnemyBehaviorType` values have a function in `AI_BEHAVIORS` by constructing a manual string array and iterating it:

```ts
const requiredKeys: EnemyBehaviorType[] = [
  'ALWAYS_ATTACK', 'TARGET_LOWEST_HP', 'ATTACK_RANDOM', 'OVERDRIVE_BOSS',
];
```

This test will pass even if a new `EnemyBehaviorType` is added to `types.ts` but omitted from `AI_BEHAVIORS` — the manual list will still match the old four entries. The TypeScript type on `AI_BEHAVIORS` as `Record<EnemyBehaviorType, AIFn>` is the correct exhaustiveness guard at the type level; the test adds no additional safety because it doesn't derive from the type at runtime.

**Fix:** Remove the manual-list test (it duplicates what `Record<EnemyBehaviorType, AIFn>` already enforces at compile time) or replace it with an `Object.keys`-based check that compares count against a canonical list derived from the type, accepting that runtime exhaustiveness checks are inherently fragile in TypeScript.

---

_Reviewed: 2026-04-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
