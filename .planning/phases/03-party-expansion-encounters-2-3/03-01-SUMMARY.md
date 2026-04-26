---
phase: 03-party-expansion-encounters-2-3
plan: "01"
subsystem: battle-engine
tags: [bug-fix, data-types, regression-tests, tdd]
one_liner: "Fixed 4 latent reducer/AI bugs (WR-01–04) with regression tests; extended EnemyId to 7 instance IDs; added TORC, TRINETRA, 6 enemies, and ENCOUNTER_CONFIGS"

dependency_graph:
  requires: []
  provides:
    - WR-01/02 fix: ENEMY_ACTION skip and NEXT_TURN now derive nextPhase from queue entry kind
    - WR-03 fix: AI stubs return no-op instead of throwing when no valid targets
    - WR-04 fix: enemy HP clamped to maxHp on positive hpDelta
    - EnemyId union with 7 instance-level IDs
    - TORC and TRINETRA character exports
    - 6 enemy instances (NETWORKER_ENFORCER_A/B, CASTING_PATROL_BOT_A/B/C)
    - ENCOUNTER_CONFIGS array with 3 encounter definitions
    - PlayerAction.skillVariant field
  affects:
    - src/engine/reducer.ts
    - src/engine/enemyAI.ts
    - src/engine/types.ts
    - src/data/characters.ts
    - src/data/enemies.ts
    - src/data/encounters.ts (new)
    - src/engine/reducer.test.ts
    - src/engine/enemyAI.test.ts
    - src/engine/turnQueue.test.ts

tech_stack:
  added: []
  patterns:
    - "nextPhase derived from turnQueue entry kind field (not hardcoded)"
    - "AI no-op return pattern (console.error + return) instead of throw for defensive guards"
    - "Shared base object spread for enemy instance variants (networkerEnforcerBase, patrolBotBase)"
    - "EncounterConfig interface with newPartyMember for progressive party reveal"

key_files:
  created:
    - path: src/data/encounters.ts
      purpose: "ENCOUNTER_CONFIGS array — 3 encounter definitions with party/enemy groupings"
  modified:
    - path: src/engine/reducer.ts
      change: "WR-01 (ENEMY_ACTION skip phase), WR-02 (NEXT_TURN phase), WR-04 (enemy HP clamp)"
    - path: src/engine/enemyAI.ts
      change: "WR-03: replaced throw with console.error + no-op return in ALWAYS_ATTACK and stubAction"
    - path: src/engine/types.ts
      change: "EnemyId extended to 7 IDs; PlayerAction.skillVariant added"
    - path: src/data/characters.ts
      change: "TORC and TRINETRA exports added"
    - path: src/data/enemies.ts
      change: "6 enemy instances added (NETWORKER_ENFORCER_A/B, CASTING_PATROL_BOT_A/B/C)"
    - path: src/engine/reducer.test.ts
      change: "7 new regression tests: WR-01 x2, WR-02 x2, WR-03 (enemyAI.test.ts), WR-04 x1"
    - path: src/engine/enemyAI.test.ts
      change: "WR-03 regression tests; updated 2 existing throw-expectation tests to no-op"
    - path: src/engine/turnQueue.test.ts
      change: "NETWORKER_ENFORCER → NETWORKER_ENFORCER_A (Rule 1 fix for EnemyId type change)"

decisions:
  - "Instance-level EnemyIds (NETWORKER_ENFORCER_A/B, CASTING_PATROL_BOT_A/B/C) chosen over generic IDs so the reducer can distinguish enemies within the same encounter for skip logic and targeting"
  - "AI no-op return (console.error + return) preferred over throw — GAME_OVER fires before reaching empty-targets guard in correct game flow; throw was a defensive overreach that caused test friction"
  - "ENCOUNTER_CONFIGS as immutable data objects (not factory functions) — all encounter state is cloned at INIT dispatch, so shared object references are safe"

metrics:
  duration: "~8 minutes"
  completed_date: "2026-04-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 7
---

# Phase 3 Plan 01: Wave 0 Foundation — Bug Fixes + Data Extension Summary

## What Was Built

Fixed 4 latent reducer and AI bugs (WR-01 through WR-04) with TDD regression tests, then extended all data types and added the full character/enemy roster and encounter configuration table needed for Phase 3 encounters to run.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix WR-01/02/03/04 with regression tests | 1a462a6 | reducer.ts, enemyAI.ts, reducer.test.ts, enemyAI.test.ts |
| 2 | Extend types + add character/enemy data + encounters | 4483103 | types.ts, characters.ts, enemies.ts, encounters.ts (new), turnQueue.test.ts |

## Bugs Fixed

### WR-01: ENEMY_ACTION skip — game hangs in ENEMY_TURN after killing an enemy

