---
phase: 03-party-expansion-encounters-2-3
plan: "04"
subsystem: encounter-chain
tags: [encounter-chain, game-controller, state-machine, ui-components]
one_liner: "GameController state machine wiring E1→E2→E3 via ENCOUNTER_CONFIGS; BattleScene parameterized with party/enemies props; EncounterCompleteScreen between encounters with HP carry and EN reset (ENC-05)"

dependency_graph:
  requires:
    - "03-01: ENCOUNTER_CONFIGS array, Character/Enemy types, EnemyId union"
    - "03-02: Forge Wall + System Override reducer logic (TORC/TRINETRA skills)"
    - "03-03: TARGET_LOWEST_HP + ATTACK_RANDOM AI behaviors"
  provides:
    - "GameController: encounter state machine (BATTLE → ENCOUNTER_COMPLETE → next BATTLE)"
    - "EncounterCompleteScreen: interstitial with party HP snapshot and CONTINUAR button"
    - "BattleScene: fully parameterized (party/enemies/encounterIndex/onVictory/onGameOver props)"
    - "page.tsx: renders GameController instead of BattleScene directly"
    - "ENC-05: HP carries, EN resets to maxEn, statusEffects cleared on encounter transition"
    - "Background CSS variants: bg_loading_dock (amber), bg_server_room (green)"
  affects:
    - src/components/BattleScene.tsx
    - src/components/GameController.tsx (new)
    - src/components/EncounterCompleteScreen.tsx (new)
    - src/app/page.tsx
    - src/engine/reducer.ts
    - src/styles/battle.module.css
    - src/components/BattleScene.test.tsx

tech_stack:
  added: []
  patterns:
    - "GameController: useState-based encounter state machine (ControllerPhase union)"
    - "HP carry between encounters: finalParty.map(c => ({ ...c, en: c.maxEn, isDefending: false, statusEffects: [], isDefeated: false }))"
    - "New party member inject: nextConfig.newPartyMember added if not already in party"
    - "battleKey increment: on both game-over retry AND encounter advance (T-03-04-03)"
    - "onVictory via stateRef.current.party: avoids stale closure in VICTORY useEffect (T-03-04-02)"
    - "Background variant: encounterIndex → bgVariants array → CSS module class"
    - "Actor-aware handlers: currentEntry = turnQueue[currentTurnIndex] → party.find(c => c.id === combatantId)"

key_files:
  created:
    - path: src/components/GameController.tsx
      purpose: "Encounter state machine managing E1→E2→E3 transitions with HP carry and party expansion"
    - path: src/components/EncounterCompleteScreen.tsx
      purpose: "Interstitial screen shown between encounters: party HP snapshot + CONTINUAR button"
  modified:
    - path: src/components/BattleScene.tsx
      change: "Parameterized with BattleSceneProps (party/enemies/encounterIndex/onVictory/onGameOver); INIT uses props; handlers actor-aware; background variants; VictoryScreen removed"
    - path: src/app/page.tsx
      change: "Replaced BattleScene + battleKey logic with GameController render"
    - path: src/engine/reducer.ts
      change: "ATTACK/DEFEND/ITEM descriptions use actor.name (dynamic, not hardcoded DEADZONE)"
    - path: src/styles/battle.module.css
      change: "Added bg_loading_dock (amber/rust gradient) and bg_server_room (green/teal gradient)"
    - path: src/components/BattleScene.test.tsx
      change: "Updated to provide required BattleSceneProps via defaultProps (party, enemies, encounterIndex, onVictory, onGameOver)"

decisions:
  - "BattleScene VictoryScreen removed — GameController owns post-victory flow; VictoryScreen would conflict with EncounterCompleteScreen overlay"
  - "Actor-aware handleSkill still has DEADZONE/TORC branches by actorId string — TRINETRA is intentionally a no-op until Plan 03-06 wires the target picker"
  - "carryParty initialized from ENCOUNTER_CONFIGS[0].party (not empty) so E1 starts with correct initial party without requiring a pre-INIT flow"
  - "handleContinue increments encounterIndex then setBattleKey — both needed to force BattleScene remount with fresh state and new encounter data"

metrics:
  duration: "~4 minutes"
  completed_date: "2026-04-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 5
---

# Phase 3 Plan 04: Encounter Chain — GameController + EncounterCompleteScreen Summary

## What Was Built

Wired all Phase 3 encounters into a playable E1→E2→E3 chain. GameController owns the encounter state machine and HP/party carry-over logic. BattleScene was decoupled from hardcoded character data and is now fully parameterized. EncounterCompleteScreen appears between encounters showing party HP and a CONTINUAR button. page.tsx now renders GameController instead of BattleScene directly.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Parameterize BattleScene + multi-enemy targeting + background variants | fc0c122 | BattleScene.tsx, BattleScene.test.tsx, reducer.ts, battle.module.css |
| 2 | GameController + EncounterCompleteScreen + page.tsx | b50e9f9 | GameController.tsx (new), EncounterCompleteScreen.tsx (new), page.tsx |

## Implementation Details

### BattleScene Parameterization

