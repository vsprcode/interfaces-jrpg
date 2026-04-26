# Technology Stack Research

**Project:** [In]terfaces JRPG Demo
**Researched:** 2026-04-25
**Overall confidence:** HIGH (all critical decisions verified against official docs or multiple current sources)

---

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

**Decision rationale — Zustand over XState and over plain useState:**

- **Not XState:** XState v5 is well-suited for multi-actor workflows with async coordination (think Figma-level complexity). This battle engine is a deterministic turn loop: a finite set of phases (SELECT_ACTION, RESOLVE_ACTION, ENEMY_TURN, VICTORY, GAME_OVER) with synchronous transitions. XState would add ~40kb, a visual toolchain dependency, and a conceptual overhead that this scope does not justify. Its value proposition (proving which transitions are allowed) is achievable here with a typed union discriminating `BattlePhase`.
- **Not plain useState:** The battle store is cross-component (ActionMenu, BattleLog, CharacterHUD, EnemyPanel all read from it). Prop-drilling or Context would trigger broad re-renders on every action. Zustand's slice subscriptions mean only the component watching `characters[0].hp` re-renders when that value changes.
- **Zustand wins for this scope:** Single shared store, typed slices, no boilerplate, zero providers. The battle reducer pattern (action dispatches → store mutates → components react) maps naturally to Zustand's `set` API.

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Layout, spacing, utility classes | v4's `@theme` CSS block accepts the Blue Wave palette directly as CSS custom properties — no tailwind.config.js needed |
| CSS Modules | (built-in Next.js) | Component-scoped animation keyframes, complex pixel art states | Keyframe animation blocks do not belong in Tailwind utility classes; CSS Modules keep them co-located with the component |

**Decision rationale — Tailwind v4 + CSS Modules over alternatives:**

- **Not styled-components:** Runtime CSS-in-JS conflicts with App Router's server component model and adds unnecessary JS bundle weight. The game is client-only in practice, but there is no reason to pay the cost.
- **Not Tailwind alone:** Tailwind utilities cannot express `@keyframes` blocks inline. Battle animations (screen flash, camera shake, hit spark) are keyframe sequences, not one-off utility values.
- **Not CSS Modules alone:** Tailwind handles layout, spacing, and color utilities at high velocity. Dropping it to write all spacing/flex/grid by hand wastes time with no benefit.
- **The split:** Tailwind v4 for structure and theme tokens. CSS Modules for animation keyframes and any multi-state pseudo-class combinations that are verbose in utility syntax.

**Tailwind v4 `@theme` block for Blue Wave palette:**

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-electric:    #00BFFF;
  --color-cobalt:      #0047AB;
  --color-cyan-neon:   #00FFFF;
  --color-shadow-cold: #0A0A1A;
  --color-bg-dark:     #050510;
  --color-text-glow:   #7DF9FF;
}
```

This generates `bg-electric`, `text-cobalt`, `border-cyan-neon`, etc. as utility classes automatically. The same CSS variables are also available as `var(--color-electric)` in any CSS Module.

**Tailwind v4 + Next.js 14 compatibility note:** Tailwind v4 uses `@tailwindcss/postcss` (not the old `tailwindcss` PostCSS plugin). There is a known `lightningcss` build issue with specific Node/Next version combinations. If you hit it, pin `tailwindcss@4.0.x` and verify Node is >= 20.18. Alternatively, Tailwind v3 (which uses `tailwind.config.js`) is fully stable on Next.js 14 and should be used as the fallback if v4 setup friction is high. The palette and class names work identically — only the configuration mechanism differs.

### Typography

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Press Start 2P (via `next/font/google`) | — | All game UI text | Self-hosted by Next.js, zero external requests, zero layout shift (CLS = 0) |

**Integration pattern (App Router):**

```typescript
// app/layout.tsx
import { Press_Start_2P } from 'next/font/google'

