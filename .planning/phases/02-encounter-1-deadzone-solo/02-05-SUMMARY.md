---
phase: 02-encounter-1-deadzone-solo
plan: "05"
subsystem: ui-components
tags: [ui, components, animation, testing, battle]
dependency_graph:
  requires:
    - 02-02  # battle.module.css (hpBarTrack/hpBarFill/damageNumber classes)
    - 02-03  # SpriteFallback component (used by EnemyPanel)
  provides:
    - EnemyPanel (enemy sprite + HP bar + defeat state)
    - BattleLog (scrollable action log with auto-scroll)
    - FloatingDamageNumber (CSS-animated damage popup, self-removing)
  affects:
    - 02-06  # BattleScene wiring consumes all three components
tech_stack:
  added: []
  patterns:
    - "React import required in component files (vitest/jsdom uses classic JSX runtime)"
    - "scrollIntoView mocked globally in test-setup.ts (jsdom does not implement it)"
    - "CSS Module class composition via array.filter(Boolean).join(' ') for conditional classes"
    - "FloatingDamageNumber: onAnimationEnd self-removal, no setTimeout or useEffect timer"
    - "EnemyPanel: defeat state via opacity-20 grayscale Tailwind utilities on sprite wrapper"
key_files:
  created:
    - src/components/BattleLog.tsx
    - src/components/EnemyPanel.tsx
    - src/components/FloatingDamageNumber.tsx
  modified:
    - src/components/BattleLog.test.tsx  # replaced 3 it.todo stubs with passing tests
    - src/test-setup.ts                  # added scrollIntoView global mock for jsdom
decisions:
  - "Added React import explicitly to BattleLog.tsx and FloatingDamageNumber.tsx — vitest/jsdom uses classic JSX runtime which requires React in scope"
  - "Mocked scrollIntoView in test-setup.ts rather than guarding call in component — component behavior is correct; jsdom is the missing implementation"
  - "EnemyPanel labels the sprite wrapper with aria-label including 'derrotada' suffix when defeated — communicates defeat state to screen readers"
metrics:
  duration: "~12 minutes"
  completed: "2026-04-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 2
---

# Phase 02 Plan 05: EnemyPanel, BattleLog, FloatingDamageNumber Summary

**One-liner:** Three stateless display components — EnemyPanel with SpriteFallback + CSS Module HP bar + grayscale defeat state, BattleLog with smooth auto-scroll, and FloatingDamageNumber with CSS keyframe self-removal via onAnimationEnd.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | EnemyPanel and BattleLog with tests | 48e47f6 | BattleLog.tsx, EnemyPanel.tsx, BattleLog.test.tsx, test-setup.ts |
| 2 | FloatingDamageNumber component | ff319c6 | FloatingDamageNumber.tsx |

## What Was Built

### EnemyPanel (`src/components/EnemyPanel.tsx`)

