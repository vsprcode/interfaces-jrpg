---
phase: 01-foundation-pure-engine
plan: "03"
subsystem: testing
tags: [vitest, testing, engine, coverage, node-environment]

requires:
  - phase: 01-01
    provides: Next.js 14 scaffold with TypeScript strict config and FOUND-05 folder structure

provides:
  - Vitest 2.1.9 installed as devDependency
  - vitest.config.ts with environment node, engine-scoped include glob, v8 coverage at 80% thresholds
  - npm scripts: test (vitest run), test:watch, test:ui, test:coverage
  - src/engine/_smoke.test.ts smoke test (1+1=2), to be deleted in Plan 04

affects: [all-phases, engine-tests, tdd-infrastructure]

tech-stack:
  added:
    - vitest@2.1.9
    - "@vitest/ui@2.1.9"
  patterns:
    - vitest run (one-shot, CI-friendly) as default test command
    - engine tests scoped to src/engine/**/*.test.ts via include glob
    - v8 coverage provider (built-in to Node 18+, no extra package)

key-files:
  created:
    - vitest.config.ts (node environment, engine coverage scope, 80% thresholds)
    - src/engine/_smoke.test.ts (1+1=2 smoke test, deleted in Plan 04)
  modified:
    - package.json (vitest@^2.1.9, @vitest/ui@^2.1.9 devDeps; test/test:watch/test:ui/test:coverage scripts)

key-decisions:
  - "environment: node enforced — Phase 1 has zero DOM tests; jsdom deferred to Phase 2"
  - "globals: true allows describe/it/expect without explicit imports in all Plan 04+ test files"
  - "coverage.exclude includes src/engine/types.ts — pure type declarations produce no runtime code"
  - "v8 coverage provider used — built into Node 18+, no @vitest/coverage-v8 package needed"

requirements-completed: [FOUND-06]

duration: 1min
completed: "2026-04-26"
---

# Phase 01 Plan 03: Vitest 2 + Test Infrastructure Summary

**Vitest 2.1.9 configured for pure TypeScript engine tests in node environment, with 80% coverage thresholds scoped to src/engine/**, smoke test passing at 1.48s**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-04-26T04:41:02Z
- **Completed:** 2026-04-26T04:42:30Z
- **Tasks:** 2/2
- **Files modified:** 3 (package.json, vitest.config.ts, src/engine/_smoke.test.ts)

## Accomplishments

- Vitest 2.1.9 and @vitest/ui 2.1.9 installed as devDependencies
- vitest.config.ts created with `environment: 'node'`, `globals: true`, engine-scoped include glob, and v8 coverage at 80% thresholds for lines/functions/branches/statements
- npm scripts wired: `test` (vitest run), `test:watch` (vitest), `test:ui` (vitest --ui), `test:coverage` (vitest run --coverage)
- Smoke test at `src/engine/_smoke.test.ts` passes: 1 test file, 1 test, 1.48s cold run
- `npx tsc --noEmit` exits 0 — vitest.config.ts compiles cleanly under strict tsconfig

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Vitest 2 and add npm scripts** - `85eab7c` (feat)
2. **Task 2: Write vitest.config.ts and smoke test** - `3853323` (feat)

## Files Created/Modified

- `package.json` — `vitest@^2.1.9`, `@vitest/ui@^2.1.9` added to devDependencies; 4 test scripts added
- `vitest.config.ts` — `environment: 'node'`, `globals: true`, `include: ['src/engine/**/*.test.ts']`, v8 coverage with 80% thresholds
- `src/engine/_smoke.test.ts` — `expect(1 + 1).toBe(2)` smoke test; to be deleted in Plan 04 when `damage.test.ts` lands

## Vitest Version Details

- **vitest:** 2.1.9 (installed from ^2 range)
- **@vitest/ui:** 2.1.9
- **Coverage provider:** v8 (built into Node 18+, zero extra packages)
- **DOM testing tools NOT installed:** No jsdom, @testing-library/react, @testing-library/user-event — correctly deferred to Phase 2

## Test Runtime

- **Cold run:** 1.48s (target: < 5s) — PASSED
- **Warm run:** ~0.4s (estimated; first run was cold)
- **Test output:** `1 passed (1)` with `✓ src/engine/_smoke.test.ts (1 test) 1ms`

## Decisions Made

- **`environment: 'node'`** — Phase 1 has zero DOM tests. jsdom will be added in Phase 2 for component tests (per RESEARCH §6 future-extension note).
- **`globals: true`** — Allows `describe/it/expect` without explicit imports in all Plan 04+ test files, matching the code samples throughout the research document.
- **`coverage.exclude: ['src/engine/types.ts']`** — Pure type declarations produce no runtime code to cover; excluding prevents false coverage failures.
- **`v8` provider over `@vitest/coverage-v8`** — Built into Node 18+, zero additional package required for Phase 1 coverage scaffolding.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-03-01 (Tampering: browser-only code in test runtime) | `environment: 'node'` enforced; include glob limits to `src/engine/**` | MITIGATED |
| T-03-02 (DoS: vitest watch mode in CI) | `npm run test` uses `vitest run` (one-shot, exits after run) | MITIGATED |
| T-03-03 (Info: coverage HTML committed) | `coverage/` already in `.gitignore` from Plan 01 | ACCEPTED |

## Next Phase Readiness

- **Plan 04 (Engine Types & Pure Functions):** Can begin immediately — `vitest.config.ts` provides the test infrastructure; Plan 04 will delete `_smoke.test.ts` once `damage.test.ts` lands
- **All subsequent engine plans:** Write `*.test.ts` files alongside production modules under `src/engine/` with zero additional setup
- **No blockers** for Wave 2 plans in Phase 1

## Known Stubs

None — this plan establishes infrastructure only; no data-rendering components created.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `vitest.config.ts` exists | FOUND |
| `environment: 'node'` in vitest.config.ts | FOUND |
| `src/engine/_smoke.test.ts` exists | FOUND |
| `npm run test` exits 0 | PASSED (1.48s) |
| `npx tsc --noEmit` exits 0 | PASSED |
| Commit `85eab7c` exists | FOUND |
| Commit `3853323` exists | FOUND |
