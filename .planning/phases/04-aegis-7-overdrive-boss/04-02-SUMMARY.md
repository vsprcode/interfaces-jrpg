---
phase: 4
plan: "04-02"
subsystem: "engine/AI + engine/reducer"
tags: [overdrive, tdd, ai, reducer, battle-engine]
dependency_graph:
  requires: [04-01]
  provides: [OVERDRIVE_BOSS-AI, OVERDRIVE-phase-transitions, overdrivePending-routing]
  affects: [src/engine/enemyAI.ts, src/engine/reducer.ts]
tech_stack:
  added: []
  patterns: [TDD red-green, three-way phase routing, animationType-as-discriminator]
key_files:
  created: []
  modified:
    - src/engine/enemyAI.ts
    - src/engine/enemyAI.test.ts
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts
decisions:
  - "TERMINUS branch runs before no-targets guard in OVERDRIVE_BOSS — so Test E (all defeated) returns OVERDRIVE_TERMINUS with empty hpDelta rather than the no-targets ATTACK fallback"
  - "ENEMY_ACTION with OVERDRIVE_WARNING sets phase=RESOLVING (not OVERDRIVE_WARNING) so animation loop fires ACTION_RESOLVED before routing player turns to OVERDRIVE_WARNING"
  - "Three-way routing applied at both ACTION_RESOLVED nextPhase derivation points (end-of-round and mid-round) — symmetrical logic prevents routing divergence"
  - "newOverdrivePending computed once before both nextPhase derivations, not inline — single source of truth"
  - "import('./types').BattlePhase used inline for nextPhase type annotation — avoids adding a redundant import at the top of reducer.ts"
metrics:
  duration: "~14 minutes"
  completed: "2026-04-26"
  tasks_completed: 2
  files_modified: 4
---

# Phase 4 Plan 02: Wave 1 — OVERDRIVE Engine (TDD) Summary

Replaced the OVERDRIVE_BOSS stub with full TERMINUS logic and wired all OVERDRIVE phase transitions in the reducer using TDD. 13 new tests (6 AI, 7 reducer) cover every enumerated edge case; 116 total engine tests pass with zero regressions.

## Test Results

```
Test Files  5 passed (5)
     Tests  116 passed (116)  (+14 from Wave 0 baseline of 102)
  Duration  ~973ms
```

Baseline before this plan: 102 tests. After: 116 (+14 — 6 AI + 8 reducer, Test L was already covered by pre-existing GAME_OVER routing).

## Tests Written: A-M

### AI Tests (enemyAI.test.ts)

| Test | What it verifies |
|------|-----------------|
| A | AEGIS_7 hp=99, ENEMY_TURN, overdrivePending=false → animationType OVERDRIVE_WARNING, no hpDelta (OVERDRIVE-01) |
| B | AEGIS_7 hp=99, ENEMY_TURN, overdrivePending=true → animationType ATTACK with hpDelta (OVERDRIVE-08 double-announce guard) |
| C | AEGIS_7 in OVERDRIVE_RESOLVING, alive non-defender → OVERDRIVE_TERMINUS, hpDelta includes -999 (OVERDRIVE-04) |
| D | AEGIS_7 in OVERDRIVE_RESOLVING, one defender + one non-defender → hpDelta only for non-defender (OVERDRIVE-04 + 06) |
| E | AEGIS_7 in OVERDRIVE_RESOLVING, all party defeated → OVERDRIVE_TERMINUS with empty hpDelta [] (OVERDRIVE-06) |
| F | AEGIS_7 hp=150, ENEMY_TURN → ATTACK (above 100 HP threshold, no OVERDRIVE announcement) |

### Reducer Tests (reducer.test.ts)

| Test | What it verifies |
|------|-----------------|
| G | PLAYER_ACTION DEFEND in OVERDRIVE_WARNING → new state phase=RESOLVING (guard expanded — OVERDRIVE-07) |
| H | PLAYER_ACTION ATTACK in OVERDRIVE_WARNING → new state phase=RESOLVING (all actions pass in OVERDRIVE_WARNING) |
| I | ENEMY_ACTION AEGIS_7 hp<100, overdrivePending=false → phase=RESOLVING, overdrivePending=true (OVERDRIVE-01+02) |
| J | ACTION_RESOLVED overdrivePending=true, next=player → phase=OVERDRIVE_WARNING (OVERDRIVE-02) |
| J2 | ACTION_RESOLVED overdrivePending=true, next=enemy → phase=OVERDRIVE_RESOLVING (OVERDRIVE-02) |
| K | ENEMY_ACTION in OVERDRIVE_RESOLVING → reducer accepts it, pendingAction.animationType=OVERDRIVE_TERMINUS (OVERDRIVE-04) |
| L | ACTION_RESOLVED, all party hp=0 → GAME_OVER fires before OVERDRIVE routing (OVERDRIVE-05) — pre-existing logic |
| M | After TERMINUS resolves: overdrivePending=false; next AEGIS ENEMY_ACTION in ENEMY_TURN produces fresh OVERDRIVE_WARNING (OVERDRIVE-08) |

