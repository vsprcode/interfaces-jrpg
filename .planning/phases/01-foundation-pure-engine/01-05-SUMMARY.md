---
phase: 01-foundation-pure-engine
plan: "05"
subsystem: engine
tags: [reducer, tdd, phase-guard, mutation-regression, exhaustiveness, stale-closure, pure-function]

requires:
  - phase: 01-04
    provides: types.ts (BattleState, Action union, BattlePhase), damage.ts, turnQueue.ts, 17 passing tests

provides:
  - src/engine/reducer.ts — battleReducer (pure function) + initialBattleState (ENGINE-04, ENGINE-05, ENGINE-06)
  - src/engine/reducer.test.ts — 9 tests: INIT, 3 phase-guard same-ref, accept+transition, mutation regression, 2 end-conditions, 1 no-change
  - src/engine/gameStateRef.ts — useGameStateRef React hook (QA-02, AI-05 prep)
  - Full Phase 1 test suite at 26 passing (11 damage + 6 turnQueue + 9 reducer)

affects: [enemy-ai-plan-06, battle-scene-plan-07]

tech-stack:
  added: []
  patterns:
    - Phase guard pattern: PLAYER_ACTION case checks `if (state.phase !== 'PLAYER_INPUT') return state;` as FIRST line — returns same reference so React bails out of re-render
    - Discriminated-union switch with `default: const _exhaustive: never = action` block — TypeScript compile-time error if any Action variant is missing a case
    - Spread-only updates: every case uses `{ ...state, ... }` — never direct property assignment
    - useGameStateRef: useRef + useEffect([state]) pattern — always-fresh state for deferred callbacks

key-files:
  created:
    - src/engine/reducer.ts (97 lines, exports battleReducer + initialBattleState)
    - src/engine/reducer.test.ts (113 lines, 9 tests)
    - src/engine/gameStateRef.ts (29 lines, exports useGameStateRef)
  modified: []

key-decisions:
  - "Phase guard returns SAME reference (not new object) — React skips re-render entirely when out-of-phase dispatch arrives, preventing flash/race (ENGINE-05, QA-05, Pitfall 4)"
  - "ACTION_RESOLVED and ENEMY_ACTION also have phase guards (defensive depth) even though plan only specified PLAYER_ACTION — correctness requirement"
  - "useGameStateRef has no unit test in Phase 1 (vitest env is node, no jsdom/RTL yet); Plan 07 BattleScene is the integration verification point"
  - "initialBattleState.items.nanoMed = 3 matches game design spec for demo item count"

requirements-completed: [ENGINE-04, ENGINE-05, ENGINE-06, QA-02, QA-04, QA-05]

duration: ~4min
completed: "2026-04-26"
---

# Phase 01 Plan 05: Battle Reducer + gameStateRef Hook (TDD) Summary

**battleReducer as a pure (state, action) => state function with phase guard returning same reference on out-of-phase dispatch, exhaustiveness check via `never`, spread-only updates — 9 tests green, full suite at 26 passing.**

## Performance

- **Duration:** ~4 min
- **Completed:** 2026-04-26
- **Tasks:** 2/2
- **Files created:** 3 (reducer.ts, reducer.test.ts, gameStateRef.ts)
- **Files modified:** 0

## Accomplishments

- `battleReducer(state, action): BattleState` pure function — synchronous, deterministic, never throws
- All 6 BattlePhase values reachable via switch cases: INIT, PLAYER_INPUT (via INIT transition), RESOLVING, ENEMY_TURN, VICTORY, GAME_OVER (ENGINE-04)
- Phase guard on PLAYER_ACTION: `if (state.phase !== 'PLAYER_INPUT') return state;` is FIRST line — same-reference return confirmed by 3 reference-identity tests using `expect(next).toBe(state)` (ENGINE-05, QA-05, Pitfall 4)
- Defensive phase guards also on ACTION_RESOLVED (guards RESOLVING) and ENEMY_ACTION (guards ENEMY_TURN)
- `default: const _exhaustive: never = action` compile-time exhaustiveness check (T-05-04 mitigation)
- All state updates via spread — mutation regression test uses JSON.stringify snapshot to catch any future regression
- `initialBattleState` exported with `phase: 'INIT'`, `items: { nanoMed: 3 }`
- `useGameStateRef` hook: `useRef<BattleState>(state)` + `useEffect(() => { ref.current = state }, [state])` — canonical Pitfall 2 fix

## TDD Cycle

### Task 1 (reducer.ts + reducer.test.ts)

**RED:** Created `reducer.test.ts` with 9 tests → failed "Cannot find module './reducer'" — confirmed RED.

**GREEN:** Created `reducer.ts` with pure reducer implementation → 9 tests passed immediately. No iteration needed.

**REFACTOR:** No refactor needed — implementation matched plan spec exactly.

### Task 2 (gameStateRef.ts)

No TDD cycle required (hook is a thin React primitive wrapper — Vitest runs in node environment, no React rendering context). Created file, verified tsc + lint clean.