const pressStart = Press_Start_2P({
  weight: '400',        // only weight available for this font
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={pressStart.variable}>
      <body>{children}</body>
    </html>
  )
}
```

Then in Tailwind v4's `@theme` block add `--font-pixel: var(--font-pixel)` and use `font-pixel` utility, or reference `var(--font-pixel)` directly in CSS Modules. Press Start 2P is a bitmap font — it renders correctly at multiples of 8px (8px, 16px, 24px, 32px). Use only these sizes.

**Do not use `@fontsource/press-start-2p` (npm package):** It bypasses Next.js font optimization, adds an extra npm dependency, and provides no advantage over the built-in `next/font` path.

### Animations

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CSS keyframes (via CSS Modules) | — | Screen flash, camera shake, HP bar drain, hit spark, OVERDRIVE warning pulse | Zero bundle cost, GPU-composited transforms, no JS runtime |
| Framer Motion | — | NOT RECOMMENDED for this project | See rationale below |

**Decision rationale — CSS keyframes only:**

Framer Motion adds ~30-50kb to the JS bundle. Its value is in gesture handling, layout animations, and physics-based spring transitions — none of which this game needs. Every battle animation in scope is state-driven and predictable:

- Screen flash: `@keyframes flash { 0%,100% { opacity:1 } 50% { opacity:0 } }`  
- Camera shake: `@keyframes shake { 0%,100% { transform:translate(0) } 25% { transform:translate(-4px,2px) } 75% { transform:translate(4px,-2px) } }`
- HP bar drain: CSS transition on `width` with `transition: width 600ms ease-out`
- OVERDRIVE pulse: `@keyframes pulse-red { 0%,100% { box-shadow:0 0 0 0 rgba(255,0,0,0.7) } 50% { box-shadow:0 0 0 8px rgba(255,0,0,0) } }`

These are all CSS-animatable on the compositor thread (opacity, transform). They require no JS involvement after the CSS class is toggled. Adding Framer Motion for these is carrying a cannon to a knife fight.

**Animation trigger pattern:** Conditionally apply CSS Module classes based on battle state. Example: `className={cn(styles.hpBar, isHit && styles.hpBarFlash)}`. React re-render applies the class; CSS plays the animation; `onAnimationEnd` clears the flag in the store.

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | 2.x | Unit tests for battle engine logic | Native ESM, 30-70% faster than Jest, TypeScript support without extra config, integrates with the Vite-based toolchain Next.js uses internally |
| @testing-library/react | 16.x | Component tests for ActionMenu, BattleLog interactions | Behavior-driven assertions match how the player interacts |

**What to test:**

1. **Battle engine pure functions** (no React): damage calculation, EN cost deduction, status application, turn order sort, AEGIS-7 OVERDRIVE trigger condition. These are plain TypeScript functions — test them directly with Vitest, no React needed.
2. **State transitions**: Given a store state + dispatched action, assert the resulting store state. Zustand stores can be tested outside React by calling `store.getState()` and `store.setState()` directly.
3. **Do not test**: Animation classes, pixel-level rendering, font loading. These have zero ROI for a game demo.

### Build and Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | — | Hosting, CDN, preview deployments | First-party Next.js host; zero configuration needed; static assets served from global edge; preview URLs per PR |

**Vercel + Next.js 14 deployment notes:**

- The game is entirely client-side after the initial HTML shell. Mark the battle page with `"use client"` at the top. This tells Next.js to ship it as a client bundle; no server functions run per request.
- Static export (`output: 'export'` in `next.config.ts`) is an option but is unnecessary — Vercel serves App Router pages from the edge with equivalent performance and preserves future flexibility for server features.
- Font files from `next/font` are bundled as static assets at build time and served from Vercel's CDN. No Google requests at runtime.
- Turbopack (`next dev --turbo`) dramatically speeds up local development iteration; enable it for local dev only. Production builds still use Webpack in Next.js 14.

---

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

---

## Installation

```bash
# Scaffold
npx create-next-app@14 interfaces-jrpg --typescript --app --tailwind --src-dir

# State management
npm install zustand@^5

# Testing
npm install -D vitest@^2 @vitest/ui @testing-library/react@^16 @testing-library/user-event jsdom

# Vitest config (add to vite.config.ts or vitest.config.ts)
# test: { environment: 'jsdom', globals: true }
```

**Note on Tailwind v4:** `create-next-app@14` with `--tailwind` installs Tailwind v3 by default. To upgrade to v4, follow the official migration guide after scaffolding. If you encounter the `lightningcss` build error, remain on Tailwind v3 — the Blue Wave palette works identically via `tailwind.config.js` extended colors.

---

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

---

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
