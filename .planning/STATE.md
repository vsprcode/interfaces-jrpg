# STATE — [In]terfaces JRPG Demo

**Last updated:** 2026-04-25
**Status:** Roadmap approved, ready for Phase 1 planning

---

## Project Reference

**Core value:** Entregar uma experiência JRPG completa e polida em browser (4 batalhas + boss AEGIS-7) que sirva como vitrine do universo [In]terfaces para leitores/players sem contato prévio com o worldbuilding.

**Current focus:** Phase 1 — Foundation & Pure Engine. Goal: a typed, Vitest-tested battle engine and a `BattleScene` skeleton with all five critical pitfall guardrails encoded as ground rules before any UI work begins.

**Stack (locked):** Next.js 14 (App Router) + TypeScript strict + Tailwind v4 (with v3 fallback) + `useReducer` (NOT Zustand) + CSS Modules for keyframes + Press Start 2P via `next/font/google` + Vitest 2 + Vercel.

---

## Current Position

| Field | Value |
|-------|-------|
| **Phase** | 1 — Foundation & Pure Engine |
| **Plan** | (none yet — awaiting `/gsd-plan-phase 1`) |
| **Status** | Roadmap created, planning pending |
| **Progress** | `[░░░░░░░░░░] 0% — 0/5 phases complete` |

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| v1 requirements mapped | 76/76 | 76/76 ✓ |
| Phases complete | 5/5 | 0/5 |
| Vitest suite green | 100% | n/a (not started) |
| Lighthouse Performance | >= 80 | n/a |
| Lighthouse Accessibility | >= 80 | n/a |
| Production build clean | yes | n/a |

---

## Accumulated Context

### Key Decisions

| Decision | Rationale | Phase |
|----------|-----------|-------|
| `useReducer` instead of Zustand | Battle state is the only cross-component state; reducer is canonical for finite state machines; one fewer dep; clean reset via React `key` prop | All |
| Asset generation parallelized (not a phase) | AI image gen is long-tail external dependency; sequencing it would block critical path; CSS fallback (ASSETS-07) provides safety net | All |
| Tailwind v4 first, v3 fallback | v4 is target; if `lightningcss` build issues surface, v3 fallback uses same Blue Wave palette | Phase 1 |
| Five pitfall guardrails encoded as Phase 1 ground rules | Strict Mode, gameStateRef, no shallow mutations, phase guard, `'use client'` — all neutralized before any UI code | Phase 1 |
| OVERDRIVE as a two-phase state extension | `OVERDRIVE_WARNING` → `OVERDRIVE_RESOLVING` is a distinct state machine extension, not a special-case action — fairness via telegraphing | Phase 4 |
| Polish last, not threaded | Separating engine (P1-4) from aesthetics (P5) keeps regression testing tractable | Phase 5 |

### Open Todos

- [ ] Run `/gsd-plan-phase 1` to decompose Phase 1 into executable plans
- [ ] Confirm audio policy with owner (current default: no audio)
- [ ] Decide on optional `DISRUPTED` status effect (4th status) during Phase 3 planning
- [ ] Begin AI asset generation in parallel (start with 3 character portraits — see UI-ASSETS.md §5 workflow)

### Active Blockers

None. Roadmap approved, ready to begin Phase 1 planning.

### Pitfall Watch (active throughout all phases)

1. **Strict Mode double-fire** — every `useEffect` with a timer must `clearTimeout` in cleanup
2. **Stale closures in `setTimeout`** — use `gameStateRef` mirror pattern, never read state from closure in deferred callbacks
3. **Shallow spread mutations** — every reducer case touching combatants uses `.map(c => c.id === target ? { ...c, hp: ... } : c)`
4. **Turn race conditions** — reducer's first guard on every player action: `if (state.phase !== 'PLAYER_INPUT') return state;`
5. **SSR hydration mismatch** — every battle component is `'use client'`; `Math.random()` only inside `useEffect` or reducer actions

---

## Session Continuity

**Where to resume:**
- Read `.planning/ROADMAP.md` for full phase breakdown
- Read `.planning/PROJECT.md` for character stats, mechanics, lore
- Read `.planning/research/SUMMARY.md` for stack rationale and pitfall details
- Read `.planning/UI-ASSETS.md` for visual direction and asset prompts
- Run `/gsd-plan-phase 1` to begin executable planning

**Last action:** Roadmap created with 5 phases, 76/76 requirement coverage, asset distribution strategy.

**Next action:** `/gsd-plan-phase 1` to decompose Phase 1 (Foundation & Pure Engine) into executable plans.

---

*Auto-updated by GSD workflow tools.*
