---
phase: 03-party-expansion-encounters-2-3
plan: "06"
subsystem: ui-components
tags: [dialogue, target-picker, action-menu, game-controller, trinetra, state-machine]
one_liner: "TRINETRA two-step skill picker (SkillSelectStep) wired in ActionMenu + DialogueBox cinematic component with TORC/TRINETRA intro sequences integrated in GameController"

dependency_graph:
  requires:
    - "03-04: GameController ControllerPhase state machine; BattleScene parameterized"
    - "03-02: TRINETRA SKILL/HEAL and SKILL/REMOVE_STATUS reducer cases"
  provides:
    - "ActionMenu: SkillSelectStep local state machine for TRINETRA two-step flow"
    - "DialogueBox: full-screen overlay with line-by-line rendering (click/Space to advance)"
    - "GameController: ENCOUNTER_2_DIALOGUE and ENCOUNTER_3_DIALOGUE phases before E2/E3"
  affects:
    - src/components/ActionMenu.tsx
    - src/components/BattleScene.tsx
    - src/components/GameController.tsx
    - src/components/DialogueBox.tsx (new)
    - src/components/DialogueBox.test.tsx (new)
    - src/components/ActionMenu.test.tsx

tech_stack:
  added: []
  patterns:
    - "SkillSelectStep discriminated union: { step: 'none' } | { step: 'pick_target' } | { step: 'pick_effect'; targetId: string }"
    - "Phase-change reset: useEffect on phase !== 'PLAYER_INPUT' → setSkillSelect({ step: 'none' }) — T-03-06-01"
    - "DialogueBox keyboard cleanup: useEffect returns removeEventListener — T-03-06-02"
    - "GameController dialogue routing: encounterIndex 0 → ENCOUNTER_2_DIALOGUE, 1 → ENCOUNTER_3_DIALOGUE"
    - "handleDialogueComplete: setEncounterIndex + setBattleKey + setControllerPhase('BATTLE')"

key_files:
  created:
    - path: src/components/DialogueBox.tsx
      purpose: "Full-screen overlay dialogue component; line-by-line rendering; click/Space/Enter to advance; calls onComplete when all lines consumed"
    - path: src/components/DialogueBox.test.tsx
      purpose: "4 component tests: render first line, advance on click, onComplete called at end, empty lines renders null"
  modified:
    - path: src/components/ActionMenu.tsx
      change: "Added SkillSelectStep local state machine, party prop, onSkillWithTarget prop; TRINETRA enters pick_target mode instead of calling onSkill; phase-change reset (T-03-06-01)"
    - path: src/components/BattleScene.tsx
      change: "Added handleSkillWithTarget handler dispatching PLAYER_ACTION with skillVariant; passes party and onSkillWithTarget to ActionMenu"
    - path: src/components/GameController.tsx
      change: "Extended ControllerPhase with ENCOUNTER_2_DIALOGUE and ENCOUNTER_3_DIALOGUE; handleVictory routes to dialogue phases; added E2_DIALOGUE/E3_DIALOGUE lore constants; DialogueBox rendered in JSX"
    - path: src/components/ActionMenu.test.tsx
      change: "Added party and onSkillWithTarget to renderMenu defaultProps (Rule 1 fix)"

decisions:
  - "SkillSelectStep as local useState in ActionMenu (not in reducer/store) — skill selection is transient UI state, not game state; reset on phase change is sufficient"
  - "DialogueBox renders null when lines array is empty (defensive guard for empty-array edge case)"
  - "handleVictory routing by encounterIndex (0 → E2 dialogue, 1 → E3 dialogue) avoids needing a separate lookup table"
  - "React import added explicitly to DialogueBox.tsx and test — jsdom test environment requires explicit React import for JSX transform"

metrics:
  duration: "~4 minutes"
  completed_date: "2026-04-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 4
---

# Phase 3 Plan 06: TRINETRA Skill Picker + DialogueBox Summary

## What Was Built

Wired TRINETRA's two-step skill selection UI into ActionMenu with a local SkillSelectStep state machine, and built the DialogueBox cinematic component for narrative sequences between encounters. GameController now routes through ENCOUNTER_2_DIALOGUE (TORC intro) and ENCOUNTER_3_DIALOGUE (TRINETRA intro) before starting E2 and E3 respectively.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | TRINETRA target-picker in ActionMenu (SkillSelectStep) | 742b971 | ActionMenu.tsx, BattleScene.tsx, ActionMenu.test.tsx |
| 2 | DialogueBox component + tests + GameController integration | 8d813b9 | DialogueBox.tsx (new), DialogueBox.test.tsx (new), GameController.tsx |

## Implementation Details

### SkillSelectStep State Machine

```typescript
type SkillSelectStep =
  | { step: 'none' }
  | { step: 'pick_target' }
  | { step: 'pick_effect'; targetId: string };
```