## Exact Reducer Change Points (for Wave 2 reference)

All changes are in `src/engine/reducer.ts`:

| Line | Change | Description |
|------|--------|-------------|
| 48-49 | PLAYER_ACTION guard | `state.phase !== 'PLAYER_INPUT' && state.phase !== 'OVERDRIVE_WARNING'` — accepts OVERDRIVE_WARNING |
| 323-327 | newOverdrivePending | Computed once before both nextPhase derivations; resets to false after OVERDRIVE_TERMINUS |
| 338-342 | ACTION_RESOLVED end-of-round nextPhase | Three-way: OVERDRIVE_RESOLVING / OVERDRIVE_WARNING / PLAYER_INPUT / ENEMY_TURN |
| 352 | ACTION_RESOLVED end-of-round return | `overdrivePending: newOverdrivePending` propagated in returned state |
| 358-362 | ACTION_RESOLVED mid-round nextPhase | Three-way routing (same pattern as end-of-round) |
| 370 | ACTION_RESOLVED mid-round return | `overdrivePending: newOverdrivePending` propagated in returned state |
| 376-377 | ENEMY_ACTION guard | `state.phase !== 'ENEMY_TURN' && state.phase !== 'OVERDRIVE_RESOLVING'` — accepts OVERDRIVE_RESOLVING |
| 394-403 | ENEMY_ACTION OVERDRIVE_WARNING detection | Sets phase=RESOLVING + overdrivePending=true when animationType=OVERDRIVE_WARNING |

## Edge Cases Discovered During TDD

### Test E: TERMINUS branch must precede no-targets guard

**Found during:** Task 1 GREEN phase (Test E failing after initial implementation)

**Issue:** The initial OVERDRIVE_BOSS implementation placed the `validTargets.length === 0` guard before the `OVERDRIVE_RESOLVING` branch. When all party members are defeated, `validTargets` is empty, so the guard fired and returned `animationType: 'ATTACK'` — but Test E requires `OVERDRIVE_TERMINUS` with empty `hpDelta`.

**Fix:** Moved the `OVERDRIVE_RESOLVING` branch to run first, before any target existence check. This is correct by design: TERMINUS still fires (and logs to battle) even when all targets are defeated — `hpDelta` is simply empty, and the GAME_OVER check in ACTION_RESOLVED handles the wipe.

**Impact:** The `validTargets` filter is now computed twice (once inside the OVERDRIVE_RESOLVING branch, once after it for the normal attack path). This is intentional — two small `.filter()` calls on a 3-element array are negligible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TERMINUS branch must run before no-targets guard**
- **Found during:** Task 1 GREEN phase — Test E failing
- **Issue:** No-targets guard returned `ATTACK` when party fully defeated in OVERDRIVE_RESOLVING; expected `OVERDRIVE_TERMINUS` with empty hpDelta
- **Fix:** Restructured OVERDRIVE_BOSS so OVERDRIVE_RESOLVING branch runs unconditionally first, then falls through to no-targets guard only for ENEMY_TURN modes
- **Files modified:** `src/engine/enemyAI.ts`
- **Commit:** `c5717ec`

None in Task 2 — reducer changes implemented exactly as specified.

## Known Stubs

None. OVERDRIVE_BOSS stub is fully replaced. No placeholder text or hardcoded empty values introduced.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure in-memory battle engine logic.

## Self-Check: PASSED

- `src/engine/enemyAI.ts` — FOUND, contains `OVERDRIVE_RESOLVING`, `OVERDRIVE_TERMINUS`, `OVERDRIVE_WARNING`
- `src/engine/enemyAI.test.ts` — FOUND, contains Tests A-F
- `src/engine/reducer.ts` — FOUND, contains `OVERDRIVE_WARNING` in both guards and routing
- `src/engine/reducer.test.ts` — FOUND, contains Tests G-M
- Commit `c5717ec` — Task 1 (AI tests + implementation)
- Commit `4a502f0` — Task 2 (reducer tests + transitions)
- 116 tests passed, 0 failures, `npx tsc --noEmit` exits 0
