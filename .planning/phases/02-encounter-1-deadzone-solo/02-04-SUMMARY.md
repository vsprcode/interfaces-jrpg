---
phase: 02-encounter-1-deadzone-solo
plan: "04"
subsystem: battle-ui-components
tags: [ActionMenu, CharacterHUD, CSS-Modules, battle-animations, VISUAL-02]
dependency_graph:
  requires:
    - 02-02  # vitest jsdom environment + @testing-library/react setup
    - 02-03  # SpriteFallback + sprite-fallback.module.css
  provides:
    - ActionMenu component (4-button command menu, keyboard nav, EN gate, item gate)
    - CharacterHUD component (HP/EN bars, width transition, defending badge)
    - battle.module.css (bar transitions, flash/floatDamage keyframes, corridor gradient)
  affects:
    - BattleScene (will import ActionMenu + CharacterHUD in Wave 4)
    - EnemyPanel (will share battle.module.css damageNumber classes)
tech_stack:
  added:
    - "@testing-library/jest-dom — jest-dom matchers for toBeDisabled/toBeInTheDocument"
  patterns:
    - "CSS Module class composition for HP threshold colors (hpWarning, hpCritical)"
    - "useEffect keyboard listener with cleanup (Pitfall 1 / T-02-04-04)"
    - "Variant toggle pattern for @keyframes flash re-trigger (flashA/flashB)"
key_files:
  created:
    - src/components/ActionMenu.tsx
    - src/components/CharacterHUD.tsx
    - src/styles/battle.module.css
    - src/test-setup.ts
  modified:
    - src/components/ActionMenu.test.tsx  # replaced 7 it.todo stubs with 8 real tests
    - vitest.config.ts                    # added @ alias + setupFiles for jest-dom
decisions:
  - "Added React import explicitly in ActionMenu.tsx and CharacterHUD.tsx — Vitest/jsdom does not use Next.js automatic JSX runtime transform"
  - "Installed @testing-library/jest-dom for toBeDisabled/toBeInTheDocument matchers (not in original dependencies)"
  - "Added vitest.config.ts resolve.alias for @ path — required for @/ imports in test files to resolve correctly"
  - "VISUAL-02 was already implemented: sprite-fallback.module.css already had image-rendering: pixelated on .sprite class from Phase 1"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-26"
  tasks_completed: 2
  files_modified: 6
---

# Phase 02 Plan 04: ActionMenu + CharacterHUD + Battle CSS Module Summary

**One-liner:** 4-button ActionMenu with keyboard shortcuts and EN/item gates, CharacterHUD with HP/EN CSS-transition bars, and battle.module.css with flash/floatDamage keyframes and corridor gradient.

## What Was Built

### Task 1: ActionMenu component (TDD — 8 tests passing)

`src/components/ActionMenu.tsx` — 4-button command menu:
- ATACAR, HABILIDADE, DEFENDER, ITEM buttons rendered when phase is PLAYER_INPUT
- HABILIDADE disabled when `actor.en < 8` (SKILL-04 / T-02-04-01)
- ITEM disabled when `items.nanoMed <= 0`
- All buttons disabled when `phase !== 'PLAYER_INPUT'` (T-02-04-02)
- Keyboard shortcuts 1-4 via `window.addEventListener('keydown')` in `useEffect` with cleanup (T-02-04-04)
- No hardcoded hex colors — Tailwind v4 utility classes using CSS var tokens (VISUAL-01)

`src/components/ActionMenu.test.tsx` — 8 tests replacing 7 `it.todo` stubs:
- Button rendering, all-disabled state, EN gate (disabled/enabled), item gate
- Keyboard shortcut fires (key 1), keyboard skips gated action (key 2 with low EN), keyboard blocked in wrong phase

### Task 2: CharacterHUD + battle.module.css + VISUAL-02 verification

