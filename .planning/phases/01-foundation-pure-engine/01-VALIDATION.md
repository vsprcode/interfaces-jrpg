---
phase: 1
slug: foundation-pure-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (pure TS, no DOM for Phase 1) |
| **Config file** | `vitest.config.ts` (Wave 0 installs) |
| **Quick run command** | `npm run test -- --run` |
| **Full suite command** | `npm run test -- --run --coverage` |
| **Estimated runtime** | ~5 seconds (cold), <2s incremental |

Build/typecheck verification:
| Property | Value |
|----------|-------|
| **Type check command** | `npx tsc --noEmit` |
| **Lint command** | `npx next lint` |
| **Production build** | `npm run build` |
| **Dev server smoke** | `npm run dev` boots on :3000 within 5s |

---

## Sampling Rate

- **After every task commit:** Run `npm run test -- --run` (pure TS tests, ~2s)
- **After every plan wave:** Run `npx tsc --noEmit && npm run test -- --run`
- **Before `/gsd-verify-work`:** `npm run build` succeeds + full Vitest suite green
- **Max feedback latency:** 5 seconds for unit; 30 seconds for full build

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | FOUND-07 | smoke | `test -d .git` | ✅ | ⬜ pending |
| 1-01-02 | 01 | 0 | FOUND-01,FOUND-05 | smoke | `test -f next.config.ts && test -f tsconfig.json && test -d src/app` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 0 | FOUND-01 | manual+smoke | `npm run dev` boots on :3000 | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | FOUND-03 | smoke | `grep -q "@theme" src/app/globals.css && grep -q "00BFFF" src/app/globals.css` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | FOUND-04 | smoke | `grep -q "Press_Start_2P" src/app/layout.tsx && grep -q "variable.*--font-pixel" src/app/layout.tsx` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 1 | FOUND-06 | smoke+unit | `test -f vitest.config.ts && npm run test -- --run` (empty suite passes) | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | ENGINE-01 | smoke | `test -f src/engine/types.ts && grep -q "Character\|Enemy\|BattleState\|Action\|StatusEffect" src/engine/types.ts` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 2 | ENGINE-02 | unit | `npm run test -- --run damage` (calculateDamage tests all green) | ❌ W0 | ⬜ pending |
| 1-03-03 | 03 | 2 | ENGINE-03 | unit | `npm run test -- --run turnQueue` (buildTurnQueue tests green) | ❌ W0 | ⬜ pending |
| 1-03-04 | 03 | 2 | QA-03 | unit | mutation regression test asserts input array unchanged after damage applied | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 3 | ENGINE-04,ENGINE-05 | unit | `npm run test -- --run reducer` (phase guard test passes) | ❌ W0 | ⬜ pending |
| 1-04-02 | 04 | 3 | ENGINE-06 | unit | `.map() + spread` reducer test asserts no mutation across actions | ❌ W0 | ⬜ pending |
| 1-04-03 | 04 | 3 | QA-05 | unit | dispatching action when phase != PLAYER_INPUT returns same state by reference | ❌ W0 | ⬜ pending |
| 1-05-01 | 05 | 4 | AI-01,AI-05 | unit | `npm run test -- --run enemyAI` (Record map + ref pattern tested) | ❌ W0 | ⬜ pending |
| 1-06-01 | 06 | 5 | FOUND-02,QA-01,QA-02,QA-04 | unit+smoke | BattleScene Strict Mode test: dispatches once not twice; cleanup verified | ❌ W0 | ⬜ pending |
| 1-06-02 | 06 | 5 | ASSETS-07 | smoke | `test -f src/components/SpriteFallback/SpriteFallback.tsx` and CSS module exists | ❌ W0 | ⬜ pending |
| 1-07-01 | 07 | 6 | FOUND-08 | smoke | `npm run build` exits 0 with zero warnings | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All test infrastructure must be installed in Phase 1 — no prior tests exist.

- [ ] `package.json` with Next.js 14, TypeScript 5, Tailwind v4, Vitest 2 dependencies
- [ ] `vitest.config.ts` configured for pure TS testing (no jsdom)
- [ ] `tsconfig.json` with strict: true
- [ ] `next.config.ts` with React Strict Mode enabled
- [ ] `src/engine/__tests__/` directory with stub test files for each pure module
- [ ] `.gitignore` covering Next.js artifacts (.next/, node_modules/, etc.)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dev server boots without errors | FOUND-01 | Requires running process; CI smoke test would suffice but Wave 0 won't have CI yet | Run `npm run dev`, confirm "Ready in Xms" within 5s, navigate to localhost:3000, confirm no console errors |
| Press Start 2P font visually applied | FOUND-04 | Requires browser inspection | Open localhost:3000, inspect computed font-family on body — should include "Press Start 2P" |
| Strict Mode double-mount does not cause double dispatch | FOUND-02, QA-01 | Requires React DevTools or console.log instrumentation | Add temporary console.log in reducer, navigate to BattleScene, confirm log appears exactly once per dispatch (not twice) |
| Production build size sanity | FOUND-08 | Subjective threshold; check first build to set baseline | Run `npm run build`, verify First Load JS < 200kB for the battle route |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (verified — every wave has at least one unit/smoke test)
- [ ] Wave 0 covers all MISSING references (test infra installed before tests run)
- [ ] No watch-mode flags (all `--run` for one-shot execution)
- [ ] Feedback latency < 5s for unit, < 30s for build
- [ ] `nyquist_compliant: true` set in frontmatter (set after Wave 0 completes)

**Approval:** pending
