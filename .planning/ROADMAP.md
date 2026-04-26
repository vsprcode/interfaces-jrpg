# Roadmap — [In]terfaces JRPG Demo

**Project:** [In]terfaces JRPG — Browser turn-based demo
**Granularity:** standard (5 phases)
**Last updated:** 2026-04-25

---

## Phases

- [ ] **Phase 1: Foundation & Pure Engine** — Scaffolding, types, pure battle engine, reducer skeleton, pitfall ground rules
- [ ] **Phase 2: Encounter 1 — DEADZONE Solo** — First playable loop end-to-end (UI + engine integration)
- [ ] **Phase 3: Party Expansion (Encounters 2 & 3)** — TORC + TRINETRA, status effects, differentiated enemy AI
- [ ] **Phase 4: AEGIS-7 + OVERDRIVE Boss** — Two-phase boss state machine, TERMINUS mechanic, edge cases
- [ ] **Phase 5: Polish, Narrative & Demo Completion** — Cinematic narrative, visual polish, deploy, README

---

## Phase Details

### Phase 1: Foundation & Pure Engine
**Goal**: A typed, tested battle engine runs in Vitest (no UI) and a `BattleScene` shell proves phase transitions work — with all five critical pitfalls neutralized as ground rules.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08, ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, ENGINE-05, ENGINE-06, AI-01, AI-05, QA-01, QA-02, QA-03, QA-04, QA-05, ASSETS-07
**Success Criteria** (what must be TRUE):
  1. `npm run dev` boots Next.js 14 on `localhost:3000` with TypeScript strict, Tailwind v4 (Blue Wave palette in `@theme`), and Press Start 2P loaded via `next/font/google`
  2. `npm run test` runs Vitest suite covering `calculateDamage`, `buildTurnQueue`, AI behavior map, and reducer phase guard — all green with zero mutation regressions
  3. A skeleton `BattleScene` renders, dispatches a synthetic action, and visibly transitions through phases (`INIT → PLAYER_INPUT → RESOLVING → ENEMY_TURN → PLAYER_INPUT`) with no Strict Mode double-fires
  4. The five pitfall guardrails are encoded as repeatable patterns in `src/engine/`: (a) every `useEffect` cleans timers, (b) `gameStateRef` mirrors state for deferred reads, (c) reducers use `.map()`+spread for combatant updates, (d) reducer drops out-of-phase dispatches, (e) every battle component is `'use client'` with no random in render
  5. `next build` produces a clean production build with no TypeScript or Strict Mode warnings
**Plans**: 8 plans
- [x] 01-01-PLAN.md — Project Scaffold (Next.js 14 + TS strict + folders + Strict Mode)
- [x] 01-02-PLAN.md — Style & Font Foundation (Tailwind v4/v3 fallback + Blue Wave + Press Start 2P)
- [x] 01-03-PLAN.md — Test Infrastructure (Vitest 2 config + npm scripts)
- [x] 01-04-PLAN.md — Engine Types & Pure Functions (types.ts + calculateDamage + buildTurnQueue with mutation regression)
- [x] 01-05-PLAN.md — Reducer & Phase Machine (battleReducer + phase guard + useGameStateRef hook)
- [x] 01-06-PLAN.md — Enemy AI Skeleton (Record map + defensive throw + minimal src/data/)
- [x] 01-07-PLAN.md — BattleScene Shell + Sprite Fallback ('use client' + Strict Mode safe useEffect + ASSETS-07)
- [x] 01-08-PLAN.md — Production Build & Coverage Validation (final verification + VALIDATION.md sign-off)
**UI hint**: yes

