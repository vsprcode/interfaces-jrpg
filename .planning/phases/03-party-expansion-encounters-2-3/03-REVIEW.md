---
phase: 03-party-expansion-encounters-2-3
reviewed: 2026-04-26T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - src/engine/types.ts
  - src/engine/reducer.ts
  - src/engine/enemyAI.ts
  - src/data/characters.ts
  - src/data/enemies.ts
  - src/data/encounters.ts
  - src/components/BattleScene.tsx
  - src/components/GameController.tsx
  - src/components/EncounterCompleteScreen.tsx
  - src/components/CharacterHUD.tsx
  - src/components/TurnOrderIndicator.tsx
  - src/components/ActionMenu.tsx
  - src/components/DialogueBox.tsx
  - src/styles/battle.module.css
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-04-26
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 3 adds TORC and TRINETRA to the party, introduces three enemy behavior types (TARGET_LOWEST_HP, ATTACK_RANDOM, ALWAYS_ATTACK), wires a three-encounter chain in GameController, and extends BattleScene to be fully parameterized. The architecture is sound and the state management patterns established in Phase 1/2 are correctly extended. Two critical issues were found — one that can silently corrupt state after any skill action and one that allows the HABILIDADE button to be incorrectly enabled for TRINETRA — plus four warnings of varying impact.

---

## Critical Issues

### CR-01: PLAYER_ACTION outer case falls through into ACTION_RESOLVED when inner switch has no `default`

**File:** `src/engine/reducer.ts:45-226`

**Issue:** The outer `case 'PLAYER_ACTION'` block contains a nested `switch (actionType)` on lines 60-225. That inner switch covers all four `PlayerActionType` variants (`ATTACK`, `DEFEND`, `ITEM`, `SKILL`), but there is no `default` branch and — more importantly — no `return state` or `break` at line 226 before the closing brace of the outer `case 'PLAYER_ACTION'` block. In JavaScript/TypeScript, `switch` cases fall through when the inner switch completes without returning to the outer switch's level.

Under current TypeScript/React usage every branch inside the inner switch does `return`, so the path that reaches line 226 is only reachable if the inner switch receives an `actionType` value that matches none of its cases. However, if TypeScript is configured permissively or if future code passes a duck-typed object bypassing the union, the outer `case 'PLAYER_ACTION'` block exits at line 226 without a `return` and falls directly into `case 'ACTION_RESOLVED'` at line 228. Because `ACTION_RESOLVED` has a phase guard (`if (state.phase !== 'RESOLVING') return state`), the current production consequence is a silent `state` return — but only because the phase guard saves it. Any change to phase guard ordering or the addition of a new `actionType` could expose a genuine state-corrupting fallthrough.

Additionally, the outer `case 'PLAYER_ACTION'` block wraps lines 45-226 inside curly braces (a block statement), but there is no `return` statement after the inner switch closes. TypeScript does not warn about this because all code paths inside the inner switch return; from TypeScript's perspective the outer block also "returns" on all typed paths. The runtime, however, will fall through if the inner switch is ever skipped.

**Fix:** Add an explicit `return state` as the last statement inside the outer `case 'PLAYER_ACTION'` block, and add a `default: return state` to the inner switch for defense-in-depth:

```typescript
case 'PLAYER_ACTION': {
  if (state.phase !== 'PLAYER_INPUT') return state;
  // ...existing code...
  switch (actionType) {
    case 'ATTACK': { /* ... */ return { ... }; }
    case 'DEFEND': { /* ... */ return { ... }; }
    case 'ITEM':   { /* ... */ return { ... }; }
    case 'SKILL':  { /* ... */ return { ... }; }
    default:       return state; // exhaustiveness safety net
  }
  // This line is now unreachable but TypeScript will not complain:
  // return state;
}
```

The safest single-line fix is inserting `return state;` at line 226 (after the inner switch closes, before the outer case block closes):

```typescript
        }   // closes case 'SKILL'
      }      // closes inner switch(actionType)
      return state; // ← ADD THIS
    }          // closes case 'PLAYER_ACTION'
```

---

### CR-02: ActionMenu `canSkill` uses a hardcoded EN threshold of 8 that is wrong for TORC (6) and TRINETRA (10)

**File:** `src/components/ActionMenu.tsx:35`

**Issue:** `canSkill` is computed as `actor.en >= 8`. This single threshold is used to both disable the HABILIDADE button and gate the keyboard shortcut. The three characters have different skill EN costs:

- DEADZONE — Signal Null costs 8 EN (`reducer.ts:206`) — threshold `>= 8` is correct.
- TORC — Forge Wall costs 6 EN (`reducer.ts:128`) — threshold `>= 8` is **too high**. TORC can have 6 or 7 EN and be able to use the skill, but the button will be disabled, preventing the player from taking the action.
- TRINETRA — System Override costs 10 EN (`reducer.ts:156`) — threshold `>= 8` is **too low**. TRINETRA will show the HABILIDADE button enabled when she has 8 or 9 EN, but the reducer will silently return `state` (no-op) because `actor.en < 10`. The player clicks, nothing happens, no feedback.

