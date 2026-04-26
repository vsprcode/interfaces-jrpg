---
phase: 02-encounter-1-deadzone-solo
plan: "03"
subsystem: battle-engine
tags: [skill, enemy-ai, reducer, tdd, signal-null, always-attack]
dependency_graph:
  requires:
    - 02-01  # initial reducer stubs
    - 02-02  # PLAYER_ACTION real routing, ACTION_RESOLVED delta applier
  provides:
    - SKILL case in reducer (Signal Null, defPenetration 0.7, EN cost 8)
    - ALWAYS_ATTACK real AI (calculateDamage, isDefending multiplier)
    - ENEMY_ACTION wired to resolveEnemyAction
  affects:
    - src/engine/reducer.ts
    - src/engine/enemyAI.ts
tech_stack:
  added: []
  patterns:
    - TDD red-green (commit RED tests, then commit GREEN implementation)
    - Pure functions — no mutations, same-reference no-op for EN gate
    - defPenetration modifier to calculateDamage for skill damage
    - damageMultiplier:0.5 via calculateDamage for defending targets
key_files:
  created: []
  modified:
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts
    - src/engine/enemyAI.ts
    - src/engine/enemyAI.test.ts
decisions:
  - SKILL EN gate returns identical state reference (same object, not copy) to prevent re-render on no-op
  - ALWAYS_ATTACK uses probe name directly in lore text (description hardcodes "Casting Probe MK-I" for correct lore voice)
  - Defeated enemy in ENEMY_ACTION advances turn index without entering RESOLVING (T-02-03-03 guard)
  - resolveEnemyAction receives reducer's fresh `state` parameter — not a stale closure (T-02-03-04 accepted)
metrics:
  duration_minutes: 8
  completed_date: "2026-04-26"
  tasks_completed: 3
  files_modified: 4
requirements:
  - SKILL-01
  - SKILL-04
  - AI-02
---

# Phase 2 Plan 03: Signal Null SKILL Case + ALWAYS_ATTACK AI Summary

Signal Null SKILL action (defPenetration 0.7, EN cost 8, animationType SKILL_ELECTRIC) added to reducer; ALWAYS_ATTACK AI replaced with real calculateDamage implementation supporting isDefending multiplier; ENEMY_ACTION wired to resolveEnemyAction with defeated-enemy guard.

## What Was Built

### Signal Null SKILL case (`src/engine/reducer.ts`)

The `case 'SKILL'` stub in `PLAYER_ACTION` now resolves as follows:

- **EN gate (SKILL-04):** `if (actor.en < 8) return state` — returns identical state reference, not a copy. Tests assert `toBe(state)` (strict identity). This prevents unnecessary re-renders when the UI correctly disables the button but a dispatch leaks through.
- **Damage (SKILL-01):** `calculateDamage(actor, target, { defPenetration: 0.7 })` — against CASTING_PROBE_MK1 (DEF 6): `effectiveDef = floor(6 * 0.7) = 4`, `dmg = max(1, 22 - 4) = 18`.
- **ResolvedAction:** `hpDelta: [{ targetId, amount: -18 }]`, `enDelta: [{ targetId: actorId, amount: -8 }]`, `animationType: 'SKILL_ELECTRIC'`.
- **Log entry:** `"DEADZONE transmite SIGNAL NULL — protocolo de ruído digital ativado — 18 de dano (DEF ignorada em 30%)"`.

### ALWAYS_ATTACK real implementation (`src/engine/enemyAI.ts`)

The stub `ALWAYS_ATTACK: (enemy, state) => stubAction(...)` is replaced with:

1. Filters `state.party` for `!isDefeated` — throws if empty (existing guard preserved).
2. Picks `validTargets[0]` — first alive party member (deterministic, AI-02).
3. Calls `calculateDamage(enemy, target, { damageMultiplier: target.isDefending ? 0.5 : 1.0 })`.
4. Returns lore-flavored description (normal vs defending variant) and `hpDelta`.

Damage math: PROBE ATK 14, DEADZONE DEF 10 → `dmg = max(1, 14 - 10) = 4` normal; `max(1, floor(4 * 0.5)) = 2` when defending.

`calculateDamage` imported from `./damage` at module top.

### ENEMY_ACTION wiring (`src/engine/reducer.ts`)

`case 'ENEMY_ACTION'` now:

1. Looks up enemy by `enemyId`; if not found or `isDefeated`, advances `currentTurnIndex` (or rebuilds queue at end of round) without entering RESOLVING — threat T-02-03-03 mitigated.
2. Calls `resolveEnemyAction(enemy, state)` — fresh `state` parameter, no stale closure.
3. Returns `{ ...state, phase: 'RESOLVING', pendingAction: resolvedAction, log: [...] }`.

`resolveEnemyAction` imported from `./enemyAI` at module top.

## Test Coverage

| File | Tests Before | Tests After | New Tests |
|------|-------------|-------------|-----------|
| `reducer.test.ts` | 36 | 43 | 7 (SKILL-01×4, SKILL-04×2, ENEMY_ACTION integration×2) |
| `enemyAI.test.ts` | 4 | 12 | 8 (ALWAYS_ATTACK real: targeting, damage, defending, lore, skip-defeated, throw) |
| **Total engine** | **40** | **55** | **15** |

Full suite: 72 tests passing (up from 57 before this plan). No regressions.

## Verification Results

```
npm run test -- --run src/engine/reducer.test.ts src/engine/enemyAI.test.ts

Test Files  2 passed (2)
Tests  55 passed (55)
```

```
npx tsc --noEmit
# Zero errors in modified files
# Pre-existing: gameStateRef.test.ts cannot find @testing-library/react (Wave 0 gap, not this plan)
```

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `679d52c` | test | Add failing tests for SKILL-01/04, AI-02, ENEMY_ACTION integration (RED) |
| `f61834d` | feat | Implement Signal Null SKILL case and ALWAYS_ATTACK AI (GREEN) |

## Deviations from Plan

None — plan executed exactly as written.

The implementation follows the exact code patterns specified in `<implementation>`:
- SKILL case matches the proposed snippet verbatim (with minor formatting alignment)
- ALWAYS_ATTACK matches the proposed snippet exactly
- ENEMY_ACTION matches the proposed snippet exactly (including the defeated-enemy guard)

## Threat Model Compliance

| Threat ID | Status |
|-----------|--------|
| T-02-03-01 | Mitigated — `return state` (identical reference) on EN < 8; `toBe` test asserts identity |
| T-02-03-02 | Mitigated — `isDefending ? 0.5 : 1.0` test asserts hpDelta.amount === -2 when defending |
| T-02-03-03 | Mitigated — `if (!enemy || enemy.isDefeated)` guard advances turn without RESOLVING |
| T-02-03-04 | Accepted — reducer receives fresh `state` param; no stale closure risk |

## Known Stubs

None. All engine logic for SKILL and ALWAYS_ATTACK is fully implemented. The remaining AI stubs (`TARGET_LOWEST_HP`, `ATTACK_RANDOM`, `OVERDRIVE_BOSS`) are intentional placeholders for Phases 3–4.

## Self-Check: PASSED

- `src/engine/reducer.ts` — exists, contains `resolveEnemyAction` import and SKILL case
- `src/engine/enemyAI.ts` — exists, contains `calculateDamage` import and real ALWAYS_ATTACK
- `src/engine/reducer.test.ts` — exists, 43 tests
- `src/engine/enemyAI.test.ts` — exists, 12 tests
- Commit `679d52c` — RED tests committed
- Commit `f61834d` — GREEN implementation committed
- Full suite: 72 tests passing, 0 new failures
