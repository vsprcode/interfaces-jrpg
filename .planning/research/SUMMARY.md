# Project Research Summary

**Project:** [In]terfaces JRPG — Arcologia Casting-7 Demo
**Domain:** Browser-based turn-based JRPG (4-encounter narrative demo)
**Researched:** 2026-04-25
**Confidence:** HIGH

## Executive Summary

The [In]terfaces JRPG demo is a tightly scoped, browser-first, turn-based combat experience whose architecture closely resembles a deterministic finite state machine wrapped by a thin React presentation layer. The genre conventions are well-understood (party HP/EN, command menu, turn queue, status effects, OVERDRIVE-style boss telegraphing), and every recommended technology decision serves the same goal: keep the game logic pure, the UI dumb, and the bundle small enough that a 30-second first impression on mobile remains intact.

The recommended approach is **Next.js 14 App Router + TypeScript strict + Tailwind v4 (with v3 fallback) + CSS Modules for keyframes + Vitest for the engine** — and a **single `useReducer` at the `BattleScene` level for state**, with all combat math living in pure functions in `/src/lib/battle/`. The originally researched recommendation of Zustand is downgraded for this project's scope: see "Stack Conflict Resolution" below. The OVERDRIVE mechanic — the demo's narrative set piece — is treated architecturally as a distinct two-phase state (`OVERDRIVE_WARNING` → `OVERDRIVE_RESOLVING`), not as a special-case action, because the announce-react-resolve pattern is what makes "defend or die" feel fair instead of cheap.

The five risks that *will* surface during Phase 1 if not pre-empted are: React 18 Strict Mode double-firing battle timers (already burned this codebase once via the `isTyping` bug), stale closures in any `setTimeout` that reads game state, shallow-spread mutations in nested party arrays, turn-sequence race conditions from rapid input, and Next.js SSR hydration mismatches when game state initializes with random values. Every one of these is preventable with patterns documented in PITFALLS.md, but only if Phase 1 establishes them as ground rules before any UI code is written.

## Key Findings

### Recommended Stack

The full rationale lives in `STACK.md`. Headlines: a Next.js 14 App Router shell with App Router pages marked `'use client'` (no server rendering needed for a single-player browser game), TypeScript 5 strict mode for the battle engine's type contracts, Tailwind v4 with the Blue Wave palette in an `@theme` block, CSS Modules for keyframe animations, Press Start 2P via `next/font/google` with `display: 'block'` (FOIT, not FOUT), and Vitest for engine unit tests.

**Core technologies:**
- **Next.js 14 (App Router) + TypeScript 5** — application shell, font optimization, RSC-capable but client-only in practice
- **React 18 `useReducer`** (NOT Zustand for v1) — see Stack Conflict Resolution below; battle state is owned by a single reducer at `BattleScene`
- **Tailwind v4 + CSS Modules** — utilities for layout, modules for `@keyframes`; v3 is acceptable fallback if `lightningcss` build issues surface
- **CSS keyframes only** (no Framer Motion) — every animation in scope (flash, shake, HP drain, OVERDRIVE pulse) is compositor-eligible CSS, ~30-50kb of bundle saved
- **Press Start 2P via `next/font/google`** — self-hosted, zero CLS, `display: 'block'` to prevent the pixel aesthetic collapsing during font load
- **Vitest 2** + **@testing-library/react 16** — pure-function engine tests are first-class; component tests for `ActionMenu`/`BattleLog` only
- **Vercel** — first-party Next.js hosting, edge delivery, preview URLs per PR

### Stack Conflict Resolution: Zustand vs `useReducer`

`STACK.md` recommends **Zustand 5** for the battle store, citing slice subscriptions and minimal boilerplate. `ARCHITECTURE.md` recommends a **single `useReducer` at `BattleScene` level**, citing reducers as a natural fit for a deterministic turn machine. Both are defensible; for *this* project, `useReducer` wins.

**Decision: use `useReducer` at the `BattleScene` level. Do not install Zustand.**