The TORC case is a usability block (skill unreachable in a legal state). The TRINETRA case is a silent no-op on a valid-looking button — the player receives no error, no feedback, the turn is wasted if they reach the two-step picker and dispatch.

**Fix:** Make the threshold per-actor:

```typescript
const SKILL_EN_COST: Record<string, number> = {
  DEADZONE: 8,
  TORC: 6,
  TRINETRA: 10,
};

const canSkill = isInputPhase && actor.en >= (SKILL_EN_COST[actor.id] ?? 8);
```

---

## Warnings

### WR-01: `handleItem` in BattleScene always targets the current actor (self-heal only), ignoring other party members

**File:** `src/components/BattleScene.tsx:230-235`

**Issue:** `handleItem` dispatches with `targetId: actor.id`, hard-targeting the current actor. With a three-person party, the Nano-Med can only heal the character whose turn it is. If DEADZONE is at full HP but TRINETRA is critical, there is no way to use the item on TRINETRA during DEADZONE's turn.

This is a scope decision (Phase 1 left it as self-heal), but with a full party it becomes a gameplay gap. The reducer already supports `targetId ?? actorId` (line 105 of reducer.ts), so a target-picker analogous to TRINETRA's skill flow would require only a UI change.

**Fix (minimal):** At minimum, target the party member with the lowest HP rather than self, to preserve the intended "triage" function:

```typescript
const handleItem = () => {
  const entry = state.turnQueue[state.currentTurnIndex];
  const actor = state.party.find(c => c.id === entry?.combatantId);
  if (!actor) return;
  // Heal the most-wounded alive party member, not necessarily self
  const lowestHp = [...state.party]
    .filter(c => !c.isDefeated)
    .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
  const healTarget = lowestHp ?? actor;
  dispatch({ type: 'PLAYER_ACTION', payload: { type: 'ITEM', actorId: actor.id, targetId: healTarget.id } });
};
```

---

### WR-02: `EncounterCompleteScreen` receives `completedParty` (pre-normalization HP) instead of `nextParty` (post-EN-reset, normalized)

**File:** `src/components/GameController.tsx:63`

**Issue:** `handleVictory` computes `nextParty` (HP persists, EN reset, status cleared, isDefeated cleared) but then calls `setCompletedParty(finalParty)` — the raw `finalParty` argument before normalization. `EncounterCompleteScreen` shows the HP values from `completedParty`, so it displays the raw post-battle HP, which is fine for the summary. However, it also means defeated characters (`isDefeated: true`, `hp: 0`) will appear on the screen if any party member died during the encounter — because `isDefeated` and `hp` are not reset in `finalParty`, only in `nextParty`.

Specifically: if a character reaches 0 HP but enemies are defeated the same action (reducer checks enemies first at line 296), that character is `isDefeated: true` and `hp: 0`. They will appear on the EncounterCompleteScreen with "CHAR: 0/85 HP". This is confusing and inconsistent.

**Fix:** Pass `nextParty` to `setCompletedParty` instead of `finalParty`:

```typescript
const nextParty = finalParty.map(c => ({ ...c, en: c.maxEn, isDefending: false, statusEffects: [], isDefeated: false }));
setCompletedParty(nextParty); // ← was: setCompletedParty(finalParty)
```

---

### WR-03: Game Over retry does not reset `carryParty` to the start-of-encounter state

**File:** `src/components/GameController.tsx:87-91`

**Issue:** `handleGameOver` only increments `battleKey` (to force BattleScene remount) and resets `controllerPhase` to `'BATTLE'`. It does not reset `carryParty`. BattleScene's `INIT` dispatch clones `carryParty` as-is.

On a retry after a game over:
- `carryParty` still holds the HP values from when the encounter started (because HP carry only runs through `handleVictory`, which is never called on game over).
- This is **correct behavior** — the carry is the HP that was brought into the encounter, not mid-battle HP.

However, `carryParty` is initialized to `ENCOUNTER_CONFIGS[0]!.party` (line 49) — the raw singleton objects from `characters.ts`. These share the same object reference. If DEADZONE's encounter-1 starting HP was already depleted from a previous run's carry-over, retrying encounter 1 after a game over starts with that depleted HP, not fresh 95/95.

Specifically: after Encounter 1 victory, `nextParty` carries DEADZONE's actual post-battle HP into Encounter 2's `carryParty`. If the player hits game over in Encounter 2 and retries, `carryParty` is the HP-depleted `nextParty` from Encounter 1 — not fresh stats. This is intentional per ENC-05. But after a game over in **Encounter 1**, the initial `carryParty = ENCOUNTER_CONFIGS[0]!.party` is the original singleton object. If the `INIT` reducer spread-clones it (`party.map(c => ({ ...c }))` at reducer line 31), the singleton is not mutated, so retries are clean.

