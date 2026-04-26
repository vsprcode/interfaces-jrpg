---
phase: 01-foundation-pure-engine
plan: "06"
subsystem: engine
tags: [enemy-ai, tdd, strategy-map, data-scaffolding, defensive-throw, mutation-regression]

requires:
  - phase: 01-04
    provides: types.ts (BattleState, EnemyBehaviorType, Enemy, Character, ResolvedAction)
  - phase: 01-05
    provides: reducer.ts (battleReducer, initialBattleState), 26 passing tests

provides:
  - src/engine/enemyAI.ts — AIFn type + AI_BEHAVIORS Record<EnemyBehaviorType, AIFn> + resolveEnemyAction (AI-01, AI-05 signature contract)
  - src/engine/enemyAI.test.ts — 4 tests: map-completeness, shape contract, defensive-throw, mutation regression
  - src/data/characters.ts — DEADZONE Character constant (Phase 1 minimal scope)
  - src/data/enemies.ts — CASTING_PROBE_MK1 Enemy constant (Phase 1 minimal scope)
  - Full Phase 1 test suite at 30 passing (11 damage + 6 turnQueue + 9 reducer + 4 enemyAI)

affects: [battle-scene-plan-07]

tech-stack:
  added: []
  patterns:
    - Strategy map pattern: AI_BEHAVIORS as Record<EnemyBehaviorType, AIFn> — TypeScript enforces all 4 keys at compile time, no switch needed
    - Parameter-based state passing: AIFn accepts BattleState as parameter (not closure) — supports gameStateRef.current pattern (AI-05)
    - Defensive guard: stubAction throws when validTargets.length === 0 before any logic (Pitfall 9)
    - Phase 1 stub pattern: stubs return valid ResolvedAction shape so pipeline is testable end-to-end before behavior logic lands

key-files:
  created:
    - src/engine/enemyAI.ts (52 lines: AIFn type, AI_BEHAVIORS map, stubAction, resolveEnemyAction)
    - src/engine/enemyAI.test.ts (51 lines: 4 tests covering map, shape, throw, mutation)
    - src/data/characters.ts (20 lines: DEADZONE constant)
    - src/data/enemies.ts (20 lines: CASTING_PROBE_MK1 constant)
  modified: []

key-decisions:
  - "AI_BEHAVIORS typed as Record<EnemyBehaviorType, AIFn> — TypeScript compile-time error if any of the 4 behavior keys is missing (T-06-03 mitigation)"
  - "AIFn signature is (enemy: Enemy, state: BattleState) => ResolvedAction — BattleState is a parameter, not closure-captured, so callers pass gameStateRef.current (AI-05 contract)"
  - "Phase 1 stubs return stable placeholder ResolvedAction — behavior logic (ALWAYS_ATTACK in Phase 2, TARGET_LOWEST_HP/ATTACK_RANDOM in Phase 3, OVERDRIVE_BOSS in Phase 4)"
  - "TORC, TRINETRA, NETWORKER_ENFORCER, CASTING_PATROL_BOT, AEGIS_7 deferred to Phase 2/3/4 per RESEARCH §13 (locked decision 6)"
  - "src/data/ Phase 1 minimal scope: DEADZONE + CASTING_PROBE_MK1 only — sufficient for Plan 07 INIT dispatch"

requirements-completed: [AI-01, AI-05]

duration: ~5min
completed: "2026-04-26"
---

# Phase 01 Plan 06: Enemy AI Strategy Map + Data Scaffolding (TDD) Summary

**AI_BEHAVIORS as Record<EnemyBehaviorType, AIFn> with 4 compile-time-enforced behavior stubs, defensive throw on empty targets, mutation regression test, and src/data/ scaffolded with DEADZONE + CASTING_PROBE_MK1 — 30 tests green, tsc clean.**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-04-26
- **Tasks:** 2/2
- **Files created:** 4 (enemyAI.ts, enemyAI.test.ts, characters.ts, enemies.ts)
- **Files modified:** 0

## Accomplishments

- `AI_BEHAVIORS: Record<EnemyBehaviorType, AIFn>` — TypeScript enforces all 4 keys present: ALWAYS_ATTACK, TARGET_LOWEST_HP, ATTACK_RANDOM, OVERDRIVE_BOSS (AI-01)
- `AIFn = (enemy: Enemy, state: BattleState) => ResolvedAction` — BattleState passed as parameter, not closure-captured (AI-05 signature contract)
- `resolveEnemyAction(enemy, state)` entry point delegates to behavior map
- `stubAction` throws `Error` when `validTargets.length === 0` before any logic (Pitfall 9 defensive guard, T-06-02 mitigation)
- All AI functions return valid `ResolvedAction` shape with `actorId`, `description`, `animationType` (T-06-01 mitigation via mutation regression test)
- `DEADZONE` exported from `src/data/characters.ts`: hp/maxHp 95, en/maxEn 25, atk 22, def 10, spd 18 (PROJECT.md exact match)
- `CASTING_PROBE_MK1` exported from `src/data/enemies.ts`: hp/maxHp 40, atk 14, def 6, spd 10, behavior ALWAYS_ATTACK
- Full test suite: 30 passing (11 damage + 6 turnQueue + 9 reducer + 4 enemyAI)

## TDD Cycle

### Task 1 (enemyAI.ts + enemyAI.test.ts)