Rationale:
1. **Scope.** The battle is the only stateful surface that crosses component boundaries. There is no global state to share with non-battle pages — `BattleScene` is the root of all stateful UI. Zustand's value (no providers, decoupled subscriptions across distant trees) is unused at this scope.
2. **State machine fit.** The battle is a discriminated-union state machine (`PLAYER_INPUT | ENEMY_TURN | RESOLVING | OVERDRIVE_WARNING | OVERDRIVE_RESOLVING | VICTORY | DEFEAT`). `useReducer` with a typed action union is the canonical React pattern for finite state machines. Zustand's `set` API would force discipline back through convention; `useReducer` enforces it through the type system.
3. **Re-render cost.** With at most 6 combatants and 4-7 visible UI components (party panel × 1-3, enemy panel × 1-2, action menu, log, animation layer), broad re-render on dispatch is negligible. There is no measurable performance pressure that justifies Zustand's slice subscriptions.
4. **One fewer dependency.** A demo with fewer libraries is a demo with fewer surface area for build issues, version pins, and `npm audit` noise.
5. **Reset pattern.** Game Over retry uses the React `key` prop to force-remount `BattleScene` (Pitfall 10), which works cleanly with `useReducer` initial state and is awkward with a global Zustand store that outlives the component.

**When to revisit:** If a future version adds a world map, save/load, persistent inventory across sessions, or any state that crosses page boundaries, switch to Zustand at that point. For the v1 demo (single-page, single-session, 4 linear encounters), `useReducer` is the right tool.

### Expected Features

Full landscape in `FEATURES.md`. Demo MVP scope is unusually well-defined because the genre conventions are mature.

**Must have (table stakes — v1 cannot ship without these):**
- Command menu per actor per turn (ATACAR / HABILIDADE / DEFENDER / ITEM)
- HP and EN bars visible on all party members at all times
- Damage number popup on hit (without it, combat feels inert)
- Turn-by-turn legible sequencing (one action visible at a time, animation gates the next)
- Skill cost validation (HABILIDADE grayed out if EN < cost)
- Enemy death state (sprite hidden / grayed / "ELIMINATED" label)
- Battle log showing the last 2-3 actions in lore-flavored text
- DEFENDER stance with visible indicator on the character
- OVERDRIVE warning announcement (full-screen banner, red tint, log entry)
- Victory screen ("MISSÃO CUMPRIDA" + per-character status + one line of lore + CONTINUAR)
- Game Over screen (named cause + TENTAR NOVAMENTE that restarts the encounter, not the run)
- Status effect icons on affected units (at least: SHIELD from Forge Wall, OVERDRIVE on AEGIS-7)

**Should have (differentiators — these are what make the demo memorable):**
- Per-encounter narrative tag in victory screen (lore density per encounter)
- OVERDRIVE failure-specific Game Over message that teaches the mechanic
- Battle log lines written as in-fiction telemetry ("ENFORCER PATROL trava prioridade em [TORC]")
- Skill names that carry lore weight in their flavor text
- 1/2/3/4 keyboard shortcuts in addition to arrow-key navigation
- AEGIS-7 wounded-and-dangerous post-OVERDRIVE state (+5 ATK, normal attacks)

**Defer (v2+ or out of scope for the demo entirely):**
- Leveling / XP progression — replace with narrative reward
- Inventory beyond Nano-Med — single consumable, fixed quantity
- Save / load — single-session is fine
- Audio — better silent than broken
- Sprite-sheet character animations — CSS portraits with state classes are sufficient
- Difficulty settings, branching encounters, equipment, elemental type chart, full-screen skill cinematics, auto-battle

