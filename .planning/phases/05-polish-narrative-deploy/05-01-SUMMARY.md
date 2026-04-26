---
phase: 05-polish-narrative-deploy
plan: "01"
subsystem: narrative
tags: [cutscene, dialogue, lore, game-controller, reducer, tdd]
dependency_graph:
  requires: []
  provides: [OPENING_DIALOGUE phase, CLOSING_DIALOGUE phase, ENCOUNTER_INIT_MESSAGES]
  affects: [GameController.tsx, reducer.ts]
tech_stack:
  added: []
  patterns: [TDD red-green, ControllerPhase union extension, module-level const lookup map]
key_files:
  created:
    - src/components/GameController.test.tsx
  modified:
    - src/components/GameController.tsx
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts
decisions:
  - "Use NETWORKER_ENFORCER_A and CASTING_PATROL_BOT_A (not bare base ids) as ENCOUNTER_INIT_MESSAGES keys — actual EnemyId union uses suffixed variants"
  - "handleClosingComplete is a distinct handler (sets DEMO_COMPLETED) — not reusing handleDialogueComplete which sets BATTLE"
  - "handleNewGame sets OPENING_DIALOGUE so NOVA INFILTRACAO always replays the intro cutscene"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-26T19:26:07Z"
  tasks_completed: 2
  files_modified: 4
requirements: [NARR-01, NARR-05]
---

# Phase 05 Plan 01: Opening/Closing Cutscenes and Encounter Init Messages Summary

**One-liner:** Opening 4-line SISTEMA/DEADZONE cutscene and closing 4-line outro wired as ControllerPhase states; encounter-specific lore lines replace generic "Encontro iniciado." via EnemyId-keyed lookup map.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add OPENING_DIALOGUE and CLOSING_DIALOGUE phases to GameController | 60d4d85 | GameController.tsx, GameController.test.tsx |
| 2 | Replace generic init message in reducer.ts with encounter-specific lore lines | f6813b3 | reducer.ts, reducer.test.ts |

## What Was Built

### Task 1 — GameController OPENING_DIALOGUE / CLOSING_DIALOGUE

Extended `ControllerPhase` union with two new states:

- `OPENING_DIALOGUE` — cinematic intro shown before E1 (and on NOVA INFILTRACAO replay)
- `CLOSING_DIALOGUE` — cinematic outro shown after AEGIS-7 defeat before DemoCompletedScreen

Added `OPENING_DIALOGUE_LINES` (4 lines: 2 SISTEMA + 2 DEADZONE) and `CLOSING_DIALOGUE_LINES` (4 lines: SISTEMA + TRINETRA + DEADZONE + SISTEMA) as module-level consts.

Key state machine changes:
- `useState` now initializes to `'OPENING_DIALOGUE'` (was `'BATTLE'`)
- `handleOpeningComplete` transitions to `'BATTLE'`
- `handleClosingComplete` transitions to `'DEMO_COMPLETED'` (distinct from `handleDialogueComplete`)
- `handleVictory` for `encounterIndex === 3` now sets `'CLOSING_DIALOGUE'` (was `'DEMO_COMPLETED'`)
- `handleNewGame` resets to `'OPENING_DIALOGUE'` (was `'BATTLE'`)

### Task 2 — ENCOUNTER_INIT_MESSAGES in reducer.ts

Added `ENCOUNTER_INIT_MESSAGES` module-level const (no export needed) before `battleReducer`:

```typescript
const ENCOUNTER_INIT_MESSAGES: Partial<Record<string, string>> = {
  'CASTING_PROBE_MK1':    'DEADZONE infiltra o Corredor 7-A. Sensores detectam presença inimiga.',
  'NETWORKER_ENFORCER_A': 'Docas de Carga. Dois Enforcers em patrulha. TORC assume posição de flanco.',
  'CASTING_PATROL_BOT_A': 'Sala de Servidores. Três Patrol Bots em rotação automática. TRINETRA calibra o Override.',
  'AEGIS_7':              'Câmara de Comando. AEGIS-7 online. Protocolo de eliminação pesado ativado.',
};
```

INIT case log line changed from:
```typescript
log: ['Encontro iniciado.'],
```
to:
```typescript
log: [ENCOUNTER_INIT_MESSAGES[enemies[0]?.id ?? ''] ?? 'Encontro iniciado.'],
```

## Test Results

- **Before:** 142 tests (all green)
- **After:** 152 tests (all green) — 10 new tests added
  - 5 GameController phase transition tests (Task 1)
  - 5 ENCOUNTER_INIT_MESSAGES tests (Task 2)
- TypeScript: 0 errors (`npx tsc --noEmit` clean)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated EnemyId keys in ENCOUNTER_INIT_MESSAGES**
- **Found during:** Task 2 GREEN phase — TypeScript compilation error
- **Issue:** Plan specified `NETWORKER_ENFORCER` and `CASTING_PATROL_BOT` as map keys, but the `EnemyId` union uses suffixed variants (`NETWORKER_ENFORCER_A`, `CASTING_PATROL_BOT_A`). The actual first enemy in E2 is `NETWORKER_ENFORCER_A` and in E3 is `CASTING_PATROL_BOT_A`.
- **Fix:** Updated keys to `NETWORKER_ENFORCER_A` and `CASTING_PATROL_BOT_A`; updated test fixtures accordingly to use valid `EnemyId` inline objects instead of generic `makeEnemy(string)` helper.
- **Files modified:** `src/engine/reducer.ts`, `src/engine/reducer.test.ts`
- **Commit:** f6813b3

## Known Stubs

None — all dialogue lines are wired with real lore content. No placeholder text.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Module-level const `ENCOUNTER_INIT_MESSAGES` is unreachable from user input (threat T-05-01-02 disposition: accept, as planned).

## Self-Check: PASSED

- `src/components/GameController.tsx` — FOUND (modified)
- `src/components/GameController.test.tsx` — FOUND (created)
- `src/engine/reducer.ts` — FOUND (modified)
- `src/engine/reducer.test.ts` — FOUND (modified)
- Commit 60d4d85 — FOUND
- Commit f6813b3 — FOUND
- Full test suite: 152/152 green
- TypeScript: 0 errors