## Final Test Count

- **Total:** 26 tests (11 damage + 6 turnQueue + 9 reducer)
- **Test files:** 3 (damage.test.ts, turnQueue.test.ts, reducer.test.ts)
- **All passing:** yes

## Phase Guard Reference-Identity Verification

Three tests use `expect(next).toBe(state)` (strict object identity, not deep equality) to verify that out-of-phase PLAYER_ACTION dispatches return the IDENTICAL state reference — not a new object with the same values. React's `useReducer` bails out of re-render when the returned reference is identical, preventing stale-state flicker and double-dispatch race conditions (Pitfall 4, T-05-01).

| Test | Phase when dispatched | Assertion |
|------|-----------------------|-----------|
| "drops PLAYER_ACTION when phase is RESOLVING" | RESOLVING | `expect(next).toBe(state)` — PASSES |
| "drops PLAYER_ACTION when phase is ENEMY_TURN" | ENEMY_TURN | `expect(next).toBe(state)` — PASSES |
| "drops PLAYER_ACTION when phase is GAME_OVER" | GAME_OVER | `expect(next).toBe(state)` — PASSES |

## gameStateRef: No Unit Test in Phase 1

`useGameStateRef` is a thin wrapper over React's `useRef` + `useEffect`. Testing it properly requires:
1. `jsdom` environment (to mock React's rendering lifecycle)
2. `@testing-library/react` for `renderHook`

Neither is configured in Phase 1 (vitest.config.ts uses `environment: 'node'`). Phase 2 will add jsdom + RTL when the first interactive component tests land. At that point, add `gameStateRef.test.tsx` covering:
- ref reflects latest state after re-render
- ref updates on every render with new state
- ref is stable (same ref object) across renders

Plan 07's BattleScene smoke test is the Phase 1 integration verification for this hook.

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| Task 1 (TDD RED+GREEN) | reducer.ts + reducer.test.ts | `87fd027` |
| Task 2 | gameStateRef.ts | `2894fe2` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Phase guards added to ACTION_RESOLVED and ENEMY_ACTION**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified phase guard only for PLAYER_ACTION. However, applying defensive guards to ACTION_RESOLVED (must be in RESOLVING) and ENEMY_ACTION (must be in ENEMY_TURN) is a correctness requirement — out-of-phase dispatch on these cases would also produce incorrect state transitions.
- **Fix:** Added `if (state.phase !== 'RESOLVING') return state;` to ACTION_RESOLVED and `if (state.phase !== 'ENEMY_TURN') return state;` to ENEMY_ACTION
- **Files modified:** src/engine/reducer.ts
- **Commit:** `87fd027`

No other deviations — plan executed as specified.

## Known Stubs

None — this plan creates pure TypeScript functions and a React hook. No UI components, no data-rendering, no placeholder values.

## Threat Mitigations Applied

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-05-01 (Race condition: rapid input double-dispatch) | Phase guard `if (state.phase !== 'PLAYER_INPUT') return state;` is FIRST line of PLAYER_ACTION; 3 reference-identity tests | MITIGATED |
| T-05-02 (Future mutation regression) | JSON.stringify snapshot test in reducer.test.ts; all updates via spread | MITIGATED |
| T-05-03 (Stale closure in deferred callbacks) | useGameStateRef hook: useRef + useEffect([state]) pattern; JSDoc with usage example | MITIGATED |
| T-05-04 (New Action variant without reducer case) | `default: const _exhaustive: never = action` block — tsc compile error if variant missing | MITIGATED |

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure TypeScript functions and a React hook with no side effects at module load.

## Next Phase Readiness

- **Plan 06 (Enemy AI):** Can begin in Wave 4 — has battleReducer, initialBattleState, gameStateRef, types, calculateDamage, buildTurnQueue
- **Plan 07 (BattleScene):** Can begin in Wave 5 — all engine pieces ready
- **No blockers** for Wave 4+ plans

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/engine/reducer.ts` exists in worktree | FOUND |
| `export function battleReducer` in reducer.ts | FOUND |
| `export const initialBattleState` in reducer.ts | FOUND |
| `if (state.phase !== 'PLAYER_INPUT')` phase guard | FOUND |
| `const _exhaustive: never = action` exhaustiveness | FOUND |
| `src/engine/reducer.test.ts` exists | FOUND |
| `drops PLAYER_ACTION` test strings present | FOUND |
| `does NOT mutate` test string present | FOUND |
| `src/engine/gameStateRef.ts` exists | FOUND |
| `export function useGameStateRef` | FOUND |
| `useRef<BattleState>` typed ref | FOUND |
| `import { useRef, useEffect } from 'react'` | FOUND |
| `npm run test -- --run` exits 0 with 26 passing | PASSED |
| `npx tsc --noEmit` exits 0 | PASSED |
| `npm run lint` exits 0 | PASSED |
| Commit `87fd027` exists | FOUND |
| Commit `2894fe2` exists | FOUND |