**Status effects — implement only three:**
- `DEF_BUFF` (TORC's Forge Wall) — +8 DEF group, 2 turns
- `DEFENDING` (DEFENDER action result) — boolean on PlayerCharacter, cleared next turn
- `OVERDRIVE_CHARGE` (AEGIS-7) — boolean on enemy, drives TERMINUS
- Optional 4th: `DISRUPTED` (poison-equivalent, only if dev time allows and only because Signal Null can apply it)

### Architecture Approach

`ARCHITECTURE.md` documents a **three-layer separation**: pure logic (`/src/lib/battle/`), reducer (in `BattleScene`), components (dumb display + dispatch). The mental model is `pure functions → reducer → components`, with `ResolvedAction` as the typed bridge between logic and UI.

**Major components:**
1. **GameController (`app/page.tsx`)** — owns `GameState` (current encounter, party persistence across encounters, game phase). Renders one of: IntroScreen, BattleScene, VictoryScreen, GameOverScreen. Never touches `BattleState` internals.
2. **BattleScene** — single `useReducer(battleReducer)` for all combat state. Owns the `RESOLVING` `useEffect` that gates animations. Renders BattleLog, EnemyField, PartyStatus, ActionMenu, OverdriveWarning, BattleAnimationLayer. Calls `onVictory(party)` / `onGameOver()` callbacks up to GameController.
3. **Pure logic layer** (`/src/lib/battle/`) — `types.ts`, `battleEngine.ts` (damage math), `turnQueue.ts` (SPD-sorted queue, snapshotted at round start), `enemyAI.ts` (function-map keyed by `EnemyBehaviorType`, no classes), `encounters.ts` (factories per encounter).
4. **Dumb child components** — PartyStatus, EnemyField, BattleLog, ActionMenu+TargetSelector, OverdriveWarning, BattleAnimationLayer. They read props, render UI, fire prop callbacks. Zero game logic.

**Build order (the architecturally critical sequence):**

1. **Types** (`types.ts`) — discriminated unions for `BattlePhase`, `Combatant`, `ResolvedAction`, `StatusEffect`. Nothing compiles without these.
2. **Pure functions** (`battleEngine.ts`, `turnQueue.ts`, `enemyAI.ts`) — fully Vitest-testable with no React.
3. **Reducer** (`battleReducer.ts`) — assembles pure-function outputs into next state. Manually traceable in tests.
4. **BattleScene shell** — `useReducer` + animation `useEffect` with placeholder children. Verify phase transitions before any UI.
5. **UI components bottom-up** — PartyStatus → EnemyField → BattleLog → ActionMenu → OverdriveWarning. Each is a pure prop-driven render.
6. **Full Encounter 1 loop** — DEADZONE solo vs Casting Probe MK-I. Validates the entire engine end-to-end.
7. **Add encounters 2-3** — TORC, TRINETRA, the two new enemy AIs (`TARGET_LOWEST_HP`, `ATTACK_RANDOM`).
8. **AEGIS-7 + OVERDRIVE** — `OVERDRIVE_WARNING` and `OVERDRIVE_RESOLVING` phases. Test both deflected and lethal outcomes.
9. **Game flow controller** — encounter transitions, HP-carry between encounters, EN-reset between encounters, intro/victory/game-over screens.
10. **Aesthetic layer** — CSS keyframes (flash, shake, HP drain, OVERDRIVE pulse), Press Start 2P, Blue Wave palette, OVERDRIVE banner.

### Critical Pitfalls

Top 5 from `PITFALLS.md` — every one of these **must** be addressed in Phase 1, before any UI work, or they will compound into rewrites.

1. **React 18 Strict Mode double-firing (Pitfall 1)** — Every `useEffect` mounts twice in dev. Battle timers fire twice, animations replay, turns advance twice. This codebase has already been burned by this exact class of bug (`feedback_strict_mode_istyping.md`). **Prevention:** every `useEffect` returns `clearTimeout` cleanup; one-shot initializations use `useRef` flags, not state booleans; turn logic lives in the reducer (fires once), never in effects (fires twice).

2. **Stale closures in `setTimeout` reading game state (Pitfall 2)** — Enemy AI scheduled with `setTimeout` reads HP from when the timer was created, not when it fires. Boss never triggers OVERDRIVE because the closure sees pre-damage HP. **Prevention:** use a `gameStateRef` pattern that mirrors current state, or push AI resolution into the reducer where state is always fresh at dispatch time. Established pattern from day one.

3. **Shallow spread mutations on nested party state (Pitfall 3)** — `[...state.party]` copies the array but not the character objects inside. Mutating `newParty[1].hp -= 20` mutates the original. UI silently fails to refresh; status effects survive transitions they shouldn't. **Prevention:** every reducer case that touches a character uses `.map(c => c.id === target ? { ...c, hp: c.hp - dmg } : c)`. Code review checklist enforces this.

4. **Turn sequence race conditions from input + state batching (Pitfall 4)** — Player mashes ATACAR; two dispatches land in the same React batching window; both see `phase === 'PLAYER_INPUT'`; double action fires. **Prevention:** the reducer's first guard on every player action is `if (state.phase.type !== 'PLAYER_INPUT') return state;` — out-of-phase dispatches are silently dropped. UI disables action buttons whenever `phase.type !== 'PLAYER_INPUT'`. The phase machine exists *before* any UI is built.

5. **Next.js SSR hydration mismatch from client-only game state (Pitfall 5)** — Game initializes with `Math.random()` for enemy HP jitter; server and client render different values; React throws hydration warnings or silently corrupts the DOM. **Prevention:** mark every battle component with `'use client'` from day one; seed all random values inside `useEffect` (or in a reducer `INIT` action dispatched from `useEffect`), never during render. There is no SSR benefit for this game; opt out explicitly.

Honorable mentions for Phase 2: **OVERDRIVE edge cases (Pitfall 8)** — write the four edge-case scenarios as Vitest tests *before* implementing the boss; **Game Over reset via React `key` prop (Pitfall 10)** — use the `<BattleEngine key={battleKey} />` pattern instead of trying to manually reset every flag; **Press Start 2P FOUT (Pitfall 6)** — `display: 'block'` on the font, not `'swap'`.

## Implications for Roadmap

The build order from `ARCHITECTURE.md` (steps 1-10) maps cleanly onto a **5-phase roadmap**. Each phase ends in a demoable state and addresses a specific subset of pitfalls.

### Phase 1: Foundation — Types, Pure Engine, and the State Machine Skeleton
**Rationale:** Every architectural decision and every critical pitfall lives here. Get this right and the rest of the project flows; cut corners here and Phase 4 becomes a rewrite.
**Delivers:** A typed battle engine that runs in Vitest with no UI — `calculatePhysicalDamage`, `calculateSignalNullDamage`, `buildTurnQueue`, `resolveEnemyAction`, `battleReducer`. A `BattleScene` shell with `useReducer`, the `RESOLVING` animation `useEffect`, and placeholder children that prove phase transitions work. Next.js 14 + Tailwind v4 + Press Start 2P scaffolding.
**Addresses:** All table stakes types and contracts; foundations for HP/EN tracking, turn queue, enemy AI, status effects, OVERDRIVE state machine.
**Avoids:** Pitfalls 1, 2, 3, 4, 5, 6, 13 — every Phase-1-tagged pitfall in PITFALLS.md.

### Phase 2: Encounter 1 — DEADZONE Solo vs Casting Probe MK-I
**Rationale:** First content pass validates the entire loop end-to-end with the simplest possible content. No party complexity, no boss mechanics, no AoE. Tutorial in disguise.
**Delivers:** Playable Encounter 1 with command menu, HP/EN display, damage numbers, victory screen, retry from defeat. ATACAR + HABILIDADE (Signal Null) + DEFENDER + ITEM (Nano-Med) all functional.
**Uses:** Tailwind v4 utilities for layout; CSS Modules for hit-flash and HP-drain animations; the reducer + `RESOLVING` gate from Phase 1.
**Implements:** PartyStatus, EnemyField, BattleLog, ActionMenu, TargetSelector, BattleAnimationLayer (basic flash + damage popup), VictoryScreen, GameOverScreen.

### Phase 3: Encounters 2 & 3 — Party Expansion and Enemy AI Differentiation
**Rationale:** Each new encounter introduces exactly one new variable. E2 adds TORC + group buff (Forge Wall) + `TARGET_LOWEST_HP` enemy AI. E3 adds TRINETRA + healing/cleanse (System Override) + `ATTACK_RANDOM` enemy AI. The escalation ladder is built into the demo's premise — preserve it.
**Delivers:** Full 3-character party. SHIELD status effect with turn countdown. Heal/cleanse skill with target selection. Two new enemy archetypes with visibly distinct behavior (announced in battle log). Encounter transitions with HP carry / EN reset.
**Uses:** Existing reducer + animation pipeline; one new animation per skill (SKILL_SHIELD, SKILL_HEAL); status effect icon slots on PartyStatus.
**Implements:** GameController encounter routing, `handleEncounterVictory` with party expansion, status effect tracking through round transitions.

### Phase 4: AEGIS-7 and the OVERDRIVE Mechanic
**Rationale:** The demo's set piece. Architecturally the most complex phase because OVERDRIVE is a two-state extension to the battle phase machine. Demands edge-case scenario design before implementation.
**Delivers:** AEGIS-7 boss with normal attack pattern pre-OVERDRIVE; `OVERDRIVE_WARNING` phase with full-screen banner, red tint, mandatory log entry; `OVERDRIVE_RESOLVING` phase with TERMINUS damage application; post-OVERDRIVE wounded state (+5 ATK, normal attacks). Game Over screen with OVERDRIVE-specific instructional message on first failure.
**Addresses:** OVERDRIVE mechanic (FEATURES.md), boss phase transitions, fairness-via-telegraphing principle.
**Avoids:** Pitfall 8 (OVERDRIVE edge cases — written as Vitest scenarios before implementation), Pitfall 9 (AI infinite loop — defensive target validation), Pitfall 10 (state reset via `key` prop).

### Phase 5: Polish, Narrative Layer, and Demo Completion
**Rationale:** Aesthetic and narrative work that turns a functional combat loop into the [In]terfaces experience. Deliberately last so it doesn't compete with engine work for attention.
**Delivers:** Camera shake on heavy hits and TERMINUS; lore-flavored battle log lines per action; per-encounter narrative continuation in victory screens; intro screen; "DEMO COMPLETED" screen after Encounter 4 victory; idle character portrait animations (if time); skill-specific particle burst variants. Final pass on Press Start 2P sizing (8/16/24/32px multiples), Blue Wave palette tuning, OVERDRIVE banner type and motion.
**Addresses:** All "Should have" differentiators; every "first impression" item that makes the demo memorable rather than generic.
**Avoids:** Pitfall 7 (animation conflicts via DOM-layer separation), Pitfall 11 (`will-change` only on actively animating elements), Pitfall 12 (variant-toggle pattern for re-triggered animations).

### Phase Ordering Rationale

- **Bottom-up engine first.** Pure functions and types compile and test without React. Build them first; the entire game logic can be validated before a single component renders. This is the architecture's central thesis (`ARCHITECTURE.md` Step 1) and the only way to keep the reducer readable.
- **One encounter at a time, in sequence.** The demo's escalation ladder (1: solo basics → 2: party + buffs → 3: healing → 4: boss mechanic) is also the dependency graph. Encounter 4 depends on DEFENDER (built in Phase 2) and party-wide reactive turns (built in Phase 3). Skipping ahead means rebuilding.
- **OVERDRIVE in its own phase.** It is the most architecturally novel feature (two distinct battle phases beyond the standard turn loop) and the one where edge cases will bite. Isolating it from polish work means the boss can be re-tested in isolation without aesthetic distractions.
- **Polish last, not threaded throughout.** Threading polish through engine phases inflates each phase's surface area and obscures whether bugs are engine bugs or animation bugs. A clean separation (Phases 1-4 functional, Phase 5 aesthetic) makes regression testing tractable.

### Research Flags

Phases likely needing deeper research during planning (`/gsd-research-phase`):
- **Phase 4 (AEGIS-7 + OVERDRIVE):** The OVERDRIVE edge cases (Pitfall 8) deserve a written scenario spec before code. Specific items: post-defend-then-die handling, party wipe before TERMINUS resolves, DEFENDER on a 0-EN character, same-turn HP-threshold-and-damage collapse. These need to be enumerated, not improvised.
- **Phase 5 (Polish):** The skill-specific particle effects (Signal Null = electric, Forge Wall = structural, System Override = restorative) need a CSS pattern decision — `box-shadow + radial-gradient`, animated SVG, or something else. Research the cleanest approach for the specific aesthetic targets before committing.

Phases with standard patterns (skip dedicated research):
- **Phase 1 (Foundation):** Patterns are well-documented in this synthesis and the four research files. No new research needed.
- **Phase 2 (Encounter 1):** Standard JRPG combat loop. Genre conventions cover everything.
- **Phase 3 (Encounters 2-3):** Identical pattern to Phase 2 with more entities. No novel research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions verified against official docs (Next.js, Tailwind v4, Vitest, Press Start 2P). One known caveat: Tailwind v4 `lightningcss` build issue has a documented v3 fallback. |
| Features | HIGH | Genre conventions documented across multiple authoritative sources (Sinister Design, Persona 5 UI analyses, JRPG demo retrospectives). Status effect scope is opinionated but well-justified. |
| Architecture | HIGH | Patterns verified against React official docs, Game Programming Patterns book, Redux turn-based engine articles. Conflict with STACK.md on state management resolved above with clear rationale. |
| Pitfalls | HIGH | All pitfalls verified against React docs, Next.js docs, MDN, and project memory (`feedback_strict_mode_istyping.md` confirms Pitfall 1 already happened in this codebase). |

**Overall confidence:** HIGH

### Gaps to Address

- **Tailwind v4 vs v3 decision deferred to Phase 1 setup.** Attempt v4 first; fall back to v3 if `lightningcss` build error surfaces. Same Blue Wave palette works in both via different config mechanisms.
- **Skill particle effect implementation pattern (Phase 5)** is unspecified — research before implementing.
- **OVERDRIVE edge cases (Phase 4)** need a written scenario spec — flagged for `/gsd-research-phase` during planning.
- **Status effect 4th option (`DISRUPTED`)** is conditional on dev time. Decide explicitly during Phase 3 planning whether to include.
- **Audio policy** is "no audio" but worth confirming with project owner during planning; trivial Web Audio API tone generators are an option if desired.

## Sources

### Primary (HIGH confidence)
- `STACK.md` — Next.js 14 + Tailwind v4 + Vitest stack with rationale per decision
- `FEATURES.md` — JRPG genre convention research with table-stakes vs anti-feature classification
- `ARCHITECTURE.md` — React state machine + pure-function-layer architecture for turn-based combat
- `PITFALLS.md` — 13 pitfalls (6 critical, 4 moderate, 3 minor) with prevention and detection
- Next.js Font Optimization (official, 2026-04-23): https://nextjs.org/docs/app/getting-started/fonts
- Tailwind CSS v4.0 release: https://tailwindcss.com/blog/tailwindcss-v4
- React official docs — useReducer + Extracting State Logic into a Reducer
- Game Programming Patterns — State chapter: https://gameprogrammingpatterns.com/state.html
- Project memory: `feedback_strict_mode_istyping.md` (confirms Pitfall 1 is real and recurring in this codebase)

### Secondary (MEDIUM confidence)
- Persona 5 UI/UX analyses (Ridwan Khan, Atlus Siliconera interview)
- Sinister Design — 12 Ways to Improve Turn-Based RPG Combat
- Architecting a turn-based game engine with Redux (Trashmoon)
- Stale closures in React hooks (Dmitri Pavlutin)
- Various JRPG demo retrospectives (The Gamer, Game Rant, NeoGAF)

### Tertiary (LOW confidence)
- None used — every architectural and pitfall claim has a primary or strong-secondary source.

---
*Research completed: 2026-04-25*
*Ready for roadmap: yes*
