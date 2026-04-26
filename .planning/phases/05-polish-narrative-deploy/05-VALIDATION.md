---
phase: 5
slug: polish-narrative-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.9 + @testing-library/react 16 |
| **Config file** | `vitest.config.ts` (dual-env: node for engine, jsdom for components) |
| **Quick run command** | `npx vitest run src/engine/` |
| **Full suite command** | `npx vitest run` |
| **Baseline** | 142 tests, 12 test files, all green (Phase 4 complete) |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (full suite — Phase 5 tasks are small enough that targeted runs offer no benefit)
- **After every plan wave:** Run `npx tsc --noEmit && npm run build`
- **Before `/gsd-verify-work`:** Full suite green + production build clean + Lighthouse >= 80 manually verified
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 5-01-T1 | 05-01 | 0 | NARR-01 | component + tsc | `npx tsc --noEmit && npx vitest run src/components/GameController.test.tsx` | ⬜ pending |
| 5-01-T2 | 05-01 | 0 | NARR-05 | unit | `npx tsc --noEmit && npx vitest run src/engine/reducer.test.ts` | ⬜ pending |
| 5-02-T1 | 05-02 | 1 | NARR-06 | component | `npx vitest run src/components/DemoCompletedScreen.test.tsx` | ⬜ pending |
| 5-02-T2 | 05-02 | 1 | QA-08 | tsc + full suite | `npx tsc --noEmit && npx vitest run` | ⬜ pending |
| 5-03-T1 | 05-03 | 2 | ASSETS-04, QA-07 | tsc + build | `npx tsc --noEmit && npm run build` | ⬜ pending |
| 5-03-T2 | 05-03 | 2 | DEPLOY-04 | file check | `test -f README.md && grep -q "npm install" README.md` | ⬜ pending |
| 5-03-T3 | 05-03 | 2 | QA-07 | file check | `test -f .planning/phases/05-polish-narrative-deploy/05-HUMAN-UAT.md` | ⬜ pending |
| 5-04-T1 | 05-04 | 3 | DEPLOY-01 | shell | `git remote get-url origin` | ⬜ pending |
| 5-04-T2 | 05-04 | 3 | DEPLOY-01/02/03/04 | shell + manual | `curl -s -o /dev/null -w "%{http_code}" <VERCEL_URL>` returns 200 | ⬜ pending |
| 5-04-T3 | 05-04 | 3 | DEPLOY-01/02/QA-08 | human verify | Full 05-HUMAN-UAT.md checklist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements (05-01)

These must exist before Wave 1 can proceed:

- [ ] `src/components/GameController.tsx` — ControllerPhase union includes `'OPENING_DIALOGUE'` and `'CLOSING_DIALOGUE'`
- [ ] `src/components/GameController.tsx` — `useState` initialized to `'OPENING_DIALOGUE'` (not `'BATTLE'`)
- [ ] `src/components/GameController.tsx` — `handleOpeningComplete` and `handleClosingComplete` handlers defined
- [ ] `src/components/GameController.tsx` — `handleVictory` for encounterIndex===3 sets `'CLOSING_DIALOGUE'` (not `'DEMO_COMPLETED'`)
- [ ] `src/components/GameController.tsx` — `handleNewGame` sets `'OPENING_DIALOGUE'` (not `'BATTLE'`)
- [ ] `src/components/GameController.tsx` — JSX renders `<DialogueBox>` for both new phases
- [ ] `src/components/GameController.test.tsx` — 5 tests covering phase transitions (NEW FILE)
- [ ] `src/engine/reducer.ts` — `ENCOUNTER_INIT_MESSAGES` lookup map defined at module level
- [ ] `src/engine/reducer.ts` — INIT case uses lookup (not bare `'Encontro iniciado.'`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Opening cutscene visual presentation | NARR-01 | DialogueBox render quality; CSS backdrop; font rendering | `npm run dev` → page loads → confirm cutscene plays before battle |
| Closing dialogue emotional tone | NARR-06 | Narrative quality (lore voice, pacing) | Defeat AEGIS-7 → read all 4 closing lines → confirm tone matches [In]terfaces aesthetic |
| `[In]terfaces` title glow effect | ASSETS-04 | CSS textShadow visual quality | `npm run dev` → confirm title glows with electric blue bloom |
| Lighthouse Performance >= 80 | QA-08 | Requires production build + Lighthouse CLI/DevTools | `npm run build && npm run start` → Lighthouse audit on localhost:3000 |
| Lighthouse Accessibility >= 80 | QA-08 | Requires production build + Lighthouse CLI/DevTools | Same as above; check Accessibility score specifically |
| Vercel deploy end-to-end playthrough | DEPLOY-01/02 | Production environment differs from local | Open Vercel URL in fresh browser → play full demo → verify OVERDRIVE + closing cutscene |

---

## Decision Coverage Matrix

| Req ID | Plan | Task | Coverage | Notes |
|--------|------|------|----------|-------|
| NARR-01 | 05-01 | T1 | Full | OPENING_DIALOGUE ControllerPhase + 4-line cutscene + handleNewGame reset |
| NARR-02 | (done) | — | Full | Already implemented in GameController.tsx as E2_DIALOGUE |
| NARR-03 | (done) | — | Full | Already implemented in GameController.tsx as E3_DIALOGUE |
| NARR-04 | (done) | — | Full | Already implemented in GameController.tsx as E4_DIALOGUE |
| NARR-05 | 05-01 | T2 | Full | ENCOUNTER_INIT_MESSAGES lookup replaces bare 'Encontro iniciado.' |
| NARR-06 | 05-02 | T1 | Full | CLOSING_DIALOGUE ControllerPhase (05-01) + 'Próximo capítulo em breve' tagline in DemoCompletedScreen |
| ASSETS-04 | 05-03 | T1 | Full | CSS-only title header in page.tsx with Blue Wave palette + Press Start 2P |
| ASSETS-05 | — | — | Accepted | Screen flash accepted as Signal Null effect per RESEARCH.md recommendation; no new CSS needed |
| ASSETS-06 | — | — | Accepted | Text badges (SHIELD 2T, GUARD, TERMINUS) accepted for demo scope per RESEARCH.md |
| QA-07 | 05-03 | T1/T3 | Full | npm run build + 05-HUMAN-UAT.md console check |
| QA-08 | 05-02 | T2 | Full | aria-modal, contrast fix, aria-valuemin; Lighthouse measured manually |
| DEPLOY-01 | 05-04 | T1/T2 | Full | GitHub repo + Vercel deploy via git push |
| DEPLOY-02 | 05-04 | T2 | Full | Vercel URL accessible; curl returns 200 |
| DEPLOY-03 | 05-04 | T2 | Full | No vercel.json needed; Vercel default cache headers apply to /public assets |
| DEPLOY-04 | 05-03 | T2 | Full | README.md with install instructions; URL updated in 05-04-T2 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify commands
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 requirements list is complete
- [ ] Decision coverage matrix: all requirements are Full (no Partial)
- [ ] No watch-mode flags in any verify command
- [ ] Feedback latency < 10s for all automated commands
- [ ] `nyquist_compliant: true` set in frontmatter when all tasks pass
- [ ] 05-HUMAN-UAT.md completed by human tester before final sign-off

**Approval:** pending