### Phase 2: Encounter 1 — DEADZONE Solo
**Goal**: A player can play Encounter 1 from start to finish — DEADZONE alone vs. a Casting Probe MK-I — using all four command-menu actions, with full UI, victory, and game-over flows.
**Depends on**: Phase 1
**Requirements**: ENGINE-07, ENGINE-08, ENGINE-09, ENGINE-10, SKILL-01, SKILL-04, AI-02, ENC-01, UI-01, UI-02, UI-03, UI-04, UI-05, UI-07, UI-09, UI-10, VISUAL-01, VISUAL-02, VISUAL-03, VISUAL-07, END-02, END-03, END-04, ASSETS-01 (DEADZONE only), ASSETS-02 (Probe MK-I only), ASSETS-03 (BG_corridor only)
**Success Criteria** (what must be TRUE):
  1. Player loads the page and sees the Encounter 1 battle screen (16:9, Blue Wave palette, pixel-rendered) with DEADZONE sprite, Casting Probe MK-I sprite, status table, and 4-button command menu
  2. Player can select `[ATACAR]`, `[HABILIDADE]` (Signal Null — disabled if EN < 8), `[DEFENDER]`, `[ITEM]` (Nano-Med) via mouse or keyboard and see floating damage numbers + animated HP/EN bars
  3. Player defeats the Probe and triggers the engine's victory transition (logs end of encounter, clears battle); player who lets DEADZONE die sees `GAME OVER` with a working `TENTAR NOVAMENTE` that resets via React `key` prop
  4. Battle log shows lore-flavored action text in chronological order; AI Probe always attacks (no skipped turns, no double-fires) under React Strict Mode
**Plans**: TBD
**UI hint**: yes

### Phase 3: Party Expansion (Encounters 2 & 3)
**Goal**: A player progresses through Encounters 2 and 3 with a growing party — TORC joins for E2, TRINETRA joins for E3 — experiencing two new enemy AIs, group buffs, single-target healing, and HP-persistence between encounters.
**Depends on**: Phase 2
**Requirements**: SKILL-02, SKILL-03, SKILL-05, AI-03, AI-04, ENC-02, ENC-03, ENC-05, ENC-06, UI-06, UI-08, VISUAL-04, VISUAL-05, ASSETS-01 (TORC + TRINETRA), ASSETS-02 (Networker Enforcer + Patrol Bot), ASSETS-03 (loading_dock + server_room), ASSETS-06 (icons)
**Success Criteria** (what must be TRUE):
  1. After Encounter 1 victory, a `DialogueBox` cinematic introduces TORC, then Encounter 2 begins with DEADZONE+TORC vs. 2 Networker Enforcers; HP carries from E1 but EN resets to max
  2. Player casts `[Forge Wall]` and sees a SHIELD status icon on both party members with a 2-turn countdown that decrements and expires correctly; Networker Enforcers visibly target the lowest-HP ally (announced in battle log)
  3. After Encounter 2 victory, TRINETRA joins for Encounter 3 vs. 3 Casting Patrol Bots; player can cast `[System Override]` to either heal 30 HP OR remove a status — target selection works; Patrol Bots pick random live targets
  4. `TurnOrderIndicator` displays the upcoming turn queue based on SPD; camera-shake animation fires on heavy hits without layout thrashing
**Plans**: TBD
**UI hint**: yes

### Phase 4: AEGIS-7 + OVERDRIVE Boss
**Goal**: A player faces AEGIS-7 in Encounter 4 and survives (or fails) the OVERDRIVE/TERMINUS mechanic — the two-phase boss state machine handles all enumerated edge cases without crashing or feeling cheap.
**Depends on**: Phase 3
**Requirements**: ENC-04, OVERDRIVE-01, OVERDRIVE-02, OVERDRIVE-03, OVERDRIVE-04, OVERDRIVE-05, OVERDRIVE-06, OVERDRIVE-07, OVERDRIVE-08, VISUAL-06, END-01, END-05, ASSETS-02 (AEGIS-7), ASSETS-03 (command_chamber), ASSETS-04 (HUD/menu/dialogue/title frames), ASSETS-05 (FX sprite sheets + OVERDRIVE overlay), QA-06
**Success Criteria** (what must be TRUE):
  1. Player enters Encounter 4 and fights AEGIS-7 with normal attacks until HP drops below 100, at which point the `OVERDRIVE_WARNING` phase triggers a non-dismissible "TERMINUS // CARREGANDO" banner with magenta full-screen pulse and a glowing cyan `[DEFENDER]` button
  2. Player who uses `[DEFENDER]` on every alive character survives the next-turn TERMINUS (999 dmg only hits non-defenders); `[DEFENDER]` works during OVERDRIVE even with EN = 0
  3. Vitest suite covers OVERDRIVE edge cases: party already wiped before warning → direct GAME_OVER; dead character not targeted by TERMINUS; AEGIS cannot announce + fire OVERDRIVE in the same turn (1-turn telegraph minimum)
  4. Defeating AEGIS-7 triggers `DEMO COMPLETED` screen with ASCII-art, a working `NOVA INFILTRAÇÃO` button, and a clean reset to title via React `key` prop
**Plans**: TBD
**UI hint**: yes

