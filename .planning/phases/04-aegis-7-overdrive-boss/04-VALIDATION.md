---
phase: 4
slug: aegis-7-overdrive-boss
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x + @testing-library/react 16 |
| **Config file** | `vitest.config.ts` (dual-env: node for engine, jsdom for components) |
| **Quick run command** | `npx vitest run src/engine/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/engine/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 4-01-T1 | 04-01 | 0 | ENC-04, ASSETS-02(AEGIS-7), ASSETS-03 | unit + tsc | `npx tsc --noEmit && npx vitest run src/engine/` | ⬜ pending |
| 4-01-T2 | 04-01 | 0 | OVERDRIVE-01 (trigger), AI OVERDRIVE_BOSS stub | unit | `npx vitest run src/engine/enemyAI.test.ts` | ⬜ pending |
| 4-02-T1 | 04-02 | 1 | OVERDRIVE-01/02 (BattlePhase extension, reducer) | unit | `npx vitest run src/engine/reducer.test.ts` | ⬜ pending |
| 4-02-T2 | 04-02 | 1 | OVERDRIVE-04/05/06 (TERMINUS, edge cases) | unit | `npx vitest run src/engine/reducer.test.ts src/engine/enemyAI.test.ts` | ⬜ pending |
| 4-03-T1 | 04-03 | 2 | OVERDRIVE-02/03 (overlay, defender glow) | type check | `npx tsc --noEmit && npx vitest run` | ⬜ pending |
| 4-03-T2 | 04-03 | 2 | END-01, END-05 (DemoCompletedScreen, reset) | component | `npx vitest run src/components/DemoCompletedScreen.test.tsx && npx tsc --noEmit` | ⬜ pending |
| 4-04-T1 | 04-04 | 3 | VISUAL-06 (OVERDRIVE CSS), ASSETS-05 | type check | `npx tsc --noEmit && npm run build` | ⬜ pending |
| 4-04-T2 | 04-04 | 3 | QA-06 full E4 end-to-end | human verify | Manual OVERDRIVE checklist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/data/enemies.ts` — AEGIS_7 instance exported
- [ ] `src/data/encounters.ts` — `ENCOUNTER_CONFIGS[3]` with AEGIS_7 + command_chamber
- [ ] `src/engine/types.ts` — BattlePhase extended with `OVERDRIVE_WARNING | OVERDRIVE_RESOLVING`
- [ ] `src/engine/enemyAI.ts` — OVERDRIVE_BOSS stub (no-throw, returns OVERDRIVE_WARNING action)
- [ ] `src/engine/reducer.ts` — OVERDRIVE phases in exhaustiveness check

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TERMINUS // CARREGANDO overlay CSS pulse | VISUAL-06, OVERDRIVE-02 | CSS animation timing and visual impact quality | AEGIS HP < 100 → verify magenta full-screen pulse banner appears |
| [DEFENDER] cyan glow during OVERDRIVE_WARNING | OVERDRIVE-03 | CSS keyframe visual quality | During OVERDRIVE_WARNING → verify DEFENDER button glows cyan |
| AEGIS-7 command_chamber background | ASSETS-03 | Visual quality check | Enter E4 → verify command chamber CSS gradient visible |
| DemoCompletedScreen ASCII art | END-01 | Visual formatting | Defeat AEGIS-7 → verify ASCII art renders correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
