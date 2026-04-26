---
phase: 02-encounter-1-deadzone-solo
plan: "01"
subsystem: testing
tags: [vitest, jsdom, testing-library, react, typescript]

# Dependency graph
requires:
  - phase: 01-foundation-pure-engine
    provides: battle engine (reducer, damage, turnQueue, enemyAI, gameStateRef) with 36 passing tests

provides:
  - dual-environment vitest config (node for engine, jsdom for components)
  - @testing-library/react + user-event + jsdom devDependencies installed
  - 3 passing gameStateRef tests closing 0% coverage gap from Phase 1
  - 4 component test scaffold files (it.todo stubs) for Wave 1-3 implementation
  - tsconfig.json types: vitest/globals so globals:true recognized by tsc

affects:
  - 02-02 (ActionMenu component — scaffold exists, tests ready)
  - 02-03 (BattleLog + GameOverScreen — scaffolds exist)
  - 02-04 (BattleScene integration — scaffold exists)
  - all phase 2 component plans (jsdom env now configured)

# Tech tracking
tech-stack:
  added:
    - "@testing-library/react@^16.3.2"
    - "@testing-library/user-event@^14"
    - "jsdom@^25"
  patterns:
    - "environmentMatchGlobs in vitest.config.ts routes component tests to jsdom, engine tests stay in node"
    - "Test scaffolds use it.todo to define contract before component exists"
    - "BattleState fixture factory pattern (makeBattleState with overrides) for test setup"

key-files:
  created:
    - src/engine/gameStateRef.test.ts
    - src/components/ActionMenu.test.tsx
    - src/components/BattleLog.test.tsx
    - src/components/GameOverScreen.test.tsx
    - src/components/BattleScene.test.tsx
  modified:
    - vitest.config.ts
    - package.json
    - package-lock.json
    - tsconfig.json

key-decisions:
  - "jsdom environment scoped via environmentMatchGlobs, not as global default — engine tests remain fast in node"
  - "Component scaffolds use it.todo (not skipped/xtest) — reported as skipped in Vitest, compile-safe, define contract"
  - "tsconfig.json types: [vitest/globals] added to resolve globals:true for tsc (engine tests import explicitly from vitest)"

patterns-established:
  - "makeBattleState factory: partial override pattern for BattleState test fixtures"
  - "environmentMatchGlobs: dual-env config pattern for mixed node/jsdom test suites"
  - "it.todo scaffold: define test contract before component implementation"

requirements-completed:
  - ENGINE-07
  - ENGINE-08
  - ENGINE-09
  - ENGINE-10
  - SKILL-01
  - SKILL-04
  - AI-02
  - UI-01
  - UI-02
  - UI-03
  - UI-07

# Metrics
duration: 8min
completed: 2026-04-26
---

# Phase 02 Plan 01: Test Infrastructure & Scaffolds Summary

**Dual-environment Vitest config (node/jsdom via environmentMatchGlobs) + @testing-library/react installed + 3 passing gameStateRef hook tests + 5 component scaffold files with it.todo contracts**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-26T11:42:00Z
- **Completed:** 2026-04-26T11:45:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Installed @testing-library/react@16, @testing-library/user-event@14, jsdom@25 as devDependencies
- Updated vitest.config.ts with environmentMatchGlobs routing component tests to jsdom and expanding include glob to `src/**/*.test.{ts,tsx}`
- Closed 0% coverage gap on gameStateRef.ts with 3 real passing tests (ref initial state, ref update on rerender, ref identity stability)
- Created 4 component scaffold files (ActionMenu, BattleLog, GameOverScreen, BattleScene) with it.todo stubs defining test contracts for Wave 1-3
- Fixed tsc failure by adding `types: ["vitest/globals"]` to tsconfig.json so globals mode is recognized

## Task Commits

Each task was committed atomically:

1. **Task 1: Install testing dependencies and update vitest.config.ts** - `0be1fed` (chore)
2. **Task 2: Create test scaffolds — gameStateRef + component stubs** - `a9cc3c0` (test)

## Files Created/Modified

- `vitest.config.ts` - Added environmentMatchGlobs, expanded include + coverage globs, removed gameStateRef.ts from exclude
- `package.json` - Added @testing-library/react, @testing-library/user-event, jsdom devDependencies
- `package-lock.json` - Lock file updated after install (T-02-01-01 mitigation: committed)
- `tsconfig.json` - Added `types: ["vitest/globals"]` to compiler options
- `src/engine/gameStateRef.test.ts` - 3 passing tests: ref reflects initial state, ref updates on rerender, ref object identity stable
- `src/components/ActionMenu.test.tsx` - 7 it.todo stubs: 4 buttons, EN/item disabled states, keyboard shortcuts 1-4
- `src/components/BattleLog.test.tsx` - 3 it.todo stubs: entries rendering, empty state, scroll-to-bottom
- `src/components/GameOverScreen.test.tsx` - 3 it.todo stubs: GAME OVER text, retry button, onRetry callback
- `src/components/BattleScene.test.tsx` - 5 it.todo stubs: layout, DEADZONE HP, enemy HP, GAME_OVER state, VICTORY state

## Decisions Made

- Used `environmentMatchGlobs` rather than global jsdom default — keeps engine tests running in Node for speed; jsdom only where needed
- Component scaffold files use `it.todo` (string-only, no callback) — compile-safe, reported as skipped by Vitest, define the test contract without requiring the component to exist yet
- Added `types: ["vitest/globals"]` to tsconfig rather than adding explicit vitest imports to every test file — consistent with `globals: true` in vitest.config.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed tsc TS2582 errors in new test files**
- **Found during:** Task 2 (test scaffold creation)
- **Issue:** New test files in `src/components/` and `src/engine/gameStateRef.test.ts` use `globals: true` pattern (bare `describe`, `it`, `expect`) but tsc couldn't resolve these globals — existing engine tests import explicitly from `vitest` but new files follow globals pattern
- **Fix:** Added `"types": ["vitest/globals"]` to `tsconfig.json` compilerOptions, which makes Vitest's global type declarations visible to tsc
- **Files modified:** `tsconfig.json`
- **Verification:** `npx tsc --noEmit` exits 0; all 39 tests pass; 18 todos skipped
- **Committed in:** `a9cc3c0` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required for tsc clean exit. No scope creep — tsconfig change is minimal and necessary.

## Issues Encountered

None beyond the tsc TS2582 deviation documented above.

## User Setup Required

None - no external service configuration required. All changes are devDependencies and config files.

## Next Phase Readiness

- jsdom environment configured and verified — Wave 1 component tests can import from @testing-library/react immediately
- ActionMenu, BattleLog, GameOverScreen, BattleScene scaffold files exist — Wave 1 plans implement the actual components and fill in the it.todo stubs
- gameStateRef.ts fully covered — no coverage debt carried forward
- All 39 engine tests green, tsc clean, build-safe

---
*Phase: 02-encounter-1-deadzone-solo*
*Completed: 2026-04-26*