Renders the enemy combatant panel with:
- Enemy name in Blue Wave electric color (`var(--color-electric)`)
- `SpriteFallback` with `combatantId={enemy.id}` and `kind="enemy"` — gets the correct red glow for CASTING_PROBE_MK1
- HP bar using `hpBarTrack`/`hpBarFill` classes from `@/styles/battle.module.css` with CSS `transition: width 600ms ease-out`; `hpWarning` applied below 50%, `hpCritical` below 30%
- Defeat state: sprite wrapper gets `opacity-20 grayscale` Tailwind utilities when `enemy.isDefeated === true`, plus a "DEFEATED" text overlay and `aria-label` update
- No EN bar (enemies don't expose EN)
- `role="progressbar"` with `aria-valuenow`/`aria-valuemax` on the HP fill div

### BattleLog (`src/components/BattleLog.tsx`)

Renders the action history log with:
- `role="log"` + `aria-live="polite"` for accessible live region (UI-07)
- `useRef<HTMLDivElement>` sentinel div at bottom; `useEffect([log])` calls `scrollIntoView({ behavior: 'smooth' })` on every log update
- Empty state renders `...` placeholder
- Entries rendered in array order (index 0 = oldest at top, newest at bottom)

### FloatingDamageNumber (`src/components/FloatingDamageNumber.tsx`)

Renders a single damage/heal popup with:
- `styles.damageNumber` class from `@/styles/battle.module.css` — `position: absolute`, `animation: floatDamage 700ms ease-out forwards` (`translateY -48px`, `opacity 1→0`)
- `styles.damageNumberHeal` added when `isHeal=true` (cyan-neon color)
- `onAnimationEnd={onDone}` — the only cleanup mechanism; no `setTimeout`, no `useEffect`
- `aria-live="assertive"` + `aria-atomic="true"` — announces damage on every popup mount
- Display: `-{amount}` for damage, `+{amount}` for heal
- No inline positioning — parent provides `position: relative` wrapper; CSS Module handles `position: absolute`

### BattleLog Tests (`src/components/BattleLog.test.tsx`)

Replaced 3 `it.todo` stubs with passing tests:
1. `renders all log entries passed as props` — getByText for two lore strings
2. `renders empty state when log array is empty` — verifies `...` placeholder renders without throw
3. `renders most recent entry last` — checks DOM paragraph order matches array order (index 0 first)

### Test Infrastructure Fix (`src/test-setup.ts`)

Added `Element.prototype.scrollIntoView = vi.fn()` — jsdom (version 25) does not implement `scrollIntoView`; without this mock every component that calls it throws `TypeError: scrollIntoView is not a function` in the test environment. The mock is global so all component tests benefit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Added `import React` to component files**
- **Found during:** Task 1 — first test run
- **Issue:** `ReferenceError: React is not defined` — vitest with jsdom uses the classic JSX runtime which requires React in scope. Next.js production builds use the automatic JSX transform (no import needed), but the test environment did not.
- **Fix:** Added `import React, { useEffect, useRef } from 'react'` to BattleLog.tsx and `import React from 'react'` to FloatingDamageNumber.tsx.
- **Files modified:** src/components/BattleLog.tsx, src/components/FloatingDamageNumber.tsx
- **Commit:** 48e47f6 (BattleLog), ff319c6 (FloatingDamageNumber)

**2. [Rule 2 - Missing critical functionality] Mocked `scrollIntoView` in test setup**
- **Found during:** Task 1 — second test run after React import fix
- **Issue:** `TypeError: logEndRef.current?.scrollIntoView is not a function` — jsdom 25 does not implement `scrollIntoView`. The component logic is correct for production browser environments.
- **Fix:** Added `Element.prototype.scrollIntoView = vi.fn()` to `src/test-setup.ts` so all component tests inherit the mock.
- **Files modified:** src/test-setup.ts
- **Commit:** 48e47f6

**3. [Rule 3 - Blocking issue] Installed `@testing-library/jest-dom`**
- **Found during:** Task 1 — first test run with jsdom environment
- **Issue:** `Failed to resolve import "@testing-library/jest-dom"` — the package was in `package.json` but not installed in the worktree's `node_modules` (worktree had only a `.vite` cache directory).
- **Fix:** Ran `npm install --prefer-offline` then `npm install -D @testing-library/jest-dom` in the worktree.
- **Files modified:** package-lock.json (worktree-local)
- **Commit:** 48e47f6

## Known Stubs

None. All three components are fully wired to their data contracts:
- EnemyPanel: all `enemy` props rendered (name, hp, maxHp, isDefeated, id)
- BattleLog: all `log` entries rendered in order
- FloatingDamageNumber: amount and isHeal rendered; onDone wired to onAnimationEnd

## Threat Flags

None. All components are pure display — no network endpoints, no auth paths, no file access, no schema changes.

## Self-Check: PASSED

- [x] `src/components/BattleLog.tsx` — FOUND
- [x] `src/components/EnemyPanel.tsx` — FOUND
- [x] `src/components/FloatingDamageNumber.tsx` — FOUND
- [x] Commit `48e47f6` — FOUND in git log
- [x] Commit `ff319c6` — FOUND in git log
- [x] `npm run test -- --run src/components/BattleLog.test.tsx` — 3 passed
- [x] `npx tsc --noEmit` — clean (no errors)
- [x] `npm run build` — exit 0 (static pages generated successfully)