### Phase 5: Polish, Narrative & Demo Completion
**Goal**: A first-time player who has never read [In]terfaces lore is pulled into the world by cinematic cutscenes, lore-rich battle text, polished visual feedback, and a deployed public URL they can share.
**Depends on**: Phase 4
**Requirements**: NARR-01, NARR-02, NARR-03, NARR-04, NARR-05, NARR-06, ASSETS-04 (title logo final pass), ASSETS-05 (effect polish), ASSETS-06 (status icons final), QA-07, QA-08, DEPLOY-01, DEPLOY-02, DEPLOY-03, DEPLOY-04
**Success Criteria** (what must be TRUE):
  1. Player sees an opening cutscene (DEADZONE under acid rain), a TORC join cutscene before E2, a TRINETRA join cutscene before E3, an AEGIS-7 reveal cutscene before E4, and a closing "Próximo capítulo em breve" gancho after victory
  2. Every battle log line reads as in-fiction telemetry (e.g., "DEADZONE encontra brecha no firewall — 14 de dano") rather than mechanical strings; lore density is consistent across all 4 encounters
  3. Lighthouse Performance >= 80 and Accessibility >= 80 on the production build; no Strict Mode warnings; all `useEffect` timers verified clean
  4. Public Vercel URL is live, accessible, and reachable from a fresh browser — README.md documents local install + links the demo URL
**Plans**: TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Pure Engine | 0/8 | Planned | - |
| 2. Encounter 1 — DEADZONE Solo | 0/0 | Not started | - |
| 3. Party Expansion (E2 & E3) | 0/0 | Not started | - |
| 4. AEGIS-7 + OVERDRIVE Boss | 0/0 | Not started | - |
| 5. Polish, Narrative & Demo | 0/0 | Not started | - |

---

## Coverage Validation

**Total v1 requirements:** 76
**Mapped:** 76/76 ✓
**Orphans:** 0
**Duplicates:** 0

### Coverage by Category

| Category | Count | Phases |
|----------|-------|--------|
| FOUND | 8 | Phase 1 (all) |
| ENGINE | 10 | Phase 1 (01-06), Phase 2 (07-10) |
| SKILL | 5 | Phase 2 (01, 04), Phase 3 (02, 03, 05) |
| AI | 5 | Phase 1 (01, 05), Phase 2 (02), Phase 3 (03, 04) |
| ENC | 6 | Phase 2 (01), Phase 3 (02, 03, 05, 06), Phase 4 (04) |
| OVERDRIVE | 8 | Phase 4 (all) |
| UI | 10 | Phase 2 (01, 02, 03, 04, 05, 07, 09, 10), Phase 3 (06, 08) |
| VISUAL | 7 | Phase 2 (01, 02, 03, 07), Phase 3 (04, 05), Phase 4 (06) |
| NARR | 6 | Phase 5 (all) |
| END | 5 | Phase 2 (02, 03, 04), Phase 4 (01, 05) |
| ASSETS | 7 | Distributed: P1 (07), P2 (01a, 02a, 03a), P3 (01b, 02b, 03b, 06), P4 (02c, 03c, 04, 05), P5 (04 polish, 05 polish, 06 polish) |
| QA | 8 | Phase 1 (01-05), Phase 4 (06), Phase 5 (07, 08) |
| DEPLOY | 4 | Phase 5 (all) |

### Asset Strategy Note

Assets are **parallelized**, not sequenced as a separate phase. AI image generation is a long-tail external dependency (iterations, seed locking, post-processing in Aseprite). Treating it as a phase would block the critical path; distributing it ensures dev work proceeds while the asset pipeline runs in parallel.

- **Phase 1** ships ASSETS-07 (CSS-only fallback) so every later phase has a guaranteed visual safety net.
- **Phase 2** needs only DEADZONE + Probe MK-I + corridor BG to be playable.
- **Phase 3** adds TORC, TRINETRA, Networker, Patrol Bot, two BGs, ability icons.
- **Phase 4** prioritizes AEGIS-7 (most detailed sprite), command chamber, UI frames, OVERDRIVE overlay.
- **Phase 5** is the polish pass — title logo final, effect tuning, status icon refinement.

If any AI-generated asset blocks a phase, the CSS fallback from ASSETS-07 ships in its place — no phase is gated on external image generation succeeding.

---

*Last updated: 2026-04-25 — initial roadmap created from REQUIREMENTS + research synthesis.*
