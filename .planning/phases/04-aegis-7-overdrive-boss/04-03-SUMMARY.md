---
phase: 4
plan: "04-03"
subsystem: "components/UI"
tags: [overdrive, ui, demo-completed, battle-scene, action-menu, game-controller]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [OVERDRIVE-UI, DEMO_COMPLETED-screen, E4-wiring, DemoCompletedScreen]
  affects:
    - src/components/BattleScene.tsx
    - src/components/ActionMenu.tsx
    - src/components/GameController.tsx
    - src/components/DemoCompletedScreen.tsx
    - src/components/DemoCompletedScreen.test.tsx
tech_stack:
  added: []
  patterns:
    - "A/B variant toggle for OVERDRIVE overlay animation restart (same pattern as flashVariant/shakeVariant)"
    - "pointer-events:none overlay at zIndex 25 above flash overlay (zIndex 20) but below modals"
    - "isOverdrivePhase prop threading BattleScene → ActionMenu"
    - "ControllerPhase discriminated union extended with ENCOUNTER_4_DIALOGUE + DEMO_COMPLETED"
key_files:
  created:
    - src/components/DemoCompletedScreen.tsx
    - src/components/DemoCompletedScreen.test.tsx
  modified:
    - src/components/BattleScene.tsx
    - src/components/ActionMenu.tsx
    - src/components/GameController.tsx
decisions:
  - "OVERDRIVE overlay uses inline styles instead of CSS Module classes — styles.overdriveOverlay/overdriveText/overdriveSubText deferred to Wave 3 (battle.module.css); inline styles prevent CSS Module class-not-found errors at runtime"
  - "DEFENDER button glow references styles.defenderOverdriveGlow which is also deferred to Wave 3 — class resolves to undefined in CSS Modules (no runtime error, just no visual glow until Wave 3 adds the keyframe)"
  - "bg_command_chamber background class deferred to Wave 3 — styles.bg_command_chamber resolves to undefined, falls back to default battleBackground gradient"
  - "NOVA INFILTRACAO uses ASCII-safe text (no tilde on ã) to avoid pixel font rendering issues with diacritics"
  - "handleNewGame uses setEncounterIndex(0) directly (not callback form) — resetting to 0 from any index is a known value"
metrics:
  duration: "~13 minutes"
  completed: "2026-04-26"
  tasks_completed: 2
  files_modified: 5
---

# Phase 4 Plan 03: Wave 2 — OVERDRIVE UI + DemoCompletedScreen Summary

Wired the Wave 1 OVERDRIVE engine to the UI. OVERDRIVE overlay appears during TERMINUS charge (OVERDRIVE_WARNING + OVERDRIVE_RESOLVING), DEFENDER button accepts isOverdrivePhase prop for glow treatment, GameController routes E3→E4→DEMO_COMPLETED, and DemoCompletedScreen provides a working reset to E1.

## Test Results

```
Test Files  12 passed (12)
     Tests  142 passed | 4 todo (146)
  Duration  ~2.08s
```

Baseline before this plan: 138 tests (11 test files). After: 142 tests (12 test files) — +4 DemoCompletedScreen tests. No regressions.

## Files Modified

### src/components/BattleScene.tsx

| Change | Description |
|--------|-------------|
| `overdriveVariant` state | A/B toggle (same pattern as flashVariant/shakeVariant) — toggles when phase enters OVERDRIVE_WARNING |
| overdriveVariant useEffect | Fires on phase change to OVERDRIVE_WARNING, calls `setOverdriveVariant(v => v === 'a' ? 'b' : 'a')` |
| ENEMY_TURN useEffect guard | Expanded: `state.phase !== 'ENEMY_TURN' && state.phase !== 'OVERDRIVE_RESOLVING'` |
| stale ref check | Expanded: `current.phase === 'ENEMY_TURN' \|\| current.phase === 'OVERDRIVE_RESOLVING'` |
| bgVariants | Added `'command_chamber'` for encounterIndex 3; bgClass now includes `styles.bg_command_chamber` conditional |
| OVERDRIVE overlay JSX | Rendered above main flex-col div when phase is OVERDRIVE_WARNING or OVERDRIVE_RESOLVING; `pointerEvents: 'none'`, `zIndex: 25`, `key={overdriveVariant}` |
| ActionMenu isOverdrivePhase | Passed as `state.phase === 'OVERDRIVE_WARNING'` |

### src/components/ActionMenu.tsx

