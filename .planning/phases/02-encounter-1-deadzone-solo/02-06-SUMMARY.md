---
phase: 02-encounter-1-deadzone-solo
plan: "06"
subsystem: battle-ui
tags: [battle-loop, integration, react, components, game-over, victory, animations]
dependency_graph:
  requires:
    - 02-04  # ActionMenu + CharacterHUD
    - 02-05  # EnemyPanel + BattleLog + FloatingDamageNumber
  provides:
    - fully-playable-encounter-1
    - victory-screen
    - game-over-screen
    - battlekey-reset-pattern
  affects:
    - src/app/page.tsx
    - src/components/BattleScene.tsx
tech_stack:
  added: []
  patterns:
    - useReducer battle loop with ENEMY_TURN useEffect (600ms beat delay)
    - flashVariant 'a'|'b' toggle for CSS animation re-trigger (VISUAL-03)
    - DamagePopup monotonic counter with popupCounter useRef
    - spriteState derived from pendingAction.animationType (UI-04 data-state)
    - React key prop reset via battleKey for full state destruction on retry
key_files:
  created:
    - src/components/VictoryScreen.tsx
    - src/components/GameOverScreen.tsx
  modified:
    - src/components/BattleScene.tsx
    - src/styles/battle.module.css
    - src/app/page.tsx
    - src/components/BattleScene.test.tsx
    - src/components/GameOverScreen.test.tsx
    - src/components/EnemyPanel.tsx
    - src/components/SpriteFallback.tsx
    - src/components/VictoryScreen.tsx
    - src/components/GameOverScreen.tsx
decisions:
  - "spriteState derived inline in render (not useEffect) — pure derivation from state, no sync needed"
  - "flashVariant key placed on overlay div, not className — forces DOM node recreation to restart CSS animation"
  - "onGameOver prop on BattleScene forwards to GameOverScreen.onRetry — single prop threading, no context"
  - "React import added explicitly to all component files — jsdom test environment lacks automatic JSX transform"
metrics:
  duration_seconds: 305
  completed_date: "2026-04-26T15:18:00Z"
  tasks_completed: 3
  files_modified: 10
requirements:
  - ENC-01
  - UI-01
  - UI-02
  - UI-03
  - UI-04
  - UI-05
  - UI-07
  - UI-09
  - UI-10
  - VISUAL-01
  - VISUAL-02
  - VISUAL-03
  - VISUAL-07
  - END-02
  - END-03
  - END-04
  - ASSETS-01
  - ASSETS-02
  - ASSETS-03
---

# Phase 2 Plan 06: BattleScene Integration + End Screens Summary

**One-liner:** Full playable battle loop wired — BattleScene integrates all 5 child components with ENEMY_TURN useEffect, damage popups, screen flash variant toggle, and DEADZONE sprite animation state (UI-04); VictoryScreen and GameOverScreen created; page.tsx adds battleKey React-key reset pattern.

## What Was Built

### Task 1: BattleScene rewrite + VictoryScreen + GameOverScreen

**BattleScene.tsx** fully rewritten from the Phase 1 skeleton:
- All 5 child components wired: CharacterHUD, EnemyPanel, ActionMenu, BattleLog, FloatingDamageNumber
- 3 useEffects: one-shot INIT, RESOLVING animation gate (800ms), ENEMY_TURN beat delay (600ms)
- Damage popup state: `DamagePopup[]` with monotonic `popupCounter` useRef; popups keyed by id for CSS animation remount
- Screen flash: `flashVariant 'a'|'b'` toggle on the overlay div's `key` prop — forces React to recreate DOM node, restarting the CSS animation on every hit (VISUAL-03)
- DEADZONE sprite state: `spriteState` derived from `state.phase + state.pendingAction.animationType` → `data-state` attribute on sprite wrapper div; CSS rules in battle.module.css apply per-state visual transforms (UI-04)
- VictoryScreen rendered when `state.phase === 'VICTORY'`
- GameOverScreen rendered when `state.phase === 'GAME_OVER'`, forwarding `onGameOver` prop

**VictoryScreen.tsx** created: "MISSÃO CONCLUÍDA" header, lore message, Blue Wave neon styling.

**GameOverScreen.tsx** created: "GAME OVER" header (danger red), "DEADZONE eliminada" text, [TENTAR NOVAMENTE] button with hover state via inline onMouseEnter/onMouseLeave.

**battle.module.css** extended with sprite animation state CSS:
```css
[data-state="attack"] .sprite { transform: translateX(8px); }
[data-state="hurt"]   .sprite { filter: brightness(2); }
[data-state="defend"] .sprite { filter: saturate(0.5); }
[data-state="skill"]  .sprite { filter: hue-rotate(60deg) brightness(1.5); }
[data-state="idle"]   .sprite { transform: translateX(0); filter: none; }
```