**RED:** Created `enemyAI.test.ts` with 4 tests → failed "Failed to load url ./enemyAI" — confirmed RED.

**GREEN:** Created `enemyAI.ts` with strategy map, stubAction, resolveEnemyAction → 4 tests passed immediately. No iteration needed.

**REFACTOR:** No refactor needed — implementation matched plan spec exactly.

### Task 2 (characters.ts + enemies.ts)

No TDD cycle required (these are typed constant declarations, not logic). Created both files, verified tsc clean.

## Final Test Count

- **Total:** 30 tests (11 damage + 6 turnQueue + 9 reducer + 4 enemyAI)
- **Test files:** 4 (damage.test.ts, turnQueue.test.ts, reducer.test.ts, enemyAI.test.ts)
- **All passing:** yes

## AI_BEHAVIORS Map Structure

| Key | Phase | Stub label |
|-----|-------|------------|
| ALWAYS_ATTACK | Phase 2 | 'always_attack stub' |
| TARGET_LOWEST_HP | Phase 3 | 'target_lowest_hp stub' |
| ATTACK_RANDOM | Phase 3 | 'attack_random stub' |
| OVERDRIVE_BOSS | Phase 4 | 'overdrive_boss stub' |

All 4 stubs delegate to `stubAction(enemy, state, label)` which:
1. Validates `state.party.filter(c => !c.isDefeated).length > 0` (throws if empty)
2. Returns `{ actorId: enemy.id, description: ..., animationType: 'ATTACK' }`

## AI-05 Signature Contract

The `AIFn` signature `(enemy: Enemy, state: BattleState) => ResolvedAction` means:
- State is received as a **parameter**, not closure-captured
- Callers (Plan 07's BattleScene ENEMY_TURN handler) must pass `gameStateRef.current`
- This prevents stale-closure bugs (Pitfall 2, T-06-04) in the async ENEMY_TURN dispatch flow

Plan 07 wires the actual `gameStateRef.current` call inside the BattleScene component.

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| Task 1 (TDD RED+GREEN) | enemyAI.ts + enemyAI.test.ts | `5f46a67` |
| Task 2 | characters.ts + enemies.ts | `d0c5c00` |

## Deviations from Plan

None — plan executed exactly as specified. All 4 tests, all behavior keys, all stat values, all defensive guards implemented verbatim from the plan.

## Known Stubs

The following Phase 1 stubs are intentional and tracked:

| Stub | File | Reason |
|------|------|--------|
| ALWAYS_ATTACK stub | src/engine/enemyAI.ts | Phase 2 wires real attack targeting logic |
| TARGET_LOWEST_HP stub | src/engine/enemyAI.ts | Phase 3 wires lowest-HP targeting logic |
| ATTACK_RANDOM stub | src/engine/enemyAI.ts | Phase 3 wires random targeting logic |
| OVERDRIVE_BOSS stub | src/engine/enemyAI.ts | Phase 4 wires AEGIS-7 TERMINUS sequence |

These stubs return valid ResolvedAction shape and pass all 4 tests. They do NOT prevent Plan 06's goal (establish AI shape + data scaffolding for Plan 07 INIT dispatch). Plan 07 BattleScene can dispatch a real INIT action with DEADZONE vs CASTING_PROBE_MK1 and the full engine pipeline is testable end-to-end.

## Threat Mitigations Applied

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-06-01 (AI mutates state) | Mutation regression test: JSON.stringify snapshot before/after resolveEnemyAction; AI returns descriptor only | MITIGATED |
| T-06-02 (AI infinite loop on empty targets) | stubAction throws Error when validTargets.length === 0; test asserts throw | MITIGATED |
| T-06-03 (New behavior without map entry) | Record<EnemyBehaviorType, AIFn> — TypeScript compile error if any key missing | MITIGATED |
| T-06-04 (AI reads stale closure state) | AIFn signature accepts BattleState as parameter; JSDoc documents callers must pass gameStateRef.current | MITIGATED |

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. All changes are pure TypeScript functions and typed data constants.

## Next Phase Readiness

- **Plan 07 (BattleScene):** Can begin in Wave 5 — has all engine pieces (types, damage, turnQueue, reducer, gameStateRef, enemyAI) + minimal data (DEADZONE + CASTING_PROBE_MK1). BattleScene can dispatch real INIT action.
- **No blockers** for Wave 5.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/engine/enemyAI.ts` exists | FOUND |
| `export type AIFn` in enemyAI.ts | FOUND |
| `Record<EnemyBehaviorType, AIFn>` in enemyAI.ts | FOUND |
| All 4 behavior keys present | FOUND |
| `throw new Error` in stubAction | FOUND |
| `export function resolveEnemyAction` in enemyAI.ts | FOUND |
| `src/engine/enemyAI.test.ts` exists | FOUND |
| 4 tests: map, shape, throw, mutation | FOUND |
| `src/data/characters.ts` exports DEADZONE | FOUND |
| `src/data/enemies.ts` exports CASTING_PROBE_MK1 | FOUND |
| DEADZONE stats: hp 95, en 25, atk 22, def 10, spd 18 | FOUND |
| CASTING_PROBE_MK1 stats: hp 40, atk 14, def 6, spd 10 | FOUND |
| `npm run test -- --run` exits 0 with 30 passing | PASSED |
| `npx tsc --noEmit` exits 0 | PASSED |
| Commit `5f46a67` exists | FOUND |
| Commit `d0c5c00` exists | FOUND |
