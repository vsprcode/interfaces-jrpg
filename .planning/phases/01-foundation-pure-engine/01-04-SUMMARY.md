---
phase: 01-foundation-pure-engine
plan: "04"
subsystem: engine
tags: [types, pure-functions, tdd, damage, turn-queue, mutation-regression, coverage]

requires:
  - phase: 01-01
    provides: Next.js 14 scaffold with TypeScript strict config and FOUND-05 folder structure
  - phase: 01-03
    provides: Vitest 2.1.9 test infrastructure, vitest.config.ts, npm test scripts

provides:
  - src/engine/types.ts — complete Phase 1 type universe (ENGINE-01)
  - src/engine/damage.ts — calculateDamage + getEffectiveDef pure functions (ENGINE-02)
  - src/engine/turnQueue.ts — buildTurnQueue pure function (ENGINE-03)
  - 17 passing tests with JSON-snapshot mutation regression guards (QA-03)
  - @vitest/coverage-v8@2.1.9 devDependency added for coverage reporting

affects: [engine-reducer-plan-05, enemy-ai-plan-06, all-engine-consumers]

tech-stack:
  added:
    - "@vitest/coverage-v8@2.1.9"
  patterns:
    - TDD red-green cycle for pure functions (write tests first, watch fail, implement until green)
    - JSON.stringify snapshot regression pattern for mutation purity contracts
    - readonly array parameters in buildTurnQueue to make purity intent explicit
    - Stable sort via ES2019 Array.prototype.sort (party-first tie-breaking)

key-files:
  created:
    - src/engine/types.ts (133 lines, type-only, no runtime exports)
    - src/engine/damage.ts (42 lines, exports calculateDamage + getEffectiveDef + DamageModifiers)
    - src/engine/damage.test.ts (102 lines, 11 tests)
    - src/engine/turnQueue.ts (44 lines, exports buildTurnQueue)
    - src/engine/turnQueue.test.ts (62 lines, 6 tests)
  modified:
    - package.json (added @vitest/coverage-v8@^2.1.9 devDependency)
  deleted:
    - src/engine/_smoke.test.ts (replaced by real tests in damage.test.ts and turnQueue.test.ts)

key-decisions:
  - "BattlePhase is a literal string union ('INIT'|'PLAYER_INPUT'|...) not a tagged object union — Plan 05 reducer switches on it directly"
  - "defPenetration defaults to 1.0 (full DEF) not 0.0 — Signal Null passes 0.7 to ignore 30% of DEF"
  - "buildTurnQueue accepts readonly arrays to surface mutation intent at the type level"
  - "@vitest/coverage-v8 must match vitest version exactly (2.1.9) to avoid BaseCoverageProvider export mismatch"

requirements-completed: [ENGINE-01, ENGINE-02, ENGINE-03, QA-03]

duration: ~6min
completed: "2026-04-26"
---

# Phase 01 Plan 04: Engine Types + Pure Functions (TDD) Summary

**Complete Phase 1 type universe in types.ts plus calculateDamage and buildTurnQueue as tested pure functions — 17 tests green, damage.ts at 100%/85.71% and turnQueue.ts at 100%/100% coverage.**

## Performance

- **Duration:** ~6 min
- **Completed:** 2026-04-26
- **Tasks:** 3/3
- **Files created:** 5 (types.ts, damage.ts, damage.test.ts, turnQueue.ts, turnQueue.test.ts)
- **Files modified:** 1 (package.json)
- **Files deleted:** 1 (src/engine/_smoke.test.ts)

## Accomplishments

- `src/engine/types.ts` created with all 20 Phase 1 type exports: CharacterId, EnemyId, CombatantId, StatusEffectType, StatusEffect, Character, Enemy, Combatant, TurnEntry, EnemyBehaviorType, BattlePhase, AnimationType, HpDelta, EnDelta, StatusApplied, StatusRemoved, ResolvedAction, PlayerActionType, PlayerAction, BattleState, Action
- `calculateDamage(attacker, target, modifiers?)` implements `max(1, floor((ATK + flatBonus - floor(DEF * penetration)) * multiplier))`
- `getEffectiveDef(combatant)` sums base DEF plus all DEF_BUFF status effect magnitudes
- `buildTurnQueue(party, enemies)` sorts by SPD descending, excludes defeated, snapshots SPD at build time, stable (party wins ties)
- Smoke test from Plan 03 deleted as planned
- `@vitest/coverage-v8@2.1.9` added to package.json to enable `npm run test:coverage`

## Final Test Count

- **Total:** 17 tests (11 damage + 6 turnQueue)
- **Test files:** 2 (damage.test.ts, turnQueue.test.ts)
- **All passing:** yes

## Coverage Results

| File         | % Stmts | % Branch | % Funcs | % Lines | Note                        |
|--------------|---------|----------|---------|---------|------------------------------|
| damage.ts    | 100     | 85.71    | 100     | 100     | Line 39: uncovered branch (magnitude ?? 0 when magnitude is defined) |
| turnQueue.ts | 100     | 100      | 100     | 100     | Full coverage                |