**Root cause:** When a defeated enemy's turn was skipped, the reducer returned the state with phase unchanged (still ENEMY_TURN or PLAYER_INPUT from before). With 2 Networker Enforcers, killing Enforcer A mid-round left the game stuck in ENEMY_TURN waiting for an action that never fires.

**Fix:** Both the mid-round path and end-of-round path in `ENEMY_ACTION` now derive `nextPhase` from `state.turnQueue[nextIndex]?.kind === 'player'`.

### WR-02: NEXT_TURN — phase not updated on turn advance

**Root cause:** `NEXT_TURN` incremented `currentTurnIndex` but never updated `phase`, leaving it at whatever the previous phase was. If the previous combatant was a player, the next enemy turn would start in `PLAYER_INPUT` — causing the action menu to appear during the enemy turn.

**Fix:** `NEXT_TURN` now derives `nextPhase` from the next queue entry's `kind` field in both the same-round and end-of-round paths.

### WR-03: AI stubs throw when no valid targets

**Root cause:** `stubAction` and `ALWAYS_ATTACK` threw `Error` when `validTargets.length === 0`. With multi-enemy encounters, a race condition could reach this guard before `GAME_OVER` fired.

**Fix:** Both functions now `console.error` and return a no-op `ResolvedAction` with `description: '(no targets)'`. GAME_OVER still fires correctly via `ACTION_RESOLVED` end-condition check — the no-op is just a defensive fallback.

### WR-04: Enemy HP could exceed maxHp on positive hpDelta

**Root cause:** `ACTION_RESOLVED` applied `Math.max(0, e.hp + delta.amount)` to enemies without the upper clamp (`Math.min(e.maxHp, ...)`). Any positive hpDelta (e.g., from TRINETRA's System Override healing an enemy by accident, or test scenarios) would push enemy HP above maxHp.

**Fix:** Enemy HP delta now uses `Math.max(0, Math.min(e.maxHp, e.hp + delta.amount))`, matching the existing party member HP clamp.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated turnQueue.test.ts to use instance-level EnemyId**
- **Found during:** Task 2, `npx tsc --noEmit`
- **Issue:** `turnQueue.test.ts` referenced `'NETWORKER_ENFORCER'` (old generic ID removed from EnemyId union when extending to instance-level IDs)
- **Fix:** Changed to `'NETWORKER_ENFORCER_A'` in both the factory call and the assertion
- **Files modified:** `src/engine/turnQueue.test.ts`
- **Commit:** 4483103

**2. [Rule 1 - Bug] Updated existing enemyAI.test.ts throw-expectation tests**
- **Found during:** Task 1 GREEN phase (WR-03 fix)
- **Issue:** Two tests expected `resolveEnemyAction` and `AI_BEHAVIORS['ALWAYS_ATTACK']` to throw — behavior changed by WR-03 fix
- **Fix:** Updated test descriptions and assertions to expect no-op return with `description: '(no targets)'`
- **Files modified:** `src/engine/enemyAI.test.ts`
- **Commit:** 1a462a6

## Test Results

| Suite | Before | After |
|-------|--------|-------|
| src/engine/reducer.test.ts | 43 | 48 |
| src/engine/enemyAI.test.ts | 12 | 14 |
| src/engine/turnQueue.test.ts | 5 | 5 |
| All other suites | 31 | 31 |
| **Total** | **91** | **98** |

## Known Stubs

- `TARGET_LOWEST_HP` in `src/engine/enemyAI.ts`: returns stub description `"Networker Enforcer acts (target_lowest_hp stub)"` — real implementation is Plan 03-02's scope
- `ATTACK_RANDOM` in `src/engine/enemyAI.ts`: returns stub description — real implementation is Plan 03-03's scope
- `OVERDRIVE_BOSS` in `src/engine/enemyAI.ts`: returns stub description — Phase 4 scope

These stubs do not block the plan's goal (foundation data and bug fixes). Plans 03-02 and 03-03 will wire the real implementations.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure in-memory game logic. T-03-01-02 (reducer infinite loop) is mitigated by WR-01/02 fix as planned.

## Self-Check: PASSED

- `src/engine/reducer.ts` — FOUND ✓
- `src/engine/enemyAI.ts` — FOUND ✓
- `src/engine/types.ts` — FOUND ✓
- `src/data/characters.ts` — FOUND ✓
- `src/data/enemies.ts` — FOUND ✓
- `src/data/encounters.ts` — FOUND ✓
- `src/engine/reducer.test.ts` — FOUND ✓
- `src/engine/enemyAI.test.ts` — FOUND ✓
- `src/engine/turnQueue.test.ts` — FOUND ✓
- Commit 1a462a6 — FOUND ✓
- Commit 4483103 — FOUND ✓
