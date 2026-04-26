---
phase: 05-polish-narrative-deploy
plan: "02"
subsystem: narrative-accessibility
tags: [narr-06, accessibility, wcag, aria, tdd, lighthouse]
dependency_graph:
  requires: [05-01]
  provides: [NARR-06 closing hook, WCAG-AA pagination contrast, aria-modal dialog, aria-valuemin progressbars]
  affects: [DemoCompletedScreen.tsx, DialogueBox.tsx, CharacterHUD.tsx]
tech_stack:
  added: []
  patterns: [TDD red-green, additive ARIA attributes, CSS var contrast fix]
key_files:
  created: []
  modified:
    - src/components/DemoCompletedScreen.tsx
    - src/components/DemoCompletedScreen.test.tsx
    - src/components/DialogueBox.tsx
    - src/components/CharacterHUD.tsx
decisions:
  - "Tagline styled with #00bfff (Blue Wave electric blue) at opacity 0.7 — visually subordinate to main content but cohesive with palette"
  - "Pagination text contrast fixed via var(--color-text-glow) (#7DF9FF) rather than a new hex value — keeps color usage within existing token system"
  - "aria-valuemin={0} is additive only — no logic changes to HP/EN bar rendering"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-26T19:30:31Z"
  tasks_completed: 2
  files_modified: 4
requirements: [NARR-06, QA-08]
---

# Phase 05 Plan 02: Closing Narrative Hook + Accessibility Fixes Summary

**One-liner:** NARR-06 "Próximo capítulo em breve..." tagline added to DemoCompletedScreen between italic line and button; three Lighthouse accessibility issues fixed (aria-modal on DialogueBox, pagination contrast #444→var(--color-text-glow), aria-valuemin={0} on both CharacterHUD progressbars).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add NARR-06 tagline to DemoCompletedScreen (TDD) | 9bca89c | DemoCompletedScreen.tsx, DemoCompletedScreen.test.tsx |
| 2 | Fix Lighthouse accessibility issues in DialogueBox and CharacterHUD | 4d8b498 | DialogueBox.tsx, CharacterHUD.tsx, DemoCompletedScreen.test.tsx |

## What Was Built

### Task 1 — NARR-06 Closing Narrative Hook

Added a "Próximo capítulo em breve..." tagline paragraph to `DemoCompletedScreen` between the italic "A resistência analógica persiste" line and the NOVA INFILTRACAO button.

Styling: `#00bfff` (Blue Wave electric blue), `fontSize: '7px'`, `opacity: 0.7`, `letterSpacing: '0.06em'`, `marginBottom: '32px'`. Not `aria-hidden` — narrative content that assistive tech should read.

3 new TDD tests added:
- tagline renders with `/próximo capítulo em breve/i`
- tagline element has no `aria-hidden` attribute
- tagline appears in DOM after the italic paragraph and before the button

### Task 2 — Lighthouse Accessibility Fixes

**DialogueBox.tsx:**
- Added `aria-modal="true"` to the outer `role="dialog"` div — required by WCAG 2.1 for modal dialogs so screen readers restrict navigation to dialog content
- Changed pagination text color from `#444` (fails WCAG AA on dark background) to `var(--color-text-glow)` (#7DF9FF, ~8:1 contrast ratio — passes WCAG AA and AAA)

**CharacterHUD.tsx:**
- Added `aria-valuemin={0}` to the HP progressbar div
- Added `aria-valuemin={0}` to the EN progressbar div

Both additions are purely additive ARIA attributes — no logic or visual changes.

## Test Results

- **Before:** 152 tests (all green, from plan 05-01)
- **After:** 155 tests (all green) — 3 new tests added for Task 1 (TDD)
- TypeScript: 0 errors (`npx tsc --noEmit` clean)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type narrowing in DemoCompletedScreen test**
- **Found during:** Task 2 — `npx tsc --noEmit` after Task 2 changes
- **Issue:** `container.querySelectorAll('p')[taglineIdx]` returns `HTMLParagraphElement | undefined` but was passed directly to `allNodes.indexOf()` which expects `Element` — TS2345 error
- **Fix:** Cast to `Element | undefined` and use it via the guarded `taglineNode` variable already in the `if` condition
- **Files modified:** `src/components/DemoCompletedScreen.test.tsx`
- **Commit:** 4d8b498 (included in Task 2 commit as fix was discovered during Task 2 verification)

## Known Stubs

None — all content is real lore text. No placeholder text.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are static text content and ARIA metadata attributes (threat register T-05-02-01 and T-05-02-02 both accepted as planned).

## Self-Check: PASSED

- `src/components/DemoCompletedScreen.tsx` — FOUND (contains "Próximo capítulo em breve")
- `src/components/DemoCompletedScreen.test.tsx` — FOUND (contains 7 tests)
- `src/components/DialogueBox.tsx` — FOUND (contains aria-modal and var(--color-text-glow))
- `src/components/CharacterHUD.tsx` — FOUND (contains aria-valuemin={0} on both progressbars)
- Commit 9bca89c — FOUND
- Commit 4d8b498 — FOUND
- Full test suite: 155/155 green
- TypeScript: 0 errors
