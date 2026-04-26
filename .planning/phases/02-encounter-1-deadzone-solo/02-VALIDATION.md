---
phase: 2
slug: encounter-1-deadzone-solo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2 (engine: node for engine tests, jsdom for component tests) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test:coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run`
- **After engine changes:** Also run `npx tsc --noEmit`
- **After component changes:** Also run `npm run build`

---

## Task Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 2-01-01 | 02-01 | 0 | FOUND-06 | unit | npm run test -- --run | ⬜ pending |
| 2-02-01 | 02-02 | 1 | ENGINE-07 | unit | npm run test -- --run | ⬜ pending |
| 2-02-02 | 02-02 | 1 | ENGINE-08 | unit | npm run test -- --run | ⬜ pending |
| 2-02-03 | 02-02 | 1 | ENGINE-09 | unit | npm run test -- --run | ⬜ pending |
| 2-02-04 | 02-02 | 1 | ENGINE-10 | unit | npm run test -- --run | ⬜ pending |
| 2-03-01 | 02-03 | 2 | SKILL-01 | unit | npm run test -- --run | ⬜ pending |
| 2-03-02 | 02-03 | 2 | SKILL-04 | unit | npm run test -- --run | ⬜ pending |
| 2-03-03 | 02-03 | 2 | AI-02 | unit | npm run test -- --run | ⬜ pending |
| 2-04-01 | 02-04 | 3 | UI-01/02 | component | npm run test -- --run | ⬜ pending |
| 2-04-02 | 02-04 | 3 | UI-10 | component | npm run test -- --run | ⬜ pending |
| 2-04-03 | 02-04 | 3 | VISUAL-02 | build | grep "image-rendering: pixelated" src/styles/sprite-fallback.module.css | ⬜ pending |
| 2-04-04 | 02-04 | 3 | ASSETS-03 | build | grep "battleBackground" src/styles/battle.module.css | ⬜ pending |
| 2-05-01 | 02-05 | 3 | UI-05/07 | component | npm run test -- --run | ⬜ pending |
| 2-05-02 | 02-05 | 3 | UI-09 | component | npm run test -- --run | ⬜ pending |
| 2-05-03 | 02-05 | 3 | ASSETS-02 | visual | human verify | ⬜ pending |
| 2-06-01 | 02-06 | 4 | UI-03/04 | component | grep "CharacterHUD\|EnemyPanel\|data-state" src/components/BattleScene.tsx | ⬜ pending |
| 2-06-02 | 02-06 | 4 | VISUAL-01/03 | build | npm run build | ⬜ pending |
| 2-06-03 | 02-06 | 4 | END-02/03/04 | component | npm run test -- --run src/components/GameOverScreen.test.tsx | ⬜ pending |
| 2-06-04 | 02-06 | 4 | ENC-01 | e2e | human verify | ⬜ pending |
| 2-06-05 | 02-06 | 4 | ASSETS-01 | visual | human verify | ⬜ pending |

---

## Requirement Coverage Map

| Req ID | Plan | Task | Notes |
|--------|------|------|-------|
| ENGINE-07 | 02-02 | Task 1 (TDD) | ATTACK reducer case |
| ENGINE-08 | 02-02 | Task 1 (TDD) | DEFEND reducer case |
| ENGINE-09 | 02-02 | Task 1 (TDD) | ITEM reducer case |
| ENGINE-10 | 02-02 | Task 1 (TDD) | items.nanoMed inventory |
| SKILL-01 | 02-03 | Task 1 (TDD) | Signal Null defPenetration 0.7 |
| SKILL-04 | 02-03 | Task 1 (TDD) | EN gate same-reference no-op |
| AI-02 | 02-03 | Task 1 (TDD) | ALWAYS_ATTACK real implementation |
| ENC-01 | 02-06 | Task 3 (human) | Full turn loop playthrough |
| UI-01 | 02-04 | Task 1 | ActionMenu 4-button layout |
| UI-02 | 02-04 | Task 1 | Keyboard shortcuts 1-4 |
| UI-03 | 02-06 | Task 1 | CharacterHUD + EnemyPanel composition in same viewport |
| UI-04 | 02-06 | Task 1 | DEADZONE data-state sprite animation |
| UI-05 | 02-05 | Task 1 | EnemyPanel sprite + defeat state |
| UI-07 | 02-05 | Task 1 | BattleLog auto-scroll |
| UI-09 | 02-05 | Task 2 | FloatingDamageNumber CSS animation |
| UI-10 | 02-04 | Task 2 | HP/EN bar CSS width transition |
| VISUAL-01 | 02-04 | Task 1+2 | CSS vars via Tailwind — no hardcoded hex |
| VISUAL-02 | 02-04 | Task 2 | image-rendering: pixelated in sprite-fallback.module.css |
| VISUAL-03 | 02-06 | Task 1 | flashA/flashB screen flash variant toggle |
| VISUAL-07 | 02-05 | Task 2 | FloatingDamageNumber: transform/opacity only |
| END-02 | 02-06 | Task 1 | GameOverScreen renders on GAME_OVER phase |
| END-03 | 02-06 | Task 2 | battleKey React key prop reset |
| END-04 | 02-06 | Task 2 | TENTAR NOVAMENTE triggers setBattleKey |
| ASSETS-01 | 02-06 | Task 1 | SpriteFallback combatantId=DEADZONE |
| ASSETS-02 | 02-05 | Task 1 | SpriteFallback combatantId=CASTING_PROBE_MK1 |
| ASSETS-03 | 02-04 | Task 2 | battleBackground CSS gradient in battle.module.css |
