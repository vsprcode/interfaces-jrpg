---
phase: 3
slug: party-expansion-encounters-2-3
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-26
updated: 2026-04-26
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
| 3-01-T1 | 03-01 | 0 | WR-01/02/03/04 (bug fixes) | unit | `npx vitest run src/engine/reducer.test.ts src/engine/enemyAI.test.ts` | ⬜ pending |
| 3-01-T2 | 03-01 | 0 | ASSETS-01, ASSETS-02 (data) | unit | `npx tsc --noEmit && npx vitest run` | ⬜ pending |
| 3-02-T1 | 03-02 | 1 | SKILL-02 (Forge Wall) + SKILL-05 (decrement) | unit | `npx vitest run src/engine/reducer.test.ts` | ⬜ pending |
| 3-02-T2 | 03-02 | 1 | SKILL-03 (System Override) | unit | `npx vitest run src/engine/reducer.test.ts` | ⬜ pending |
| 3-03-T1 | 03-03 | 1 | AI-03 (TARGET_LOWEST_HP) | unit | `npx vitest run src/engine/enemyAI.test.ts` | ⬜ pending |
| 3-03-T2 | 03-03 | 1 | AI-04 (ATTACK_RANDOM) | unit | `npx vitest run src/engine/enemyAI.test.ts && npx tsc --noEmit` | ⬜ pending |
| 3-04-T1 | 03-04 | 2 | ENC-02, ENC-03, ENC-05, ASSETS-03 | type check | `npx tsc --noEmit && npx vitest run` | ⬜ pending |
| 3-04-T2 | 03-04 | 2 | ENC-06 (EncounterCompleteScreen) | type check | `npx tsc --noEmit && npx vitest run` | ⬜ pending |
| 3-05-T1 | 03-05 | 3 | ASSETS-06 (status badges) | type check | `npx tsc --noEmit` | ⬜ pending |
| 3-05-T2 | 03-05 | 3 | UI-08 (TurnOrderIndicator) | component | `npx vitest run src/components/TurnOrderIndicator.test.tsx && npx tsc --noEmit` | ⬜ pending |
| 3-06-T1 | 03-06 | 3 | SKILL-03 UI (target picker) | type check | `npx tsc --noEmit && npx vitest run` | ⬜ pending |
| 3-06-T2 | 03-06 | 3 | UI-06 (DialogueBox) | component | `npx vitest run src/components/DialogueBox.test.tsx && npx tsc --noEmit` | ⬜ pending |
| 3-07-T1 | 03-07 | 4 | VISUAL-04, VISUAL-05 | type check + full suite | `npx tsc --noEmit && npx vitest run` | ⬜ pending |
| 3-07-T2 | 03-07 | 4 | E2+E3 end-to-end | human verify | Manual 19-step checklist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (MUST complete before Wave 1)

- [ ] `src/engine/reducer.test.ts` — regression tests for WR-01/WR-02/WR-04 bug fixes
- [ ] `src/engine/enemyAI.test.ts` — WR-03 no-throw verification
- [ ] `src/engine/types.ts` — EnemyId extended with 6 instance IDs; PlayerAction.skillVariant added
- [ ] `src/data/characters.ts` — TORC and TRINETRA exported
- [ ] `src/data/enemies.ts` — 6 enemy instances with unique IDs
- [ ] `src/data/encounters.ts` — ENCOUNTER_CONFIGS with 3 entries

---

## Test Files Created or Extended in Phase 3

| File | Plan | Action |
|------|------|--------|
| `src/engine/reducer.test.ts` | 03-01 (T1), 03-02 (T1/T2) | Extend — add WR regressions + SKILL tests |
| `src/engine/enemyAI.test.ts` | 03-01 (T1), 03-03 (T1/T2) | Extend — add WR-03 + AI behavior tests |
| `src/components/TurnOrderIndicator.test.tsx` | 03-05 (T2) | Create — 2 component tests |
| `src/components/DialogueBox.test.tsx` | 03-06 (T2) | Create — 4 component tests |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DialogueBox cinematic between encounters | UI-06 | CSS animation timing and lore text visual quality | E1 victory → verify TORC DialogueBox → Encounter 2 starts |
| Camera shake on heavy hits | VISUAL-04 | CSS animation trigger timing; layout thrash check | Take heavy hit (ATK >= 20% maxHp) → observe shake |
| TurnOrderIndicator SPD ordering | UI-08 | Visual output (engine logic tested by reducer tests) | Verify indicator in browser shows correct order |
| SKILL_SHIELD/SKILL_HEAL effects | VISUAL-05 | CSS keyframe visual quality | Cast Forge Wall → cyan pulse visible; System Override → ripple visible |
| HP persist / EN reset visual | ENC-05 | Engine logic tested; visual bar transition unverifiable headlessly | E1 → E2: DEADZONE HP bar carries E1 value; EN bars reset to max |

---

## Nyquist Continuity Check

Requirement: No 3 consecutive tasks without an automated verify.

| Task Sequence | Has Automated Verify |
|---------------|----------------------|
| 3-01-T1 | `npx vitest run ...` ✓ |
| 3-01-T2 | `npx tsc --noEmit && npx vitest run` ✓ |
| 3-02-T1 | `npx vitest run ...` ✓ |
| 3-02-T2 | `npx vitest run ... && npx tsc --noEmit` ✓ |
| 3-03-T1 | `npx vitest run ...` ✓ |
| 3-03-T2 | `npx vitest run ... && npx tsc --noEmit` ✓ |
| 3-04-T1 | `npx tsc --noEmit && npx vitest run` ✓ |
| 3-04-T2 | `npx tsc --noEmit && npx vitest run` ✓ |
| 3-05-T1 | `npx tsc --noEmit` ✓ |
| 3-05-T2 | `npx vitest run ... && npx tsc --noEmit` ✓ |
| 3-06-T1 | `npx tsc --noEmit && npx vitest run` ✓ |
| 3-06-T2 | `npx vitest run ... && npx tsc --noEmit` ✓ |
| 3-07-T1 | `npx tsc --noEmit && npx vitest run` ✓ |
| 3-07-T2 | Human checkpoint ✓ (acceptable after wave of automated tasks) |

**Nyquist compliant: YES** — every task has an automated verify command (except human checkpoint which follows 6 automated tasks in Wave 4).

---

## Phase Gate (before marking Phase 3 complete)

- [ ] All 14 task verifies green
- [ ] Human 19-step UAT approved (Task 3-07-T2)
- [ ] `npx vitest run` exits 0 (all tests green, count > 91)
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run build` exits 0
- [ ] No console errors in browser during full E1→E2→E3 playthrough

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready — plans 03-01 through 03-07 created 2026-04-26
