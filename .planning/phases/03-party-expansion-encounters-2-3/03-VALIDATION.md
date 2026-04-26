---
phase: 3
slug: party-expansion-encounters-2-3
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 3 — Validation Strategy

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
| 3-01-01 | 03-01 | 0 | — (WR-01/02 bug fix) | unit | `npx vitest run src/engine/reducer.test.ts` | ⬜ pending |
| 3-02-01 | 03-02 | 1 | SKILL-02 (Forge Wall) | unit | `npx vitest run src/engine/reducer.test.ts` | ⬜ pending |
| 3-02-02 | 03-02 | 1 | SKILL-03 (System Override) | unit | `npx vitest run src/engine/reducer.test.ts` | ⬜ pending |
| 3-03-01 | 03-03 | 1 | AI-03 (TARGET_LOWEST_HP) | unit | `npx vitest run src/engine/enemyAI.test.ts` | ⬜ pending |
| 3-03-02 | 03-03 | 1 | AI-04 (ATTACK_RANDOM) | unit | `npx vitest run src/engine/enemyAI.test.ts` | ⬜ pending |
| 3-04-01 | 03-04 | 2 | ENC-02, ENC-03 (HP persist) | unit | `npx vitest run src/engine/` | ⬜ pending |
| 3-05-01 | 03-05 | 3 | UI-06 (status icons), VISUAL-04 | component | `npx vitest run src/components/` | ⬜ pending |
| 3-06-01 | 03-06 | 3 | SKILL-05 (target picker) | component | `npx vitest run src/components/` | ⬜ pending |
| 3-07-01 | 03-07 | 4 | ENC-05, ENC-06, UI-08 | integration | `npx vitest run` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/reducer.test.ts` — regression tests for WR-01/WR-02 fixes (defeated-enemy skip + NEXT_TURN phase derivation)
- [ ] `src/engine/enemyAI.test.ts` — stubs for TARGET_LOWEST_HP and ATTACK_RANDOM
- [ ] `src/engine/types.ts` — NETWORKER_ENFORCER_A/B and CASTING_PATROL_BOT_A/B/C IDs

*Wave 0 covers the phase-transition bug fix and ID extension before any new features.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DialogueBox cinematic between encounters | ENC-05 | CSS animation timing and lore text visual quality | Play through E1 victory → check DialogueBox shows TORC intro → Encounter 2 starts |
| Camera shake on heavy hits | VISUAL-05 | CSS animation trigger timing and layout thrash check | Take heavy hit (ATK > 20 damage) → observe shake animation |
| TurnOrderIndicator SPD ordering | UI-08 | Visual output only (queue correctly derived by engine tests) | Verify indicator shows correct combatant order in browser |
| HP-persist / EN-reset visual | ENC-02 | Engine logic tested; visual bar state transition unverifiable headlessly | Observe HP bars carry E1 values into E2; EN bars reset to max |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