The previous `BattleScene` hardcoded `DEADZONE` and `CASTING_PROBE_MK1` in the INIT dispatch and all action handlers. The new interface:

```typescript
interface BattleSceneProps {
  party: Character[];
  enemies: Enemy[];
  encounterIndex: number;
  onVictory: (finalParty: Character[]) => void;
  onGameOver: () => void;
}
```

Key changes:
- INIT uses `party` and `enemies` props
- VICTORY useEffect calls `onVictory(stateRef.current.party)` — stale closure guard (T-03-04-02)
- All handlers derive current actor from `turnQueue[currentTurnIndex]` — no hardcoded actorId in targets
- Multi-enemy rendering: `state.enemies.map(enemy => <EnemyPanel key={enemy.id} enemy={enemy} />)`
- Multi-party rendering: `state.party.map(character => <CharacterHUD key={character.id} character={character} />)`

### GameController State Machine

```
BATTLE → [onVictory] → ENCOUNTER_COMPLETE → [onContinue] → BATTLE (next encounter)
         [onGameOver] → BATTLE (same encounter, battleKey + 1)
```

ENC-05 implementation — transition from E1→E2:
```typescript
const nextParty = finalParty.map(c => ({
  ...c,
  en: c.maxEn,        // EN resets
  isDefending: false, // isDefending cleared
  statusEffects: [],  // Forge Wall and all statuses cleared
  isDefeated: false,  // revive if defeated (party carry)
}));
```

New party member injection — TORC joins after E1, TRINETRA after E2:
```typescript
const newMember = nextConfig.newPartyMember;
const nextPartyFull = newMember && !alreadyInParty.includes(newMember.id)
  ? [...nextParty, newMember]
  : nextParty;
```

### Reducer Dynamic Descriptions

ATTACK, DEFEND, and ITEM descriptions now use `actor.name` instead of the hardcoded string `"DEADZONE"`, so all three party members produce correct log entries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] BattleScene.test.tsx required props update**
- **Found during:** Task 1, `npx tsc --noEmit`
- **Issue:** `BattleScene.test.tsx` rendered `<BattleScene />` with no props — TypeScript error after interface change
- **Fix:** Added `defaultProps` object with `party: [DEADZONE], enemies: [CASTING_PROBE_MK1], encounterIndex: 0, onVictory: () => {}, onGameOver: () => {}` and updated both render calls
- **Files modified:** `src/components/BattleScene.test.tsx`
- **Commit:** fc0c122

## Test Results

| Suite | Before | After |
|-------|--------|-------|
| src/components/BattleScene.test.tsx | 2 passing + 4 todo | 2 passing + 4 todo |
| All other suites | 116 passing | 116 passing |
| **Total** | **118 + 4 todo** | **118 + 4 todo** |

## Known Stubs

- `handleSkill` in `BattleScene.tsx`: TRINETRA's skill is a no-op (`// TRINETRA: handled via skill picker in Plan 03-06`) — pressing SKILL as TRINETRA does nothing until Plan 03-06 wires the target selection UI. This is intentional per the plan and does not block E1/E2 progression (DEADZONE and TORC skills work correctly).

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure in-memory game logic and React component wiring.

- T-03-04-01 (Tampering — BattleScene party prop): mitigated — props are typed `Character[]`; no user-controlled strings reach dangerous sinks.
- T-03-04-02 (Denial — stale closure in onVictory): mitigated — `onVictory(stateRef.current.party)` in VICTORY useEffect confirmed by `grep -n "stateRef.current.party" src/components/BattleScene.tsx` returning 1 match at line 70.
- T-03-04-03 (Denial — key prop not incrementing): mitigated — `battleKey` increments in both `handleGameOver` and `handleContinue`; confirmed by grep returning 3 matches in GameController.tsx.

## Self-Check: PASSED

- `src/components/BattleScene.tsx` — FOUND
- `src/components/GameController.tsx` — FOUND
- `src/components/EncounterCompleteScreen.tsx` — FOUND
- `src/app/page.tsx` — FOUND
- `src/engine/reducer.ts` — FOUND
- `src/styles/battle.module.css` — FOUND
- Commit fc0c122 (BattleScene parameterization) — FOUND
- Commit b50e9f9 (GameController + EncounterCompleteScreen) — FOUND
- `grep -n "party: Character\[\]" src/components/BattleScene.tsx` — 1 match (line 43, BattleSceneProps)
- `grep -n "onVictory" src/components/BattleScene.tsx` — 6 matches (prop, useEffect, call, comment)
- `grep -n "stateRef.current.party" src/components/BattleScene.tsx` — 1 match (line 70)
- `grep -n "actor.name" src/engine/reducer.ts` — 3 matches (ATTACK, DEFEND, ITEM)
- `grep -n "CONTINUAR" src/components/EncounterCompleteScreen.tsx` — 1 match
- `grep -n "ENCOUNTER_CONFIGS" src/components/GameController.tsx` — 4 matches
- `grep -n "en: c.maxEn" src/components/GameController.tsx` — 1 match
- `grep -n "statusEffects: \[\]" src/components/GameController.tsx` — 1 match
- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — 118 passed, 0 failed, 4 todo
