---
phase: 02-encounter-1-deadzone-solo
plan: "02"
subsystem: battle-engine
tags: [reducer, tdd, player-action, action-resolved, enemy-action, damage, defend, item]
dependency_graph:
  requires: [02-01]
  provides: [real-player-action-routing, real-action-resolved-delta-applier, enemy-action-base-wiring]
  affects: [BattleScene.tsx, ActionMenu, BattleLog]
tech_stack:
  added: []
  patterns:
    - "Single delta applier pattern: all hp/en mutations happen exclusively in ACTION_RESOLVED"
    - "isDefending cleared at PLAYER_ACTION dispatch (not at turn advance) — A1 pattern"
    - "End conditions checked BEFORE queue advance in ACTION_RESOLVED — prevents dead-enemy-acts bug"
    - "ITEM heal capped at min(30, maxHp - hp) at dispatch time to prevent overheal"
    - "nanoMed decremented at PLAYER_ACTION ITEM dispatch, not at ACTION_RESOLVED"
key_files:
  created: []
  modified:
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts
decisions:
  - "isDefending set immediately in PLAYER_ACTION DEFEND (not deferred to ACTION_RESOLVED) so AI can read the flag at enemy turn"
  - "nanoMed decremented at PLAYER_ACTION time (not ACTION_RESOLVED) to keep item exhaustion guard simple and atomic"
  - "ITEM heal amount capped at dispatch time (min(30, maxHp-hp)) so hpDelta carries the actual heal not 30 flat"
  - "SKILL case returns state silently when en < 8; full Signal Null implementation deferred to Plan 03"
  - "ENEMY_ACTION keeps stub structure (returns placeholder pendingAction) for Plan 03 to drop in resolveEnemyAction"
metrics:
  duration: "~12 minutes"
  completed: "2026-04-26"
  tasks_completed: 1
  files_modified: 2
---

# Phase 02 Plan 02: Reducer — Real PLAYER_ACTION routing + ACTION_RESOLVED delta applier

One-liner: Reducer stubs replaced with real ATTACK/DEFEND/ITEM routing and a single-delta-applier ACTION_RESOLVED that marks defeated combatants, checks end conditions, and advances the turn queue.

## What Was Built

Replaced three reducer stubs with real battle logic, following the TDD cycle (RED → GREEN).

**PLAYER_ACTION** is now a router:
- `ATTACK`: calls `calculateDamage(actor, target)`, builds `ResolvedAction` with `hpDelta: [{targetId, amount: -dmg}]`
- `DEFEND`: sets `isDefending: true` on actor immediately, recovers `min(5, maxEn - en)` EN via `enDelta`, animationType `DEFEND`
- `ITEM` (Nano-Med): heals `min(30, maxHp - hp)` HP via `hpDelta`, decrements `items.nanoMed`, guards `nanoMed <= 0` returning same state reference
- `SKILL`: returns same state when `en < 8` (EN guard; full implementation in Plan 03)
- All cases clear `isDefending` on the acting character at dispatch start

**ACTION_RESOLVED** is now the single delta applier:
- Applies `hpDelta` to party (clamped `Math.max(0, Math.min(maxHp, hp + amount))`) and enemies (clamped floor at 0)
- Applies `enDelta` to party (clamped `Math.max(0, Math.min(maxEn, en + amount))`)
- Marks `isDefeated: true` when `newHp <= 0`
- Checks `VICTORY` (all enemies defeated) and `GAME_OVER` (all party defeated) BEFORE advancing the queue
- Advances `currentTurnIndex`; on queue exhaustion, rebuilds via `buildTurnQueue` and increments `round`
- Routes to `PLAYER_INPUT` or `ENEMY_TURN` based on next entry's `kind`

**ENEMY_ACTION** keeps the stub structure with `pendingAction` wired (Plan 03 drops in `resolveEnemyAction`).

## Test Coverage

36 tests total in `reducer.test.ts` — all passing.

