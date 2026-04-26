---
phase: 02-encounter-1-deadzone-solo
reviewed: 2026-04-26T15:21:11Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/engine/reducer.ts
  - src/engine/enemyAI.ts
  - src/components/ActionMenu.tsx
  - src/components/CharacterHUD.tsx
  - src/components/EnemyPanel.tsx
  - src/components/BattleLog.tsx
  - src/components/FloatingDamageNumber.tsx
  - src/components/BattleScene.tsx
  - src/components/VictoryScreen.tsx
  - src/components/GameOverScreen.tsx
  - src/app/page.tsx
  - src/styles/battle.module.css
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-26T15:21:11Z
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

Reviewed all 12 Phase 2 source files spanning the battle engine reducer, AI module, and all UI components. No security vulnerabilities found — this is a purely client-side game with no user-supplied data reaching dangerous sinks. No hardcoded secrets. React pitfall guardrails (Strict Mode, stale closure, cleanup) are correctly applied throughout.

Four warnings were found, all correctness bugs: two phase-transition holes in the reducer's skip-defeated-enemy path that will leave the game stuck at `ENEMY_TURN` indefinitely in a multi-enemy future round, one reducer contract violation where a throw can escape a "never throws" function, and one enemy HP over-heal inconsistency. Two info items cover a grow-only log key and a placeholder `throw` in stub AI behaviors.

For Phase 2 (single enemy, single player) the critical path is fully correct and playable. The phase-transition holes are latent bugs that will manifest in Phase 3+ when multiple enemies are introduced.

---

## Warnings

### WR-01: `ENEMY_ACTION` skip path does not update `phase` — game stuck on `ENEMY_TURN`

**File:** `src/engine/reducer.ts:241-248`

**Issue:** When `ENEMY_ACTION` finds the target enemy is already `isDefeated`, it advances `currentTurnIndex` (or rebuilds the queue at end-of-round) but **never changes `phase`**. The phase remains `'ENEMY_TURN'`. The `ENEMY_TURN` `useEffect` in `BattleScene` re-fires on the new `currentTurnIndex`, dispatches `NEXT_TURN` (because the component-level guard also finds the enemy defeated at line 104), but `NEXT_TURN` likewise does not set `phase`. Result: in a multi-enemy encounter where one enemy dies mid-round, the next turn after the defeated enemy is skipped correctly by index, but `phase` never transitions to `'PLAYER_INPUT'` if the next queue entry is a player — the UI hangs.

Phase 2 is immune because there is only one enemy and `GAME_OVER`/`VICTORY` fire before a skip is ever needed. This will break Phase 3.

**Fix:**
```typescript
// reducer.ts — ENEMY_ACTION skip path
if (!enemy || enemy.isDefeated) {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    const nextPhase = newQueue[0]?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
    return { ...state, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1, phase: nextPhase };
  }
  const nextEntry = state.turnQueue[nextIndex];
  const nextPhase = nextEntry?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
  return { ...state, currentTurnIndex: nextIndex, phase: nextPhase };
}
```

---

### WR-02: `NEXT_TURN` action never updates `phase` — same hang vector

**File:** `src/engine/reducer.ts:259-271`

**Issue:** The `NEXT_TURN` case is dispatched from `BattleScene` (line 105) when the component-level enemy-defeated guard fires during `ENEMY_TURN`. It advances the index or rebuilds the queue but **never sets `phase`**. The `phase` stays `'ENEMY_TURN'` regardless of whether the next combatant is a player. This is the component-side counterpart to WR-01 and shares the same latent multi-enemy breakage.

**Fix:**
```typescript
case 'NEXT_TURN': {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    const nextPhase = newQueue[0]?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
    return { ...state, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1, phase: nextPhase };
  }
  const nextEntry = state.turnQueue[nextIndex];
  const nextPhase = nextEntry?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
  return { ...state, currentTurnIndex: nextIndex, phase: nextPhase };
}
```