`src/components/CharacterHUD.tsx`:
- HP bar: `role="progressbar"`, `aria-valuenow/max`, width from `hp/maxHp` ratio via inline style
- EN bar: same pattern, `aria-label` in Portuguese
- HP threshold: CSS Module class composition — `hpCritical` (<30%), `hpWarning` (<50%)
- Defending badge rendered when `character.isDefending === true`
- Zero hardcoded hex colors (all via CSS Module vars)

`src/styles/battle.module.css`:
- `.hpBarFill` / `.enBarFill`: `transition: width 600ms ease-out` (UI-10)
- `.battleBackground`: `linear-gradient` using Blue Wave vars (ASSETS-03)
- `@keyframes flash` + `.flashA/.flashB` variant toggle (VISUAL-03)
- `@keyframes floatDamage` + `.damageNumber/.damageNumberHeal` (UI-09)
- `@keyframes shake` + `.shake` (camera shake, VISUAL-03 variant)
- `.defendingBadge` status indicator

**VISUAL-02 status:** Already implemented in Phase 1 — `sprite-fallback.module.css` line 30 already has `image-rendering: pixelated` on the `.sprite` class. No change required.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @ path alias in vitest.config.ts**
- **Found during:** Task 1 RED phase — test file could not import `@/components/ActionMenu`
- **Issue:** vitest.config.ts had no `resolve.alias` for the `@` path, which TypeScript resolves via tsconfig.json `paths` but Vite/Vitest does not automatically inherit
- **Fix:** Added `resolve: { alias: { '@': path.resolve(__dirname, './src') } }` to vitest.config.ts
- **Files modified:** `vitest.config.ts`
- **Commit:** fd0f612

**2. [Rule 3 - Blocking] React not defined in jsdom environment**
- **Found during:** Task 1 GREEN phase first run
- **Issue:** Vitest jsdom does not apply Next.js's automatic JSX runtime transform; ActionMenu.tsx used JSX without importing React
- **Fix:** Added `import React from 'react'` to ActionMenu.tsx and CharacterHUD.tsx
- **Files modified:** `src/components/ActionMenu.tsx`, `src/components/CharacterHUD.tsx`
- **Commit:** fd0f612

**3. [Rule 3 - Blocking] Missing @testing-library/jest-dom for DOM matchers**
- **Found during:** Task 1 GREEN phase — `toBeDisabled()` and `toBeInTheDocument()` threw "Invalid Chai property"
- **Issue:** These matchers are not in Vitest's built-in `expect` — they require `@testing-library/jest-dom` to be imported in a setup file
- **Fix:** Installed `@testing-library/jest-dom`, created `src/test-setup.ts` with the import, added `setupFiles: ['./src/test-setup.ts']` to vitest.config.ts
- **Files modified:** `vitest.config.ts`, new `src/test-setup.ts`
- **Commit:** fd0f612

**4. [Pre-existing] VISUAL-02 already implemented**
- **Found during:** Task 2 read phase
- **Issue:** None — `sprite-fallback.module.css` line 30 already has `image-rendering: pixelated` on `.sprite` from Phase 1 Plan 03
- **Fix:** No change needed; verified with grep
- **Commit:** n/a (pre-existing)

## Known Stubs

None. All components are fully wired to their props. HP/EN bar widths are computed from `character.hp/maxHp` and `character.en/maxEn` — no placeholder values.

`battle.module.css` includes `.battleBackground` which is intentionally a CSS gradient placeholder for the corridor background asset (ASSETS-03). This is documented in the plan as a Phase 5 asset replacement, not a functional stub.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. ActionMenu dispatches only from trusted reducer state prop values. KeyboardEvent phase guard is in place (T-02-04-01).

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/components/ActionMenu.tsx | FOUND |
| src/components/CharacterHUD.tsx | FOUND |
| src/styles/battle.module.css | FOUND |
| src/test-setup.ts | FOUND |
| commit fd0f612 (Task 1) | FOUND |
| commit a286d92 (Task 2) | FOUND |
