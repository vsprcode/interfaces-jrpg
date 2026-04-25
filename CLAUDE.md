<!-- GSD:project-start source:PROJECT.md -->
## Project

**[In]terfaces JRPG — Demo**

Uma demo jogável de JRPG por turno ambientada no universo [In]terfaces (2042, Era Pré-Transumana). O jogador controla agentes da resistência analógica infiltrando uma Arcologia da Casting Syndicate, navegando por 4 encontros progressivos até o confronto final com AEGIS-7, a unidade de enforcement pesado da corporação Casting.

O jogo é fiel ao tom do [In]terfaces: sem heroísmo tradicional — apenas sobrevivência e resistência estrutural num sistema projetado para controlar.

**Core Value:** Entregar uma experiência JRPG completa e polida em browser (4 batalhas + boss) que sirva como vitrine do universo [In]terfaces para leitores/players que nunca tiveram contato com o worldbuilding.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 14.x (App Router) | Application shell, routing, font optimization | Official Vercel support, RSC available if needed, App Router is the current standard |
| TypeScript | 5.x | Type safety across battle engine, entities, state | Battle logic has complex type contracts (CharacterState, BattlePhase, ActionResult) — strict mode prevents runtime bugs |
| React | 18.x (bundled with Next.js 14) | UI rendering | useSyncExternalStore integration, concurrent features align with Zustand v5 |
### State Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | Battle state store (characters, turn order, phase, log) | Minimal API, no providers, subscriptions prevent unnecessary re-renders, v5 uses React 18 useSyncExternalStore natively |
- **Not XState:** XState v5 is well-suited for multi-actor workflows with async coordination (think Figma-level complexity). This battle engine is a deterministic turn loop: a finite set of phases (SELECT_ACTION, RESOLVE_ACTION, ENEMY_TURN, VICTORY, GAME_OVER) with synchronous transitions. XState would add ~40kb, a visual toolchain dependency, and a conceptual overhead that this scope does not justify. Its value proposition (proving which transitions are allowed) is achievable here with a typed union discriminating `BattlePhase`.
- **Not plain useState:** The battle store is cross-component (ActionMenu, BattleLog, CharacterHUD, EnemyPanel all read from it). Prop-drilling or Context would trigger broad re-renders on every action. Zustand's slice subscriptions mean only the component watching `characters[0].hp` re-renders when that value changes.
- **Zustand wins for this scope:** Single shared store, typed slices, no boilerplate, zero providers. The battle reducer pattern (action dispatches → store mutates → components react) maps naturally to Zustand's `set` API.
### Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Layout, spacing, utility classes | v4's `@theme` CSS block accepts the Blue Wave palette directly as CSS custom properties — no tailwind.config.js needed |
| CSS Modules | (built-in Next.js) | Component-scoped animation keyframes, complex pixel art states | Keyframe animation blocks do not belong in Tailwind utility classes; CSS Modules keep them co-located with the component |
- **Not styled-components:** Runtime CSS-in-JS conflicts with App Router's server component model and adds unnecessary JS bundle weight. The game is client-only in practice, but there is no reason to pay the cost.
- **Not Tailwind alone:** Tailwind utilities cannot express `@keyframes` blocks inline. Battle animations (screen flash, camera shake, hit spark) are keyframe sequences, not one-off utility values.
- **Not CSS Modules alone:** Tailwind handles layout, spacing, and color utilities at high velocity. Dropping it to write all spacing/flex/grid by hand wastes time with no benefit.
- **The split:** Tailwind v4 for structure and theme tokens. CSS Modules for animation keyframes and any multi-state pseudo-class combinations that are verbose in utility syntax.
### Typography
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Press Start 2P (via `next/font/google`) | — | All game UI text | Self-hosted by Next.js, zero external requests, zero layout shift (CLS = 0) |
### Animations
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS keyframes (via CSS Modules) | — | Screen flash, camera shake, HP bar drain, hit spark, OVERDRIVE warning pulse | Zero bundle cost, GPU-composited transforms, no JS runtime |
| Framer Motion | — | NOT RECOMMENDED for this project | See rationale below |
- Screen flash: `@keyframes flash { 0%,100% { opacity:1 } 50% { opacity:0 } }`  
- Camera shake: `@keyframes shake { 0%,100% { transform:translate(0) } 25% { transform:translate(-4px,2px) } 75% { transform:translate(4px,-2px) } }`
- HP bar drain: CSS transition on `width` with `transition: width 600ms ease-out`
- OVERDRIVE pulse: `@keyframes pulse-red { 0%,100% { box-shadow:0 0 0 0 rgba(255,0,0,0.7) } 50% { box-shadow:0 0 0 8px rgba(255,0,0,0) } }`
### Testing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | 2.x | Unit tests for battle engine logic | Native ESM, 30-70% faster than Jest, TypeScript support without extra config, integrates with the Vite-based toolchain Next.js uses internally |
| @testing-library/react | 16.x | Component tests for ActionMenu, BattleLog interactions | Behavior-driven assertions match how the player interacts |
### Build and Deployment
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | — | Hosting, CDN, preview deployments | First-party Next.js host; zero configuration needed; static assets served from global edge; preview URLs per PR |
- The game is entirely client-side after the initial HTML shell. Mark the battle page with `"use client"` at the top. This tells Next.js to ship it as a client bundle; no server functions run per request.
- Static export (`output: 'export'` in `next.config.ts`) is an option but is unnecessary — Vercel serves App Router pages from the edge with equivalent performance and preserves future flexibility for server features.
- Font files from `next/font` are bundled as static assets at build time and served from Vercel's CDN. No Google requests at runtime.
- Turbopack (`next dev --turbo`) dramatically speeds up local development iteration; enable it for local dev only. Production builds still use Webpack in Next.js 14.
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| State management | Zustand 5 | XState v5 | XState overhead not justified for a synchronous turn loop; adds ~40kb and toolchain complexity |
| State management | Zustand 5 | React useState + Context | Context triggers broad re-renders; prop drilling across HUD/ActionMenu/Log is unmanageable |
| Animations | CSS keyframes | Framer Motion | ~30-50kb bundle for effects achievable with CSS; no gesture/physics needs in a turn-based game |
| Styling | Tailwind v4 + CSS Modules | styled-components | Runtime CSS-in-JS conflicts with App Router server components model |
| Styling | Tailwind v4 + CSS Modules | Tailwind v3 | v4 is current; CSS-native theme configuration maps perfectly to the Blue Wave palette as CSS vars. Fall back to v3 only if v4 build issues surface |
| Font loading | next/font/google | @fontsource/press-start-2p | next/font is the correct mechanism; fontsource is redundant and bypasses CLS optimization |
| Testing | Vitest | Jest | Vitest is 30-70% faster, native ESM, no transformation config needed |
| Routing | App Router | Pages Router | App Router is Next.js 14's default and the intended direction; Pages Router has no advantage for a single-page game shell |
## Installation
# Scaffold
# State management
# Testing
# Vitest config (add to vite.config.ts or vitest.config.ts)
# test: { environment: 'jsdom', globals: true }
## Confidence Assessment
| Decision | Confidence | Source |
|----------|------------|--------|
| App Router over Pages Router | HIGH | Official Next.js docs; App Router is the documented standard as of Next.js 14 |
| Zustand 5 for battle state | HIGH | Official Zustand GitHub; multiple 2025 sources; React 18 useSyncExternalStore integration confirmed |
| Tailwind v4 + CSS Modules | HIGH | Official Tailwind v4 blog; Next.js 14 + Tailwind v4 compatibility confirmed with known workaround |
| CSS keyframes over Framer Motion | HIGH | Official Motion.dev docs; performance tier list confirms CSS > JS for compositor-eligible animations |
| next/font for Press Start 2P | HIGH | Official Next.js font docs (updated 2026-04-23); self-hosting confirmed |
| Vitest over Jest | HIGH | Official Vitest docs; 2025 benchmark data from multiple sources |
| Vercel static edge delivery | HIGH | Official Vercel docs; Next.js 14 first-party support confirmed |
## Sources
- Next.js Font Optimization (official, updated 2026-04-23): https://nextjs.org/docs/app/getting-started/fonts
- Tailwind CSS v4.0 release post: https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind v4 compatibility docs: https://tailwindcss.com/docs/compatibility
- Zustand GitHub (v5 release notes): https://github.com/pmndrs/zustand
- XState GitHub: https://github.com/statelyai/xstate
- Motion animation performance tier list: https://motion.dev/magazine/web-animation-performance-tier-list
- React State Management in 2025 (Makers Den): https://makersden.io/blog/react-state-management-in-2025
- Next.js App Router vs Pages Router discussion: https://github.com/vercel/next.js/discussions/59373
- Vercel Next.js 14 deployment: https://vercel.com/changelog/next-js-14
- Vitest vs Jest 2025: https://medium.com/@ruverd/jest-vs-vitest-which-test-runner-should-you-use-in-2025-5c85e4f2bda9
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