---

### WR-03: `ALWAYS_ATTACK` throws inside the reducer — violates "never throws" contract

**File:** `src/engine/enemyAI.ts:23-25`

**Issue:** The reducer's doc comment guarantees it "never throws." `resolveEnemyAction` is called synchronously from the `ENEMY_ACTION` case, and `ALWAYS_ATTACK` throws `new Error(...)` if `validTargets.length === 0`. While that path is unreachable in Phase 2 (because `GAME_OVER` fires before any enemy acts with an empty party), it is still a contract violation. A future phase regression, a bad test fixture, or out-of-order dispatch could surface this throw, crashing the React render tree with no error boundary.

The same issue exists in the `stubAction` helper used by `TARGET_LOWEST_HP`, `ATTACK_RANDOM`, and `OVERDRIVE_BOSS`.

**Fix:** Return a no-op `ResolvedAction` instead of throwing, and log a console error so the bug is visible without crashing:
```typescript
// enemyAI.ts — ALWAYS_ATTACK guard
const validTargets = state.party.filter(c => !c.isDefeated);
if (validTargets.length === 0) {
  console.error('ALWAYS_ATTACK: no valid targets — GAME_OVER should have fired first');
  return { actorId: enemy.id, description: '(no targets)', animationType: 'ATTACK' };
}
```

---

### WR-04: Enemy HP not clamped to `maxHp` on positive deltas

**File:** `src/engine/reducer.ts:168-170`

**Issue:** Party HP is clamped with `Math.max(0, Math.min(c.maxHp, c.hp + delta.amount))` (line 163), but enemy HP uses only `Math.max(0, e.hp + delta.amount)` — no upper clamp. If any future action applies a positive `hpDelta` to an enemy (e.g., an enemy self-heal or a heal-reversal status), the enemy HP can exceed `maxHp`. The HP bar would also render beyond 100% width.

In Phase 2 enemies only ever receive negative deltas, so this is latent. Fixing it now costs one line.

**Fix:**
```typescript
// reducer.ts line 169
const newHp = Math.max(0, Math.min(e.maxHp, e.hp + delta.amount));
return { ...e, hp: newHp, isDefeated: newHp <= 0 };
```

---

## Info

### IN-01: `BattleLog` uses array index as `key`

**File:** `src/components/BattleLog.tsx:29`

**Issue:** `key={i}` on a grow-only log is functionally safe — entries are never reordered or deleted, so React will never misidentify a node. However, if the log is ever truncated (e.g., capped at N lines to prevent memory growth in longer encounters), index keys will produce wrong animations as entries shift. Worth noting for when the log gains a max-length cap.

**Fix:** Use `key={`${i}-${entry.slice(0, 20)}`}` or pass a monotonic id with each log entry from the reducer.

---

### IN-02: `PLAYER_ACTION` inner switch has no `default` — TypeScript exhaustion gap

**File:** `src/engine/reducer.ts:60-145`

**Issue:** The inner `switch (actionType)` over `PlayerActionType` has no `default` case and no exhaustiveness assertion. TypeScript's structural checking will catch a missing case if `PlayerActionType` gains a new variant, but only if the outer function's return type is explicitly declared. Currently the return type is inferred. If a new `PlayerActionType` is added and the developer forgets to add a case, the inner switch falls through to the outer switch's next `case 'ACTION_RESOLVED'` label — which could fire `ACTION_RESOLVED` logic without a `pendingAction`. The phase guard at line 149 catches this (`if (!state.pendingAction) return { ...state, phase: 'PLAYER_INPUT' }`), but the fallthrough itself is an unintentional behavior.

**Fix:** Add a `default` branch to the inner switch:
```typescript
default: {
  const _: never = actionType;
  return state;
}
```
Or declare `battleReducer`'s return type as `BattleState` explicitly so TypeScript enforces exhaustiveness on the outer function.

---

_Reviewed: 2026-04-26T15:21:11Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