Both files exceed the 80% threshold on all metrics.

## Task Commits

Each task committed atomically with `--no-verify` (parallel worktree execution):

1. **Task 1: types.ts (ENGINE-01)** — `d49171a`
2. **Task 2: damage.ts + damage.test.ts (ENGINE-02, QA-03)** — `ddaf302`
3. **Task 3: turnQueue.ts + turnQueue.test.ts + delete smoke (ENGINE-03, QA-03)** — `1816bbe`
4. **chore: @vitest/coverage-v8 devDependency** — `b818145`

## Types File: Zero Runtime Exports Confirmed

`src/engine/types.ts` contains exclusively `type`, `interface`, and `export type`/`export interface` declarations. No functions, no constants, no class statements — the file produces zero JavaScript output at runtime. TypeScript compiles it away entirely.

## Mutation Regression Pattern (QA-03)

Both test files include JSON-snapshot regression guards:

**damage.test.ts** (2 mutation tests):
- `JSON.stringify(attacker)` + `JSON.stringify(target)` snapshots before/after `calculateDamage` call
- `JSON.stringify(mods)` snapshot before/after call with modifiers

**turnQueue.test.ts** (1 mutation test):
- `JSON.stringify(party)` + `JSON.stringify(enemies)` snapshots before/after `buildTurnQueue` call

Any future regression that mutates inputs will fail these snapshot assertions immediately in CI.

## ENGINE-06 Note

ENGINE-06 (reducer must use `.map()` + spread for state updates, never `.push()` or direct mutation) is NOT enforced in this plan — it applies to Plan 05's reducer. This plan establishes the precedent and tooling that makes Plan 05's mutation regressions possible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @vitest/coverage-v8 missing from package.json**
- **Found during:** Task 3 (running `npm run test:coverage`)
- **Issue:** vitest.config.ts specifies `provider: 'v8'` but `@vitest/coverage-v8` was not installed or listed in package.json. The Plan 03 SUMMARY incorrectly stated "v8 coverage provider (built into Node 18+, no extra package needed)" — as of vitest 2.x, the v8 provider requires the separate `@vitest/coverage-v8` package.
- **Fix:** Installed `@vitest/coverage-v8@2.1.9` (matching vitest version to avoid `BaseCoverageProvider` export mismatch) and added to package.json devDependencies
- **Files modified:** package.json
- **Commit:** `b818145`

## Known Stubs

None — this plan creates pure TypeScript functions and types. No UI components, no data-rendering, no placeholder values.

## Threat Mitigations Applied

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-04-01 (Tampering: calculateDamage mutates inputs) | 2 JSON.stringify snapshot regression tests in damage.test.ts | MITIGATED |
| T-04-02 (Tampering: buildTurnQueue mutates input arrays) | Mutation regression test in turnQueue.test.ts; implementation uses spread+filter | MITIGATED |
| T-04-03 (Info: coverage/ committed) | coverage/ in .gitignore from Plan 01 | ACCEPTED |
| T-04-04 (Tampering: non-exhaustive Action union in reducer) | Documented for Plan 05 — must add `default: const _exhaustive: never = action` block | DEFERRED to Plan 05 |

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure TypeScript types and functions.

## Next Phase Readiness

- **Plan 05 (Battle Reducer):** Can begin in Wave 3 — has types.ts (all discriminated unions), calculateDamage, and buildTurnQueue
- **Plan 06 (Enemy AI):** Can begin in Wave 4 — has BattleState shape, Character/Enemy types, calculateDamage
- **No blockers** for Wave 3+ plans

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/engine/types.ts` exists | FOUND |
| `export interface Character` in types.ts | FOUND |
| `export interface Enemy` in types.ts | FOUND |
| `export interface BattleState` in types.ts | FOUND |
| `export type Action` in types.ts | FOUND |
| `export type BattlePhase` with 'PLAYER_INPUT' | FOUND |
| `src/engine/damage.ts` exists | FOUND |
| `export function calculateDamage` in damage.ts | FOUND |
| `Math.max(1` in damage.ts (ENGINE-02 boundary) | FOUND |
| `JSON.stringify` in damage.test.ts (QA-03) | FOUND |
| `src/engine/turnQueue.ts` exists | FOUND |
| `export function buildTurnQueue` in turnQueue.ts | FOUND |
| `src/engine/_smoke.test.ts` DELETED | CONFIRMED |
| `JSON.stringify` in turnQueue.test.ts (QA-03) | FOUND |
| `npm run test -- --run` exits 0 with 17 passing | PASSED |
| `npm run test:coverage` >= 80% on damage.ts | PASSED (100%/85.71%) |
| `npm run test:coverage` >= 80% on turnQueue.ts | PASSED (100%/100%) |
| `npx tsc --noEmit` exits 0 | PASSED |
| Commit `d49171a` exists | FOUND |
| Commit `ddaf302` exists | FOUND |
| Commit `1816bbe` exists | FOUND |
| Commit `b818145` exists | FOUND |