| Change | Description |
|--------|-------------|
| `styles` import | Added `import styles from '@/styles/battle.module.css'` |
| `isOverdrivePhase` prop | Added to `ActionMenuProps` interface as `isOverdrivePhase?: boolean` |
| `isInputPhase` | Expanded to `phase === 'PLAYER_INPUT' \|\| phase === 'OVERDRIVE_WARNING'` |
| skillSelect reset useEffect | Condition updated to also exclude OVERDRIVE_WARNING from reset |
| DEFENDER button | Conditionally adds `styles.defenderOverdriveGlow` class via array join |

### src/components/GameController.tsx

| Change | Description |
|--------|-------------|
| DemoCompletedScreen import | Added `import { DemoCompletedScreen } from '@/components/DemoCompletedScreen'` |
| ControllerPhase union | Added `'ENCOUNTER_4_DIALOGUE'` and `'DEMO_COMPLETED'` variants |
| E4_DIALOGUE constant | Three lore lines (DEADZONE, TORC, TRINETRA) as AEGIS-7 reveal |
| handleVictory | encounterIndex 2 → `ENCOUNTER_4_DIALOGUE`; encounterIndex 3 → `DEMO_COMPLETED`; fallback else kept for extensibility |
| handleNewGame | Resets encounterIndex to 0, carryParty to E1 starting party, increments battleKey, sets controllerPhase to BATTLE |
| JSX render | Added `ENCOUNTER_4_DIALOGUE` block (DialogueBox with E4_DIALOGUE) and `DEMO_COMPLETED` block (DemoCompletedScreen) |

## Files Created

### src/components/DemoCompletedScreen.tsx

`'use client'` component. Renders:
- ASCII art pre block (aria-hidden)
- "AEGIS-7 NEUTRALIZADO" paragraph
- "OPERACAO INTERFACES COMPLETA" paragraph
- Flavour text paragraph
- "NOVA INFILTRACAO" button (onClick → onNewGame prop)

All styled with inline styles (no CSS Module dependency). Exports `DemoCompletedScreen`.

### src/components/DemoCompletedScreen.test.tsx

4 tests:
1. Renders "AEGIS-7 NEUTRALIZADO" text
2. Renders "OPERACAO INTERFACES COMPLETA" text
3. Renders "NOVA INFILTRACAO" button by role
4. Calls onNewGame exactly once when button clicked

## CSS Classes Pending Wave 3 Implementation

The following CSS Module class references are used in code but not yet defined in `battle.module.css`. They resolve to `undefined` at runtime (no error, just no visual effect) until Wave 3 adds them:

| Class | File | Purpose |
|-------|------|---------|
| `styles.defenderOverdriveGlow` | ActionMenu.tsx | Pulsing cyan glow on DEFENDER button during TERMINUS charge |
| `styles.bg_command_chamber` | BattleScene.tsx | Dark red/crimson background gradient for AEGIS-7 boss room |

The OVERDRIVE overlay itself uses inline styles (no CSS Module dependency) per plan specification, so it renders correctly without Wave 3.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] React import missing in DemoCompletedScreen.test.tsx**
- **Found during:** Task 1 RED phase — all 4 tests failed with `ReferenceError: React is not defined`
- **Issue:** Test file used JSX without importing React; other test files in the project use explicit `import React from 'react'`
- **Fix:** Added `import React from 'react'` as first import in the test file
- **Files modified:** `src/components/DemoCompletedScreen.test.tsx`
- **Commit:** `6dc1f5e` (same atomic commit)

**2. [Rule 2 - Missing Critical Functionality] OVERDRIVE overlay uses inline styles instead of CSS Module classes**
- **Found during:** Task 1 implementation — plan specified `styles.overdriveOverlay`, `styles.overdriveText`, `styles.overdriveSubText` but Wave 3 hasn't added them to battle.module.css yet
- **Fix:** Implemented overlay with inline styles so component renders correctly without waiting for Wave 3; CSS Module classes can be applied in Wave 3 as a refactor
- **Files modified:** `src/components/BattleScene.tsx`

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `styles.defenderOverdriveGlow` (class undefined) | `src/components/ActionMenu.tsx` | CSS keyframe not yet in battle.module.css — Wave 3 adds it |
| `styles.bg_command_chamber` (class undefined) | `src/components/BattleScene.tsx` | CSS gradient not yet in battle.module.css — Wave 3 adds it |

Both stubs are intentional — they do not prevent the plan's goal from being achieved (OVERDRIVE overlay renders, DEFENDER is enabled, E4 flows to DEMO_COMPLETED). Wave 3 (04-04) resolves both.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

| Mitigation | Status |
|------------|--------|
| T-04-03-01: OVERDRIVE overlay pointer-events:none | Applied — inline `pointerEvents: 'none'` in JSX style prop |
| T-04-03-02: handleNewGame state reset uses fresh party reference | Applied — `ENCOUNTER_CONFIGS[0]!.party` is the source of truth |

## Self-Check: PASSED
