---
phase: 03-party-expansion-encounters-2-3
plan: "03"
subsystem: battle-engine
tags: [tdd, ai-behaviors, enemy-ai, bug-fix]
one_liner: "Implemented TARGET_LOWEST_HP (AI-03) and ATTACK_RANDOM (AI-04) replacing Phase 1 stubs; 8 new TDD tests; only OVERDRIVE_BOSS remains as stub"

dependency_graph:
  requires:
    - 03-01 (WR-03 fix: stubs return no-op instead of throw; EnemyId union with instance IDs)
  provides:
    - TARGET_LOWEST_HP: real impl — sorts alive party by hp asc, attacks lowest; 0.5 multiplier when defending
    - ATTACK_RANDOM: real impl — Math.random() selection from alive party; 0.5 multiplier when defending
    - Both behaviors: no-op return (not throw) when no valid targets (T-03-03-01 mitigate)
  affects:
    - src/engine/enemyAI.ts
    - src/engine/enemyAI.test.ts

tech_stack:
  added: []
  patterns:
    - "AI behavior: filter(!isDefeated) → sort(hp asc)[0] for TARGET_LOWEST_HP"
    - "AI behavior: filter(!isDefeated) → Math.random() index for ATTACK_RANDOM"
    - "Defending multiplier: calculateDamage(enemy, target, { damageMultiplier: target.isDefending ? 0.5 : 1.0 })"
    - "TDD defending test: use single low-DEF target to make damage difference observable across multipliers"

key_files:
  created: []
  modified:
    - path: src/engine/enemyAI.ts
      change: "TARGET_LOWEST_HP real implementation (AI-03); ATTACK_RANDOM real implementation (AI-04)"
    - path: src/engine/enemyAI.test.ts
      change: "4 TDD tests for TARGET_LOWEST_HP; 4 TDD tests for ATTACK_RANDOM; import calculateDamage"

decisions:
  - "DEADZONE (DEF:10) used as sole alive target in ATTACK_RANDOM defending multiplier test — TORC (DEF:20) causes damage to floor at 1 in both defending/non-defending states making the multiplier difference unobservable"
  - "stubAction function retained (not deleted) because OVERDRIVE_BOSS still uses it; only called from OVERDRIVE_BOSS entry"
  - "Math.random() placement inside ATTACK_RANDOM AI function (not reducer) — QA-04 compliant: dispatch is a discrete event, not render path"

metrics:
  duration: "~3 minutes"
  completed_date: "2026-04-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 3 Plan 03: TARGET_LOWEST_HP + ATTACK_RANDOM AI Behaviors Summary

## What Was Built

Replaced two Phase 1 AI stubs with real implementations. Networker Enforcers now prioritize the party member with lowest remaining HP (TARGET_LOWEST_HP). Casting Patrol Bots now randomly select an alive party member each turn (ATTACK_RANDOM). Both behaviors correctly apply a 0.5 damage multiplier when the target is defending, and both return a no-op action instead of throwing when no valid targets exist.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TARGET_LOWEST_HP AI (Networker Enforcer) — TDD | fd25cee | enemyAI.ts, enemyAI.test.ts |
| 2 | ATTACK_RANDOM AI (Casting Patrol Bot) — TDD | 1c7021d | enemyAI.ts, enemyAI.test.ts |

## TDD Cycle per Task

### Task 1 — TARGET_LOWEST_HP

**RED:** Added 4 failing tests — selects lowest HP target, defending 0.5 multiplier, no-op when all defeated, description mentions target name. Suite: 3 failing (stub returns no hpDelta).

**GREEN:** Replaced stub with `[...validTargets].sort((a, b) => a.hp - b.hp)[0]` implementation. Suite: 18 passing.

**REFACTOR:** None needed — implementation was clean on first pass.

### Task 2 — ATTACK_RANDOM

**RED:** Added 4 failing tests — valid alive target, never targets defeated, defending multiplier, no-op when all defeated. Suite: 3 failing (stub returns no hpDelta).

**GREEN:** Replaced stub with `Math.random()` index selection. Suite: 22 passing. Full suite: 106 passing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ATTACK_RANDOM defending multiplier test: switched test target from TORC to DEADZONE**
- **Found during:** Task 2, GREEN phase — test "ATTACK_RANDOM: applies 0.5 damage multiplier when target is defending" failed after implementation
- **Issue:** TORC has DEF:20 vs Patrol Bot ATK:13. Base damage = 13-20 = -7, floored to max(1, ...) = 1 in BOTH defending and non-defending states. The 0.5 multiplier difference is invisible when both paths hit minimum damage.
- **Fix:** Changed test target to DEADZONE (DEF:10). Base damage = 13-10 = 3. Not-defending: max(1, floor(3*1.0)) = 3. Defending: max(1, floor(3*0.5)) = max(1,1) = 1. Difference (3 > 1) is clearly observable.
- **Files modified:** `src/engine/enemyAI.test.ts`
- **Commit:** 1c7021d

## Test Results

| Suite | Before (plan 03-01) | After |
|-------|---------------------|-------|
| src/engine/enemyAI.test.ts | 14 | 22 |
| src/engine/reducer.test.ts | 48 | 48 |
| All other suites | 40 | 40 |
| **Total** | **102** | **106** |

## Known Stubs

- `OVERDRIVE_BOSS` in `src/engine/enemyAI.ts`: still uses `stubAction` — Phase 4 scope. Does not affect Phase 3 encounter functionality.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure in-memory game logic. T-03-03-01 (AI no-valid-targets denial) mitigated by no-op return in both TARGET_LOWEST_HP and ATTACK_RANDOM. T-03-03-02 (Math.random in ATTACK_RANDOM) accepted per threat register.

## Self-Check: PASSED

- `src/engine/enemyAI.ts` — FOUND
- `src/engine/enemyAI.test.ts` — FOUND
- Commit fd25cee (TARGET_LOWEST_HP) — FOUND
- Commit 1c7021d (ATTACK_RANDOM) — FOUND
- `npx vitest run` — 106 passed, 0 failed
- `npx tsc --noEmit` — 0 errors
