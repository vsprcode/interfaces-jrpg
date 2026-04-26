---
phase: 03-party-expansion-encounters-2-3
plan: "05"
subsystem: battle-ui
tags: [status-effects, turn-order, character-hud, css-modules, component-test]
one_liner: "Status effect badges in CharacterHUD (DEF_BUFF/DEFENDING/OVERDRIVE_CHARGE with turnsRemaining countdown) + TurnOrderIndicator component showing upcoming round entries wired into BattleScene"

dependency_graph:
  requires:
    - "03-02: StatusEffect type + DEF_BUFF engine logic (Forge Wall reducer case)"
    - "03-04: BattleScene parameterized with state.turnQueue + state.currentTurnIndex"
  provides:
    - "CharacterHUD: statusEffects badge row below EN bar (ASSETS-06)"
    - "TurnOrderIndicator: upcoming turn queue display (UI-08)"
    - "BattleScene: TurnOrderIndicator wired above enemy zone"
  affects:
    - src/components/CharacterHUD.tsx
    - src/components/TurnOrderIndicator.tsx (new)
    - src/components/TurnOrderIndicator.test.tsx (new)
    - src/components/BattleScene.tsx
    - src/styles/battle.module.css

tech_stack:
  added: []
  patterns:
    - "STATUS_ICON_MAP: Record<StatusEffectType, string> constant maps engine type to display label"
    - "statusEffects.map with data-type attribute: CSS attribute selector drives badge color variants"
    - "TurnOrderIndicator: turnQueue.slice(currentTurnIndex + 1) for upcoming entries"
    - "React import required in component files for jsdom test environment (no implicit JSX transform)"

key_files:
  created:
    - path: src/components/TurnOrderIndicator.tsx
      purpose: "Displays upcoming turn queue entries (from currentTurnIndex+1 to end); returns null when queue exhausted"
    - path: src/components/TurnOrderIndicator.test.tsx
      purpose: "Component tests: renders upcoming entries; returns null when no remaining entries"
  modified:
    - path: src/components/CharacterHUD.tsx
      change: "Added STATUS_ICON_MAP + StatusEffectType import; added statusEffects row below EN bar"
    - path: src/styles/battle.module.css
      change: "Added .statusRow and .statusBadge CSS + data-type variants (DEF_BUFF cyan, DEFENDING teal, OVERDRIVE_CHARGE pink)"
    - path: src/components/BattleScene.tsx
      change: "Added TurnOrderIndicator import + render above EnemyPanel(s) in enemy zone"

decisions:
  - "STATUS_ICON_MAP uses text labels (SHIELD/TERMINUS/GUARD) instead of unicode symbols — pixel font renders ASCII reliably; no dependency on glyph availability"
  - "TurnOrderIndicator placed above enemy zone (not HUD footer) — spatially associates upcoming turns with enemy area; avoids crowding the 128px HUD strip"
  - "React explicit import added to TurnOrderIndicator.tsx and test — jsdom test environment does not have automatic JSX transform; matches project pattern from all other components"

metrics:
  duration: "~8 minutes"
  completed_date: "2026-04-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 3
---

# Phase 3 Plan 05: Status Badges + TurnOrderIndicator Summary

## What Was Built

Added two pure-UI components that make Phase 3 mechanics visible to the player. CharacterHUD now shows status effect badges below the EN bar — DEF_BUFF displays "SHIELD 2T" in cyan, DEFENDING shows "GUARD" in teal, OVERDRIVE_CHARGE shows "TERMINUS" in pink. Badges disappear automatically when `statusEffects` array is empty (reducer expires them). TurnOrderIndicator renders the remaining queue entries for the current round (from `currentTurnIndex + 1` onward), placed above the enemy panel in BattleScene.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Status effect badges in CharacterHUD + CSS | cf73b65 | CharacterHUD.tsx, battle.module.css |
| 2 | TurnOrderIndicator component + test + BattleScene wiring | 724b9ab | TurnOrderIndicator.tsx (new), TurnOrderIndicator.test.tsx (new), BattleScene.tsx |