Flow: HABILIDADE click (TRINETRA) → `pick_target` → click party member → `pick_effect` → click CURAR or LIMPAR STATUS → dispatch `PLAYER_ACTION { type: 'SKILL', actorId: 'TRINETRA', targetId, skillVariant }` → reset to `none`.

Phase-change reset (T-03-06-01 mitigation):
```typescript
useEffect(() => {
  if (phase !== 'PLAYER_INPUT') {
    setSkillSelect({ step: 'none' });
  }
}, [phase]);
```

### DialogueBox Component

Full-screen overlay (z-index 60) with click-to-advance and Space/Enter keyboard support. Renders current line with speaker label and progress indicator. Calls `onComplete` when the last line is advanced past. Keyboard listener cleaned up on unmount (T-03-06-02 mitigation).

### GameController Dialogue Routing

```
E1 victory → ENCOUNTER_2_DIALOGUE (E2_DIALOGUE: 3 lines, TORC intro)
             → [DialogueBox complete] → E2 starts (encounterIndex=1)

E2 victory → ENCOUNTER_3_DIALOGUE (E3_DIALOGUE: 3 lines, TRINETRA intro)
             → [DialogueBox complete] → E3 starts (encounterIndex=2)

E3 victory → ENCOUNTER_COMPLETE (existing flow)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ActionMenu.test.tsx missing new required props**
- **Found during:** Task 1, `npx tsc --noEmit`
- **Issue:** `renderMenu` helper did not include `party` or `onSkillWithTarget` — TypeScript error after ActionMenuProps extended
- **Fix:** Added `party: [makeActor()]` and `onSkillWithTarget: vi.fn()` to `renderMenu` defaultProps
- **Files modified:** `src/components/ActionMenu.test.tsx`
- **Commit:** 742b971

**2. [Rule 1 - Bug] DialogueBox.tsx missing React import for jsdom test environment**
- **Found during:** Task 2, `npx vitest run src/components/DialogueBox.test.tsx`
- **Issue:** The plan template omitted `import React from 'react'` in DialogueBox.tsx; jsdom test environment requires explicit React in scope for JSX transform to work (matches pattern seen in all other component files in this project)
- **Fix:** Added `import React` to both `DialogueBox.tsx` and `DialogueBox.test.tsx`
- **Files modified:** `src/components/DialogueBox.tsx`, `src/components/DialogueBox.test.tsx`
- **Commit:** 8d813b9

## Test Results

| Suite | Before | After |
|-------|--------|-------|
| All existing suites | 118 passing + 4 todo | 118 passing + 4 todo |
| DialogueBox.test.tsx | — | 4 passing |
| **Total** | **118 + 4 todo** | **122 + 4 todo** |

## Known Stubs

None. TRINETRA skill picker is fully wired end-to-end: ActionMenu two-step UI → BattleScene `handleSkillWithTarget` → reducer `PLAYER_ACTION { type: 'SKILL', actorId: 'TRINETRA', skillVariant }`. DialogueBox lore content is embedded (not placeholder text).

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

- T-03-06-01 (Denial — SkillSelectStep stuck in pick_target): mitigated — `useEffect` resets to `{ step: 'none' }` when `phase !== 'PLAYER_INPUT'`; confirmed by `grep -n "phase !== 'PLAYER_INPUT'" src/components/ActionMenu.tsx` returning 1 match.
- T-03-06-02 (Denial — DialogueBox keyboard listener leak): mitigated — `useEffect` returns `() => window.removeEventListener('keydown', handleKey)` cleanup; confirmed by grep.

## Self-Check: PASSED

- `src/components/ActionMenu.tsx` — FOUND
- `src/components/BattleScene.tsx` — FOUND
- `src/components/GameController.tsx` — FOUND
- `src/components/DialogueBox.tsx` — FOUND
- `src/components/DialogueBox.test.tsx` — FOUND
- Commit 742b971 (TRINETRA target-picker) — FOUND
- Commit 8d813b9 (DialogueBox + GameController) — FOUND
- `grep -n "SkillSelectStep" src/components/ActionMenu.tsx` — 4 matches (type def, comment, useState, useEffect comment)
- `grep -n "pick_target\|pick_effect" src/components/ActionMenu.tsx` — 8+ matches
- `grep -n "onSkillWithTarget" src/components/ActionMenu.tsx` — 4 matches (prop def, destructure, 2 calls)
- `grep -n "onSkillWithTarget" src/components/BattleScene.tsx` — 2 matches (handler def + prop pass)
- `grep -n "phase !== 'PLAYER_INPUT'" src/components/ActionMenu.tsx` — 1 match
- `grep -n "skillVariant" src/components/BattleScene.tsx` — 1 match
- `grep -n "ENCOUNTER_2_DIALOGUE\|ENCOUNTER_3_DIALOGUE" src/components/GameController.tsx` — 5 matches
- `grep -n "E2_DIALOGUE\|E3_DIALOGUE" src/components/GameController.tsx` — 4 matches
- `grep -n "Forge Wall" src/components/GameController.tsx` — 1 match
- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — 122 passed, 0 failed, 4 todo