### Task 2: page.tsx battleKey + integration tests

**page.tsx** updated to client component with `battleKey` state:
- `useState(0)` for `battleKey`
- `handleGameOver` increments key: `setBattleKey(k => k + 1)`
- `<BattleScene key={battleKey} onGameOver={handleGameOver} />` — key prop destroys and recreates the entire BattleScene tree on retry (END-03, END-04)

**GameOverScreen.test.tsx**: All 3 it.todo stubs replaced with passing tests:
1. Renders "GAME OVER" text
2. Renders "TENTAR NOVAMENTE" button by role
3. Clicking button calls onRetry mock once

**BattleScene.test.tsx**: 2 smoke tests added:
1. Renders without crashing
2. ATACAR button visible after INIT (using `waitFor`)

### Task 3: Checkpoint auto-approved (autonomous mode)

Automated verification results:
- `npm run test -- --run`: **91 tests passed, 4 todos, 0 failures** (9 test files)
- `npx tsc --noEmit`: **EXIT 0** (clean)
- `npm run build`: **EXIT 0**, compiled successfully, 5.62kB page bundle

## Acceptance Criteria Verification

| Criterion | Status |
|-----------|--------|
| BattleScene first line is `'use client'` | PASS |
| 2x clearTimeout (both useEffects have cleanup) | PASS (4 total — 2 per useEffect body + return) |
| stateRef.current used in all setTimeout callbacks | PASS (2 occurrences inside timers) |
| ENEMY_TURN useEffect exists | PASS |
| setFlashVariant screen flash toggle | PASS |
| popupCounter monotonic counter | PASS |
| No Math.random in BattleScene | PASS |
| CharacterHUD rendered (UI-03) | PASS |
| EnemyPanel rendered (UI-03) | PASS |
| data-state attribute on sprite wrapper (UI-04) | PASS |
| spriteState derivation logic present | PASS |
| SpriteFallback DEADZONE (ASSETS-01) | PASS |
| VictoryScreen exports VictoryScreen | PASS |
| GameOverScreen exports GameOverScreen with onRetry | PASS |
| CSS rules for data-state states in battle.module.css | PASS |
| npx tsc --noEmit exits 0 | PASS |
| npm run build exits 0 | PASS |
| battleKey in page.tsx | PASS |
| setBattleKey(k => k+1) in page.tsx | PASS |
| 0 it.todo in GameOverScreen.test.tsx | PASS |
| GameOverScreen tests: 3 passing | PASS |
| BattleScene smoke tests passing | PASS |
| Full suite green (91 tests) | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] React not defined in jsdom test environment**
- **Found during:** Task 2 (test run)
- **Issue:** GameOverScreen.tsx, VictoryScreen.tsx, BattleScene.tsx, EnemyPanel.tsx, and SpriteFallback.tsx all lacked `import React from 'react'`. The jsdom environment uses the classic JSX transform which requires `React` in scope. Without it, all component tests threw `ReferenceError: React is not defined` at render time.
- **Fix:** Added `import React from 'react'` (or `import React, { ... } from 'react'`) to all 5 affected files. This matches the pattern already established by ActionMenu.tsx, BattleLog.tsx, CharacterHUD.tsx, and FloatingDamageNumber.tsx.
- **Files modified:** GameOverScreen.tsx, VictoryScreen.tsx, BattleScene.tsx, EnemyPanel.tsx, SpriteFallback.tsx
- **Commits:** c3aecf0

## Known Stubs

None — all data is wired from the battle engine. VictoryScreen receives a real message string. GameOverScreen has hardcoded lore text (correct per spec). No placeholder or TODO values flow to UI rendering.

## Threat Flags

No new network endpoints, auth paths, or file access patterns introduced. All new components are purely client-side React rendering existing reducer state.

## Commits

| Hash | Message |
|------|---------|
| 1c12443 | feat(02-06): rewrite BattleScene with full battle loop + end screens |
| c3aecf0 | feat(02-06): wire page.tsx battleKey reset + integration tests passing |

## Self-Check: PASSED

All created/modified files confirmed present on disk. Both task commits verified in git log.

| Item | Result |
|------|--------|
| src/components/BattleScene.tsx | FOUND |
| src/components/VictoryScreen.tsx | FOUND |
| src/components/GameOverScreen.tsx | FOUND |
| src/app/page.tsx | FOUND |
| src/components/BattleScene.test.tsx | FOUND |
| src/components/GameOverScreen.test.tsx | FOUND |
| src/styles/battle.module.css | FOUND |
| .planning/phases/02-encounter-1-deadzone-solo/02-06-SUMMARY.md | FOUND |
| Commit 1c12443 | FOUND |
| Commit c3aecf0 | FOUND |
