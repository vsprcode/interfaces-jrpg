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
| 2-03-01 | 02-03 | 1 | SKILL-01 | unit | npm run test -- --run | ⬜ pending |
| 2-03-02 | 02-03 | 1 | SKILL-04 | unit | npm run test -- --run | ⬜ pending |
| 2-04-01 | 02-04 | 1 | AI-02 | unit | npm run test -- --run | ⬜ pending |
| 2-05-01 | 02-05 | 2 | UI-01/02 | component | npm run test -- --run | ⬜ pending |
| 2-05-02 | 02-05 | 2 | UI-03/04 | component | npm run test -- --run | ⬜ pending |
| 2-06-01 | 02-06 | 2 | UI-05/07 | component | npm run test -- --run | ⬜ pending |
| 2-06-02 | 02-06 | 2 | UI-09/10 | component | npm run test -- --run | ⬜ pending |
| 2-07-01 | 02-07 | 3 | VISUAL-01/02/03 | build | npm run build | ⬜ pending |
| 2-07-02 | 02-07 | 3 | VISUAL-07 | build | npm run build | ⬜ pending |
| 2-08-01 | 02-08 | 3 | ENC-01 | e2e | human verify | ⬜ pending |
| 2-08-02 | 02-08 | 3 | END-02/03/04 | e2e | human verify | ⬜ pending |
| 2-09-01 | 02-09 | 4 | ASSETS-01/02/03 | visual | human verify | ⬜ pending |