The real risk is that if any code path ever mutates a character object without spread (passing a reference directly), the singleton will be corrupted for all future retries. This is a latent issue. The INIT spread on line 31 of reducer.ts currently prevents it, but it is fragile.

**Fix:** Defensively deep-clone `carryParty` at the point GameController initializes it:

```typescript
const [carryParty, setCarryParty] = useState<Character[]>(
  ENCOUNTER_CONFIGS[0]!.party.map(c => ({ ...c }))
);
```

---

### WR-04: Victory and Game Over log messages in `ACTION_RESOLVED` are hardcoded to Encounter 1 lore

**File:** `src/engine/reducer.ts:303, 313`

**Issue:** Inside `ACTION_RESOLVED`, when all enemies are defeated the log appends: `'Probe MK-I neutralizada. Corredor 7-A desobstruído.'`. When all party members are defeated the log appends: `'DEADZONE eliminada. A resistência analógica recua.'`

Both strings are Encounter 1-specific. In Encounters 2 and 3 with different enemies and a full party, these messages will appear verbatim — "Probe MK-I neutralizada" when NETWORKER_ENFORCERs are defeated, and "DEADZONE eliminada" when only TORC and TRINETRA are alive (DEADZONE could be alive).

This is a display bug visible to the player after every non-E1 victory/defeat.

**Fix:** The reducer does not know the encounter context, so the log message should either be generic or derived from the actual enemies/party:

```typescript
// Generic replacement — no encounter-specific lore in the engine:
log: [...state.log, 'Ameaça neutralizada. Setor desobstruído.'],
// ...
log: [...state.log, 'Resistência analógica suprimida.'],
```

Or, for richer messages, add an optional `scenarioLabels` field to `BattleState` populated at `INIT` time from props — but the generic strings are simpler and eliminate the bug.

---

## Info

### IN-01: `REMOVE_STATUS` variant removes only the first status effect, even when multiple are stacked

**File:** `src/engine/reducer.ts:183`

**Issue:** `toRemove = healTarget.statusEffects[0]?.type` selects the first status effect in the array. If a character has two stacked `DEF_BUFF` effects (e.g., TORC used Forge Wall twice), only the first will be removed. This is likely intentional for Phase 3 scope, but the behavior silently ignores additional stacks. When OVERDRIVE_CHARGE is introduced in Phase 4, this code path might interact unexpectedly.

**Fix:** Document this as a deliberate single-effect removal, or add a comment:

```typescript
// Intentionally removes only the first status — single-effect removal per SKILL-03 spec.
const toRemove = healTarget.statusEffects[0]?.type;
```

---

### IN-02: `enRatio` in `CharacterHUD` produces `NaN` for characters with `maxEn === 0`

**File:** `src/components/CharacterHUD.tsx:19`

**Issue:** `const enRatio = character.en / character.maxEn`. All current enemies have `en: 0, maxEn: 0`. CharacterHUD is only rendered for party members (not enemies), so `maxEn === 0` does not occur in practice. However, if an enemy CharacterHUD were ever rendered (or a future party member had `maxEn: 0`), `enRatio` would be `NaN`, producing `width: NaN%` in the inline style — which browsers silently ignore but renders as a 0-width bar with no error.

**Fix:** Guard the ratio:

```typescript
const enRatio = character.maxEn > 0 ? character.en / character.maxEn : 0;
```

---

### IN-03: `ENCOUNTER_CONFIGS` only covers 3 entries; `handleContinue` and `handleDialogueComplete` can increment `encounterIndex` past the array bounds

**File:** `src/components/GameController.tsx:94-104`

**Issue:** `handleDialogueComplete` and `handleContinue` both call `setEncounterIndex(i => i + 1)` and `setControllerPhase('BATTLE')`. After Encounter 3 completes, `handleVictory` sets `controllerPhase` to `'ENCOUNTER_COMPLETE'` (line 83), and `handleContinue` then increments `encounterIndex` to 3. On the next render, `ENCOUNTER_CONFIGS[3]` is `undefined`, and `config.enemies` (line 52: `const config = ENCOUNTER_CONFIGS[encounterIndex]!`) will throw a runtime error because `!` is asserted but the value is undefined.

This crash is only reachable after the third encounter completes and the player presses CONTINUAR on the EncounterCompleteScreen — at which point the demo is "done" and Phase 4 will replace this flow. However, the current code will crash rather than gracefully end.

**Fix:** Guard `handleContinue` so it does not advance beyond the last encounter:

```typescript
const handleContinue = () => {
  const nextIndex = encounterIndex + 1;
  if (nextIndex >= ENCOUNTER_CONFIGS.length) {
    // Demo complete — show a credits/end screen or loop back to E1
    setControllerPhase('GAME_OVER'); // or a new 'DEMO_COMPLETE' phase
    return;
  }
  setEncounterIndex(nextIndex);
  setBattleKey(k => k + 1);
  setControllerPhase('BATTLE');
};
```

---

_Reviewed: 2026-04-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