## Implementation Details

### CharacterHUD Status Badges

`STATUS_ICON_MAP` maps each `StatusEffectType` to a display string:
- `DEF_BUFF` → `SHIELD`
- `OVERDRIVE_CHARGE` → `TERMINUS`
- `DEFENDING` → `GUARD`

Each badge renders as `{label} {turnsRemaining}T` (e.g., "SHIELD 2T") in a `<span>` com atributo `data-type`. CSS attribute selectors em `battle.module.css` controlam as variantes de cor. A linha só renderiza quando `character.statusEffects.length > 0`.

### TurnOrderIndicator

```typescript
const upcoming = turnQueue.slice(currentTurnIndex + 1);
if (upcoming.length === 0) return null;
```

Cada entrada resolve o nome do combatente via `party.find` ou `enemies.find`, com fallback para `combatantId`. Entradas de jogador renderizam em ciano (`var(--color-cyan-neon)`), inimigos em vermelho (`#ff4444`). Entradas são separadas por um chevron `›`.

### BattleScene Wiring

Enemy zone reestruturada para `flex-col` para acomodar TurnOrderIndicator acima dos painéis de inimigos:

```tsx
<TurnOrderIndicator
  turnQueue={state.turnQueue}
  currentTurnIndex={state.currentTurnIndex}
  party={state.party}
  enemies={state.enemies}
/>
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing React import in TurnOrderIndicator.tsx**
- **Found during:** Task 2, `npx vitest run`
- **Issue:** Component rendered JSX without `import React from 'react'` — jsdom test environment does not have automatic JSX transform; `React is not defined` at runtime
- **Fix:** Added `import React from 'react'` to TurnOrderIndicator.tsx (matches pattern in all other project components)
- **Files modified:** `src/components/TurnOrderIndicator.tsx`
- **Commit:** 724b9ab

## Test Results

| Suite | Before | After |
|-------|--------|-------|
| src/components/TurnOrderIndicator.test.tsx | n/a (new) | 2 passing |
| All other suites | 118 passing + 4 todo | 118 passing + 4 todo |
| **Total** | **118 + 4 todo** | **120 + 4 todo** |

## Known Stubs

None introduced in this plan. Status badges are fully wired to `character.statusEffects` (live engine state). TurnOrderIndicator is fully wired to `state.turnQueue` and `state.currentTurnIndex`.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are pure UI components reading from typed engine state.

- T-03-05-01 (Information Disclosure — TurnOrderIndicator): accepted — displaying upcoming turns is intended game information.
- T-03-05-02 (Tampering — status badge data-type): accepted — `StatusEffectType` is a TypeScript union enum; CSS attribute selector only matches the three known values.

## Self-Check: PASSED

- `src/components/CharacterHUD.tsx` — FOUND
- `src/components/TurnOrderIndicator.tsx` — FOUND
- `src/components/TurnOrderIndicator.test.tsx` — FOUND
- `src/components/BattleScene.tsx` — FOUND
- `src/styles/battle.module.css` — FOUND
- Commit cf73b65 (status badges) — FOUND
- Commit 724b9ab (TurnOrderIndicator) — FOUND
- `grep -n "statusBadge\|statusRow" src/components/CharacterHUD.tsx` — 2 matches (lines 83, 87)
- `grep -n "STATUS_ICON_MAP" src/components/CharacterHUD.tsx` — 2 matches (definition + usage)
- `grep -n "statusBadge" src/styles/battle.module.css` — 4 matches (.statusBadge + 3 data-type variants)
- `grep -n "TurnOrderIndicator" src/components/BattleScene.tsx` — 2 matches (import + render)
- `grep -n "upcoming.length === 0" src/components/TurnOrderIndicator.tsx` — 1 match (line 21)
- `npx vitest run` — 120 passed, 0 failed, 4 todo
- `npx tsc --noEmit` — 0 errors