New tests added (20):
- ENGINE-07 (3 tests): ATTACK hpDelta=-16, ACTION_RESOLVED applies delta (probe hp=24), advances to ENEMY_TURN
- ENGINE-08 (5 tests): DEFEND animationType, enDelta capped at maxEn, isDefending set immediately, cleared on next action
- ENGINE-09/10 (5 tests): ITEM hpDelta=+30, heal capped at headroom, nanoMed decremented, nanoMed=0 guard, clamping in ACTION_RESOLVED
- SKILL EN guard (1 test): same state reference when en < 8
- ACTION_RESOLVED end conditions (3 tests): VICTORY before queue advance, GAME_OVER on party wipe, no ENEMY_TURN after kill
- Full turn cycle integration (1 test): INIT → ATTACK → ACTION_RESOLVED → ENEMY_TURN → ENEMY_ACTION → ACTION_RESOLVED → PLAYER_INPUT
- EN delta application (2 tests): enDelta applied and clamped at maxEn in ACTION_RESOLVED
- ENEMY_ACTION base wiring (1 test): pendingAction.actorId set

Prior tests: 16 passing (all green — 2 required targetId fix since ATTACK now calls calculateDamage and needs a real target).

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `936fe86` | `test` | RED: add failing tests for ENGINE-07/08/09/10 and turn cycle |
| `be59403` | `feat` | GREEN: implement real PLAYER_ACTION routing and ACTION_RESOLVED delta applier |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Two pre-existing tests dispatched ATTACK without targetId**
- **Found during:** GREEN phase (tests failed with `Cannot read properties of undefined (reading 'statusEffects')`)
- **Issue:** Old stub didn't call `calculateDamage` so missing `targetId` was harmless. Real implementation calls `calculateDamage(actor, target)` where `target = state.enemies.find(e => e.id === targetId)` — undefined when no targetId provided.
- **Fix:** Added `targetId: 'CASTING_PROBE_MK1'` to the two legacy test dispatches (`accepts PLAYER_ACTION` and `does NOT mutate prior state`).
- **Files modified:** `src/engine/reducer.test.ts`
- **Commit:** `be59403` (included in GREEN commit alongside implementation)

### Design Clarifications Applied

Per research A1, A3:
- `isDefending` cleared at PLAYER_ACTION dispatch (not at turn advance) — simpler and consistent
- `ITEM` auto-targets self in Phase 2 (`targetId ?? actorId`); Phase 3 adds target selector UI

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure reducer logic (in-memory state transitions only).

Threat mitigations from plan applied:
- T-02-02-01: HP clamping via `Math.max(0, Math.min(c.maxHp, c.hp + delta.amount))` — verified by test "clamps hp at maxHp"
- T-02-02-02: `if (state.items.nanoMed <= 0) return state` guard — verified by test "returns same state when nanoMed is 0"
- T-02-02-03: `isDefending` cleared at PLAYER_ACTION start — verified by "clears isDefending from previous turn" test
- T-02-02-04: VICTORY/GAME_OVER checked before queue advance — verified by "does NOT advance to ENEMY_TURN when enemy defeated" test

## Known Stubs

- `PLAYER_ACTION SKILL` case: returns `state` silently when `en >= 8` (no implementation yet). Plan 03 (Signal Null) fills this in.
- `ENEMY_ACTION` case: returns placeholder `pendingAction` with no `hpDelta`. Plan 03 wires `resolveEnemyAction`.

These stubs are intentional and documented in the plan. They do not block Plan 02's goal (real ATTACK/DEFEND/ITEM routing). Plan 03 resolves them.

## Self-Check: PASSED

Files exist:
- FOUND: src/engine/reducer.ts (267 lines)
- FOUND: src/engine/reducer.test.ts (712 lines, 36 tests passing)

Commits exist:
- FOUND: 936fe86 (test RED phase)
- FOUND: be59403 (feat GREEN phase)

All 36 tests green. Pre-existing tsc error (`@testing-library/react` not found in `gameStateRef.test.ts`) confirmed pre-existing before this plan via `git stash` verification — not introduced by this plan.
