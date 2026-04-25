# Phase 1: Foundation & Pure Engine — Research

**Researched:** 2026-04-25
**Domain:** Next.js 14 scaffold + TypeScript-strict pure battle engine + Vitest + ground-rule pitfall guardrails
**Confidence:** HIGH (all decisions trace to STACK.md, ARCHITECTURE.md, PITFALLS.md, SUMMARY.md or official docs)

---

## Summary

Phase 1 builds a typed, Vitest-tested battle engine that runs entirely without UI plus a `BattleScene` skeleton that proves phase transitions work in development under React 18 Strict Mode. All five critical pitfalls from PITFALLS.md become repeatable code patterns inside `src/engine/` so subsequent phases can lift them verbatim.

The scope is deliberately narrow: enough engine to satisfy `ENGINE-01..06` and `AI-01,05`, but no skill execution (deferred to Phase 2/3), no actual combat actions beyond a synthetic dispatch, no character sprites. The visible deliverable is `npm run dev` showing a `BattleScene` that boots, dispatches a synthetic action, and visibly transitions through phases without double-firing.

**Primary recommendation:** Scaffold with `create-next-app@14 --typescript --app --tailwind --src-dir --eslint`, then attempt a Tailwind v4 upgrade behind a feature gate; if `lightningcss` fails, immediately fall back to v3 (Blue Wave palette is identical via `tailwind.config.ts` extended colors). Build the `src/engine/` pure-function layer top-down from `types.ts` → `damage.ts` → `turnQueue.ts` → `enemyAI.ts` → `reducer.ts`, with Vitest tests written alongside each module. Only then create the `BattleScene` shell.

---

<user_constraints>
## User Constraints (from STATE.md + SUMMARY.md reconciliation)

**Note:** No formal CONTEXT.md exists yet for this phase. These constraints are extracted from STATE.md "Key Decisions", SUMMARY.md "Stack Conflict Resolution", and the phase brief.

### Locked Decisions
- **State management: `useReducer` at `BattleScene` level** (NOT Zustand) — see SUMMARY.md "Stack Conflict Resolution". This explicitly overrides STACK.md and CLAUDE.md "Recommended Stack" which still say Zustand. Phase 1 must NOT install or use Zustand.
- **Next.js 14 App Router + TypeScript strict + Tailwind v4 (with v3 fallback) + CSS Modules + Press Start 2P via `next/font/google` + Vitest 2 + Vercel** — locked stack from STATE.md "Stack (locked)".
- **Battle page marked `"use client"`** — every battle component is client-only; no SSR for game state (FOUND-02, Pitfall 5).
- **Five pitfall guardrails encoded as Phase 1 ground rules** — Strict Mode, gameStateRef, no shallow mutations, phase guard, `'use client'` — neutralized as repeatable patterns in `src/engine/` before any UI work.
- **Press Start 2P uses `display: 'swap'` per FOUND-04** — note this conflicts with PITFALLS.md Pitfall 6 which recommends `display: 'block'`. **FOUND-04 wins** (it is the canonical requirement); document the FOUT risk for Phase 5 polish review.
- **Reset uses React `key` prop** (END-03) — design state shape in Phase 1 to support this; avoid stateful global stores that outlive component remount.
- **Folder structure: `src/app`, `src/components`, `src/engine`, `src/data`, `src/styles`** (FOUND-05) — note this differs from ARCHITECTURE.md which uses `src/lib/battle/`. **FOUND-05 wins**: use `src/engine/`.

### Claude's Discretion
- Exact `tsconfig.json` strictness flags beyond `"strict": true` (recommend full strict family — see §3).
- Vitest config shape (single `vitest.config.ts` vs splitting node/jsdom — recommend single config in node mode for Phase 1; jsdom comes in Phase 2).
- File names within `src/engine/` (recommend `types.ts`, `damage.ts`, `turnQueue.ts`, `enemyAI.ts`, `reducer.ts`, `gameStateRef.ts`).
- Whether to install `@testing-library/react` in Phase 1 (recommend defer to Phase 2 — Phase 1 has no component tests).
- The exact reference TypeScript shapes for `Character`, `Enemy`, etc. (must satisfy ENGINE-01; recommended shapes in §7).

### Deferred Ideas (OUT OF SCOPE for Phase 1)
- Skill execution (`SKILL-01..05`) — Phase 2/3
- Action handlers beyond a placeholder (`ENGINE-07..10`) — Phase 2
- UI components (`UI-*`) — Phase 2/3
- All visual polish, animations, sprites beyond the ASSETS-07 CSS fallback — Phase 2-5
- OVERDRIVE mechanic (`OVERDRIVE-*`) — Phase 4
- AI behaviors `ALWAYS_ATTACK`, `TARGET_LOWEST_HP`, `ATTACK_RANDOM`, `OVERDRIVE_BOSS` — Phase 2-4 (Phase 1 only sets up the `Record<EnemyBehaviorType, AIFn>` skeleton with stubs)
- Encounter loading, HP/EN persistence between encounters — Phase 3
- Game flow controller above BattleScene — Phase 2/3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUND-01 | Next.js 14 App Router on `localhost:3000` with TypeScript strict | §1 install, §3 tsconfig delta |
| FOUND-02 | Battle page marked `"use client"` | §15 Pitfall 5 guardrail |
| FOUND-03 | Tailwind v4 (v3 fallback) with Blue Wave palette in `@theme` | §1 install, §4 @theme block, §1.4 v3 fallback |
| FOUND-04 | Press Start 2P via `next/font/google`, `display: 'swap'`, `variable: '--font-pixel'` | §5 next/font snippet |
| FOUND-05 | Folder structure: `src/app`, `src/components`, `src/engine`, `src/data`, `src/styles` | §16 directory layout |
| FOUND-06 | Vitest 2 configured for engine tests (pure TS, no DOM) | §6 vitest config |
| FOUND-07 | Git initialized with Next.js `.gitignore` | §1.5 init steps |
| FOUND-08 | `next build` clean | §17 build verification |
| ENGINE-01 | Types: `Character`, `Enemy`, `BattleState`, `Action`, `StatusEffect` in `src/engine/types.ts` | §7 reference types |
| ENGINE-02 | `calculateDamage(attacker, target, modifiers)` returns `max(1, ATK - DEF)`, Vitest-tested | §8 damage signature + tests |
| ENGINE-03 | `buildTurnQueue(combatants)` SPD desc, snapshot at round start | §9 turn queue algorithm |
| ENGINE-04 | `useReducer` at BattleScene with phases `INIT \| PLAYER_INPUT \| RESOLVING \| ENEMY_TURN \| VICTORY \| GAME_OVER` | §10 reducer skeleton |
| ENGINE-05 | Phase guard in reducer (`if (state.phase !== 'PLAYER_INPUT') return state`) | §10 phase guard, §15 Pitfall 4 |
| ENGINE-06 | HP/EN updates via `.map()` + spread (no mutation), test-verified | §15 Pitfall 3 guardrail, §8.2 test |
| AI-01 | AI as `Record<EnemyBehaviorType, AIFn>` in `src/engine/enemyAI.ts` | §12 AI map |
| AI-05 | AI reads state via `gameStateRef` (not closure) | §11 gameStateRef pattern, §15 Pitfall 2 |
| QA-01 | All `useEffect` with timer have `clearTimeout` cleanup | §15 Pitfall 1 guardrail |
| QA-02 | `gameStateRef` mirror used for all deferred reads | §11 gameStateRef pattern |
| QA-03 | Reducer cases use `.map()` + spread (no index assignment), mutation-tested | §8.2 mutation regression test |
| QA-04 | `Math.random()` only in `useEffect` or reducer actions | §15 Pitfall 5 guardrail |
| QA-05 | Phase guard tested: dispatch outside PLAYER_INPUT is no-op | §10 reducer test snippet |
| ASSETS-07 | CSS-only fallback for sprites (silhouettes + glow) | §14 CSS sprite fallback |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **GSD workflow enforcement** — file edits go through GSD commands. Phase 1 work happens under `/gsd-execute-phase`.
- **CLAUDE.md "Technology Stack" section says Zustand 5** — this is **superseded** by SUMMARY.md "Stack Conflict Resolution" which locks `useReducer`. The Phase 1 plan must not install Zustand. Recommend updating CLAUDE.md "State Management" row to `useReducer` after Phase 1 completes (separate doc task, not part of Phase 1 plans).
- No conventions or architecture established yet — Phase 1 sets the patterns subsequent phases follow.
- No project skills present.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `^14.2.0` (latest 14.x stable) | App shell, App Router, font optimization | Locked — STACK.md HIGH confidence [CITED: nextjs.org/docs] |
| `react` | `^18.3.0` (bundled with Next 14) | UI rendering, useReducer, useRef | Bundled — locked by Next 14 [VERIFIED: package peerDeps] |
| `react-dom` | `^18.3.0` | DOM renderer | Bundled with React 18 [VERIFIED: npm] |
| `typescript` | `^5.4.0` (latest 5.x) | Strict-mode types for engine contracts | Locked — STACK.md HIGH confidence [CITED] |
| `tailwindcss` | `^4.0.0` (with `@tailwindcss/postcss`) primary; `^3.4.0` fallback | Utility classes + `@theme` palette | Locked — STACK.md HIGH confidence [CITED: tailwindcss.com/blog/tailwindcss-v4] |
| `vitest` | `^2.0.0` | Pure TS test runner for engine | Locked — STACK.md HIGH confidence [CITED] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@vitest/ui` | `^2.0.0` | Browser test UI dashboard | Optional but useful for `npm run test:ui` |
| `@types/react` | `^18.3.0` | React type defs | Required when TypeScript strict |
| `@types/react-dom` | `^18.3.0` | React DOM type defs | Required when TypeScript strict |
| `@types/node` | `^20.x` | Node type defs (for vitest config, scripts) | Required for `vitest.config.ts` |
| `eslint`, `eslint-config-next` | bundled by `create-next-app` | Lint rules | Locked by Next scaffold |

### NOT installing in Phase 1
| Library | Why Not |
|---------|---------|
| `zustand` | Locked decision: `useReducer` only [CITED: SUMMARY.md "Stack Conflict Resolution"] |
| `@testing-library/react`, `@testing-library/user-event`, `jsdom` | No component tests in Phase 1; defer to Phase 2 when first interactive UI lands |
| `framer-motion` | Locked decision: CSS keyframes only [CITED: STACK.md] |
| `immer` | Locked decision: hand-written immutable updates with `.map()` + spread (forces explicit pattern) |
| `@fontsource/press-start-2p` | `next/font/google` is the correct mechanism [CITED: STACK.md, PITFALLS.md] |

### Version verification
Before commit, planner should verify each version is current:
```bash
npm view next version
npm view tailwindcss version
npm view vitest version
npm view typescript version
```
Versions above are based on STACK.md (researched 2026-04-25, same day as this phase research) — confidence HIGH that they're current.

---

## 1. Installation Commands

### 1.1 Scaffold

```bash
# In the parent directory of the project root:
npx create-next-app@14 interfaces-jrpg \
  --typescript \
  --app \
  --tailwind \
  --src-dir \
  --eslint \
  --no-import-alias
```

Flags explained:
- `--typescript` — TS by default (FOUND-01)
- `--app` — App Router (locked)
- `--tailwind` — installs Tailwind v3 by default (we'll upgrade to v4 next)
- `--src-dir` — uses `src/` (FOUND-05 expects `src/app`)
- `--eslint` — lint scaffolding (don't disable; rules tighten over time)
- `--no-import-alias` — keep relative imports for the demo's small surface; revisit if engine grows

If you're scaffolding INSIDE an existing empty repo (more likely here, since project root already has `.planning/` and `CLAUDE.md`):

```bash
# From project root, scaffold into current directory:
npx create-next-app@14 . \
  --typescript --app --tailwind --src-dir --eslint --no-import-alias
# When prompted "directory not empty, continue?" → yes (won't overwrite .planning, CLAUDE.md, .git)
```

### 1.2 Tailwind v4 upgrade (attempt first; fall back to v3 on `lightningcss` failure)

```bash
# Remove the v3 packages installed by create-next-app:
npm uninstall tailwindcss postcss autoprefixer

# Install v4:
npm install -D tailwindcss@^4 @tailwindcss/postcss@^4

# Replace postcss.config.js with v4 plugin format:
# Content shown in §1.3 below

# Test build immediately:
npm run dev
# Visit localhost:3000 — if Tailwind classes render and no build errors, v4 succeeded.
# If "lightningcss" error appears in terminal: revert to v3 — see §1.4
```

### 1.3 PostCSS config for Tailwind v4

`postcss.config.mjs` (v4):
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

Note: v4 does NOT need `autoprefixer` — it's built in.

### 1.4 Tailwind v3 fallback (if v4 build fails)

```bash
# Reinstall v3:
npm install -D tailwindcss@^3 postcss@^8 autoprefixer@^10

# Restore original postcss.config (the one create-next-app generated):
# postcss.config.mjs:
# export default { plugins: { tailwindcss: {}, autoprefixer: {} } };

# Use tailwind.config.ts with extended colors (palette in §4 below):
```

### 1.5 Font + Vitest install

```bash
# next/font is built into Next 14 — no install needed for Press Start 2P.
# Install Vitest:
npm install -D vitest@^2 @vitest/ui @types/node
```

### 1.6 Git init (if not already a repo)

```bash
git init
# create-next-app already created .gitignore — verify it includes:
# /.next/, /node_modules/, /coverage/, .env*.local, *.log
git add -A
git commit -m "chore: initial Next.js 14 + TypeScript + Tailwind scaffold"
```

### 1.7 Verify scaffold

```bash
npm run dev      # → localhost:3000 shows Next.js welcome
npm run build    # → completes with zero errors (FOUND-08 dry run)
npm run lint     # → clean
```

---

## 2. `next.config.ts` Content

`create-next-app@14` generates `next.config.mjs`. Recommend renaming to `next.config.ts` for type safety (Next 14 supports both):

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,         // CRITICAL: do NOT disable. Pitfall 1 must be caught in dev.
  // No `output: 'export'` — Vercel App Router serves edge-rendered just fine.
  // No `experimental.turbo` setting — opt in via `next dev --turbo` flag (in package.json scripts).
  // No `images.remotePatterns` yet — add when AI-generated assets land in Phase 2.
};

export default nextConfig;
```

**Why `reactStrictMode: true`:** Pitfalls 1, 2, 3, 4 from PITFALLS.md only surface in dev under Strict Mode's double-mount. Disabling Strict Mode would hide the bug class this phase exists to neutralize. The five guardrails in §15 are validated specifically because Strict Mode catches them.

**Optional `package.json` script update for Turbopack dev speed:**
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

## 3. `tsconfig.json` Delta

`create-next-app` generates a baseline `tsconfig.json`. The Phase 1 delta enforces full strict mode:

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,                   // PHASE 1: tighter than default `true` — no .js files in /src
    "skipLibCheck": true,
    "strict": true,                     // ENABLES all strict-family flags below
    "noUncheckedIndexedAccess": true,   // PHASE 1: prevents `arr[0]` returning T instead of T | undefined
    "noImplicitOverride": true,         // Defensive
    "noFallthroughCasesInSwitch": true, // CRITICAL for reducer switch statements
    "exactOptionalPropertyTypes": true, // PHASE 1: { foo?: string } strictly differs from { foo: string | undefined }
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]                // optional but recommended for engine imports later
    }
  },
  "include": ["next-env.d.ts", "src/**/*.ts", "src/**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Strict family enabled by `"strict": true`** (per official TS docs):
- `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `noImplicitAny`, `noImplicitThis`, `useUnknownInCatchVariables`, `alwaysStrict`

**Additional flags above provide:**
- `noUncheckedIndexedAccess` — forces `turnQueue[0]` to be `TurnEntry | undefined`, surfacing the empty-queue bug class at compile time (relevant to Pitfall 9: Enemy AI infinite loop on empty target list).
- `noFallthroughCasesInSwitch` — reducer switch statements must `return` or `break` per case; catches a common reducer bug.
- `exactOptionalPropertyTypes` — distinguishes `pendingAction?: ResolvedAction` from `pendingAction: ResolvedAction | undefined` — important for the discriminated unions in the phase machine.

**Trade-off:** these flags add friction. They're worth it for the engine layer (`src/engine/`). If they cause excessive noise in `src/app/` or `src/components/` later, consider a per-file `// @ts-expect-error` discipline rather than relaxing project-wide.

---

## 4. Tailwind v4 `@theme` Block — Blue Wave Palette

`src/app/globals.css` (PRIMARY — v4 path):

```css
@import "tailwindcss";

@theme {
  /* Blue Wave palette — from PROJECT.md §"Paleta Blue Wave" */
  --color-electric:    #00BFFF;   /* primary action / focus */
  --color-cobalt:      #0047AB;   /* depth / borders */
  --color-cyan-neon:   #00FFFF;   /* highlights / OVERDRIVE accents (later) */
  --color-shadow-cold: #0A0A1A;   /* panel backgrounds */
  --color-bg-dark:     #050510;   /* page background */
  --color-text-glow:   #7DF9FF;   /* primary text color */

  /* Pixel font — bound to next/font CSS variable from layout.tsx */
  --font-pixel: var(--font-pixel);
}

/* Global resets specific to a pixel game */
:root {
  color-scheme: dark;
  background-color: var(--color-bg-dark);
  color: var(--color-text-glow);
  font-family: var(--font-pixel), monospace;
}

html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* Pixel-perfect rendering for any future <img> sprites (VISUAL-02 — phased work) */
img {
  image-rendering: pixelated;
}
```

**Generated utility classes** (automatic from `@theme`):
- `bg-electric`, `bg-cobalt`, `bg-cyan-neon`, `bg-shadow-cold`, `bg-bg-dark`
- `text-electric`, `text-cobalt`, `text-cyan-neon`, `text-text-glow`
- `border-electric`, `border-cobalt`, etc.
- `font-pixel` (utility for explicit reuse; the global `:root` already defaults the family)

**Tailwind v3 fallback `tailwind.config.ts`:**
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        electric:    '#00BFFF',
        cobalt:      '#0047AB',
        'cyan-neon': '#00FFFF',
        'shadow-cold': '#0A0A1A',
        'bg-dark':   '#050510',
        'text-glow': '#7DF9FF',
      },
      fontFamily: {
        pixel: ['var(--font-pixel)', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

In v3 fallback, `globals.css` becomes:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { /* same body as v4 version above */ }
```

Same class names (`bg-electric`, `font-pixel`, etc.) work in both v3 and v4. Migration is purely a config-mechanism swap.

---

## 5. `next/font/google` Setup — Press Start 2P

`src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Press_Start_2P } from 'next/font/google';
import './globals.css';

const pressStart = Press_Start_2P({
  weight: '400',                  // Press Start 2P only ships in 400
  subsets: ['latin'],
  display: 'swap',                // FOUND-04 requirement (note: PITFALLS.md prefers 'block'; FOUND-04 wins)
  variable: '--font-pixel',       // Exposes CSS var for use in @theme + :root
  preload: true,                  // Default for primary fonts; explicit for clarity
});

export const metadata: Metadata = {
  title: '[In]terfaces — Demo',
  description: 'Arcologia Casting-7. 4 encontros. Sobreviva.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={pressStart.variable}>
      <body>{children}</body>
    </html>
  );
}
```

**Key points:**
- `weight: '400'` — Press Start 2P is single-weight. TypeScript will narrow to literal `'400'` automatically.
- `variable: '--font-pixel'` — produces a CSS variable on `<html>` which `@theme` references via `--font-pixel: var(--font-pixel)`.
- `display: 'swap'` — REQUIRED by FOUND-04. PITFALLS.md Pitfall 6 prefers `'block'` to prevent FOUT, but FOUND-04 is the locked spec. Document this as a Phase 5 polish review item: "If FOUT is visible on slow connections, evaluate swap → block trade-off against accessibility (text invisible during font load)."
- Press Start 2P renders correctly only at 8px multiples (8, 16, 24, 32). UI components in later phases must respect this.

---

## 6. Vitest Configuration — Pure TS, No DOM

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',          // Phase 1: pure TS engine, no DOM (FOUND-06)
    globals: true,                // Allow `describe/it/expect` without imports
    include: ['src/engine/**/*.test.ts'],
    coverage: {
      provider: 'v8',             // built into Node 18+
      reporter: ['text', 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/**/*.test.ts', 'src/engine/types.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

**Why `environment: 'node'` for Phase 1:**
- No DOM dependency in the pure engine — `damage.ts`, `turnQueue.ts`, `enemyAI.ts`, `reducer.ts` are all pure TS
- Faster test runs (no jsdom setup)
- When Phase 2 adds component tests, add a second config file or extend with `environmentMatchGlobs: [['src/components/**', 'jsdom']]`

**Add to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Sanity test** (`src/engine/_smoke.test.ts` — delete after first real test):
```typescript
import { describe, it, expect } from 'vitest';

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

`npm run test` should pass. Delete `_smoke.test.ts` once `damage.test.ts` (§8.2) exists.

---

## 7. Reference TypeScript Types — `src/engine/types.ts`

Concrete shapes the planner can lift verbatim. These satisfy ENGINE-01.

```typescript
// src/engine/types.ts

// ── Identity ──────────────────────────────────────────────────────────────
export type CharacterId = 'DEADZONE' | 'TORC' | 'TRINETRA';
export type EnemyId =
  | 'CASTING_PROBE_MK1'
  | 'NETWORKER_ENFORCER'
  | 'CASTING_PATROL_BOT'
  | 'AEGIS_7';
export type CombatantId = CharacterId | EnemyId;

// ── Status effects ────────────────────────────────────────────────────────
export type StatusEffectType =
  | 'DEF_BUFF'         // TORC's Forge Wall (+8 DEF, 2 turns)
  | 'OVERDRIVE_CHARGE' // AEGIS-7 charging TERMINUS
  | 'DEFENDING';       // player chose DEFEND this turn

export interface StatusEffect {
  type: StatusEffectType;
  turnsRemaining: number;
  magnitude?: number;
  appliedBy?: CombatantId;
}

// ── Combatant base ────────────────────────────────────────────────────────
interface CombatantBase {
  id: CombatantId;
  name: string;
  hp: number;
  maxHp: number;
  en: number;
  maxEn: number;
  atk: number;
  def: number;
  spd: number;
  statusEffects: StatusEffect[];
  isDefeated: boolean;
}

export interface Character extends CombatantBase {
  kind: 'player';
  id: CharacterId;
  isDefending: boolean;
}

export interface Enemy extends CombatantBase {
  kind: 'enemy';
  id: EnemyId;
  behavior: EnemyBehaviorType;
  isOverdriveActive?: boolean;
}

export type Combatant = Character | Enemy;

// ── Turn queue ────────────────────────────────────────────────────────────
export interface TurnEntry {
  combatantId: CombatantId;
  kind: 'player' | 'enemy';
  spd: number; // snapshot at queue-build time
}

// ── Enemy AI ──────────────────────────────────────────────────────────────
export type EnemyBehaviorType =
  | 'ALWAYS_ATTACK'
  | 'TARGET_LOWEST_HP'
  | 'ATTACK_RANDOM'
  | 'OVERDRIVE_BOSS';

// ── Battle phase (discriminated union) ────────────────────────────────────
export type BattlePhase =
  | 'INIT'
  | 'PLAYER_INPUT'
  | 'RESOLVING'
  | 'ENEMY_TURN'
  | 'VICTORY'
  | 'GAME_OVER';

// ── Resolved actions (logic → UI bridge) ──────────────────────────────────
export type AnimationType =
  | 'ATTACK'
  | 'DEFEND'
  | 'ITEM'
  | 'SKILL_ELECTRIC'
  | 'SKILL_SHIELD'
  | 'SKILL_HEAL'
  | 'OVERDRIVE_WARNING'
  | 'OVERDRIVE_TERMINUS';

export interface HpDelta { targetId: CombatantId; amount: number; }
export interface EnDelta { targetId: CombatantId; amount: number; }
export interface StatusApplied { targetId: CombatantId; effect: StatusEffect; }
export interface StatusRemoved { targetId: CombatantId; effectType: StatusEffectType; }

export interface ResolvedAction {
  actorId: CombatantId;
  description: string;
  hpDelta?: HpDelta[];
  enDelta?: EnDelta[];
  statusApplied?: StatusApplied[];
  statusRemoved?: StatusRemoved[];
  animationType: AnimationType;
}

// ── Player actions (input from UI to reducer) ─────────────────────────────
export type PlayerActionType = 'ATTACK' | 'SKILL' | 'DEFEND' | 'ITEM';

export interface PlayerAction {
  type: PlayerActionType;
  actorId: CharacterId;
  targetId?: CombatantId;
}

// ── Top-level battle state ────────────────────────────────────────────────
export interface BattleState {
  phase: BattlePhase;
  party: Character[];
  enemies: Enemy[];
  turnQueue: TurnEntry[];
  currentTurnIndex: number;
  round: number;
  pendingAction: ResolvedAction | null;
  log: string[];
  items: { nanoMed: number };
}

// ── Reducer action union ──────────────────────────────────────────────────
export type Action =
  | { type: 'INIT'; payload: { party: Character[]; enemies: Enemy[] } }
  | { type: 'PLAYER_ACTION'; payload: PlayerAction }
  | { type: 'ENEMY_ACTION'; payload: { enemyId: EnemyId } }
  | { type: 'ACTION_RESOLVED' }
  | { type: 'NEXT_TURN' }
  | { type: 'CHECK_END_CONDITIONS' };
```

**Design notes:**
- `Character` is the FOUND-05/ENGINE-01 spelling (matches REQUIREMENTS.md). ARCHITECTURE.md called it `PlayerCharacter`; we use `Character` here per the requirement ID.
- `BattlePhase` is a string union (matches ENGINE-04 spec exactly: `INIT | PLAYER_INPUT | RESOLVING | ENEMY_TURN | VICTORY | GAME_OVER`). ARCHITECTURE.md used a tagged-object union which is more powerful but doesn't match ENGINE-04's literal text. **Follow ENGINE-04 spec**.
- `Action` is the reducer action union (different concept from `PlayerAction` which is UI → reducer payload).
- `OVERDRIVE_WARNING` / `OVERDRIVE_RESOLVING` phases mentioned in ARCHITECTURE.md and PITFALLS.md are intentionally **not in Phase 1** — the requirement (ENGINE-04) lists exactly six phases. OVERDRIVE phases are added in Phase 4.
- `isDefending` is a direct boolean on `Character` (per ARCHITECTURE.md design decision: simpler than reading `statusEffects` for the OVERDRIVE check).

---

## 8. `calculateDamage` — Signature, Implementation, Tests

### 8.1 Signature + implementation

`src/engine/damage.ts`:

```typescript
import type { Character, Enemy, Combatant, StatusEffect } from './types';

export interface DamageModifiers {
  /** Multiplier on the defender's effective DEF (0.7 = ignore 30% — Signal Null). */
  defPenetration?: number;
  /** Flat ATK bonus from skills/buffs. */
  flatAtkBonus?: number;
  /** Final damage multiplier (1.5 = crit, 0.5 = DEFENDING). */
  damageMultiplier?: number;
}

/**
 * Pure damage formula.
 *   base = (attacker.atk + flatAtkBonus) - (effectiveDef * defPenetration)
 *   final = floor(base * damageMultiplier)
 *   returns max(1, final)
 *
 * Always returns >= 1 (per ENGINE-02). Never mutates inputs.
 */
export function calculateDamage(
  attacker: Combatant,
  target: Combatant,
  modifiers: DamageModifiers = {}
): number {
  const flatBonus = modifiers.flatAtkBonus ?? 0;
  const penetration = modifiers.defPenetration ?? 1.0;
  const multiplier = modifiers.damageMultiplier ?? 1.0;

  const effectiveAtk = attacker.atk + flatBonus;
  const effectiveDef = Math.floor(getEffectiveDef(target) * penetration);

  const raw = (effectiveAtk - effectiveDef) * multiplier;
  return Math.max(1, Math.floor(raw));
}

/** Returns DEF including any DEF_BUFF status effect magnitudes. */
export function getEffectiveDef(combatant: Combatant): number {
  const buffs = combatant.statusEffects.filter(e => e.type === 'DEF_BUFF');
  const totalBuff = buffs.reduce((sum, b) => sum + (b.magnitude ?? 0), 0);
  return combatant.def + totalBuff;
}
```

### 8.2 Reference Vitest tests (ENGINE-02, ENGINE-06, QA-03)

`src/engine/damage.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDamage, getEffectiveDef } from './damage';
import type { Character, Enemy, StatusEffect } from './types';

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  kind: 'player',
  id: 'DEADZONE',
  name: 'DEADZONE',
  hp: 95, maxHp: 95,
  en: 25, maxEn: 25,
  atk: 22, def: 10, spd: 18,
  statusEffects: [],
  isDefeated: false,
  isDefending: false,
  ...overrides,
});

const makeEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  kind: 'enemy',
  id: 'CASTING_PROBE_MK1',
  name: 'Casting Probe MK-I',
  hp: 40, maxHp: 40,
  en: 0, maxEn: 0,
  atk: 14, def: 6, spd: 10,
  statusEffects: [],
  isDefeated: false,
  behavior: 'ALWAYS_ATTACK',
  ...overrides,
});

describe('calculateDamage', () => {
  it('returns ATK - DEF for the simple case', () => {
    const attacker = makeChar({ atk: 22 });
    const target = makeEnemy({ def: 6 });
    expect(calculateDamage(attacker, target)).toBe(16);
  });

  it('returns minimum 1 when DEF >= ATK (ENGINE-02 boundary)', () => {
    const attacker = makeChar({ atk: 5 });
    const target = makeEnemy({ def: 100 });
    expect(calculateDamage(attacker, target)).toBe(1);
  });

  it('returns minimum 1 when ATK == DEF', () => {
    const attacker = makeChar({ atk: 10 });
    const target = makeEnemy({ def: 10 });
    expect(calculateDamage(attacker, target)).toBe(1);
  });

  it('applies defPenetration (Signal Null ignores 30% DEF)', () => {
    const attacker = makeChar({ atk: 22 });
    const target = makeEnemy({ def: 10 });
    // effectiveDef = floor(10 * 0.7) = 7 → 22 - 7 = 15
    expect(calculateDamage(attacker, target, { defPenetration: 0.7 })).toBe(15);
  });

  it('applies damageMultiplier (DEFENDING halves)', () => {
    const attacker = makeChar({ atk: 30 });
    const target = makeEnemy({ def: 10 });
    // raw = (30 - 10) * 0.5 = 10
    expect(calculateDamage(attacker, target, { damageMultiplier: 0.5 })).toBe(10);
  });

  it('includes DEF_BUFF status effect in effective DEF', () => {
    const attacker = makeChar({ atk: 22 });
    const target = makeEnemy({
      def: 6,
      statusEffects: [{ type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8 }],
    });
    // effectiveDef = 6 + 8 = 14 → 22 - 14 = 8
    expect(calculateDamage(attacker, target)).toBe(8);
  });

  // ── Mutation regression test (ENGINE-06, QA-03) ────────────────────────
  it('does NOT mutate attacker or target (purity contract)', () => {
    const attacker = makeChar();
    const target = makeEnemy();
    const attackerSnapshot = JSON.stringify(attacker);
    const targetSnapshot = JSON.stringify(target);

    calculateDamage(attacker, target);

    expect(JSON.stringify(attacker)).toBe(attackerSnapshot);
    expect(JSON.stringify(target)).toBe(targetSnapshot);
  });

  it('does NOT mutate the modifiers object', () => {
    const mods = { defPenetration: 0.7, damageMultiplier: 1.5 };
    const snapshot = JSON.stringify(mods);
    calculateDamage(makeChar(), makeEnemy(), mods);
    expect(JSON.stringify(mods)).toBe(snapshot);
  });
});

describe('getEffectiveDef', () => {
  it('returns base DEF when no status effects', () => {
    expect(getEffectiveDef(makeEnemy({ def: 7 }))).toBe(7);
  });

  it('stacks multiple DEF_BUFF magnitudes', () => {
    const target = makeEnemy({
      def: 5,
      statusEffects: [
        { type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8 },
        { type: 'DEF_BUFF', turnsRemaining: 1, magnitude: 3 },
      ],
    });
    expect(getEffectiveDef(target)).toBe(16);
  });

  it('ignores non-DEF_BUFF status effects', () => {
    const target = makeEnemy({
      def: 7,
      statusEffects: [{ type: 'OVERDRIVE_CHARGE', turnsRemaining: 1 }],
    });
    expect(getEffectiveDef(target)).toBe(7);
  });
});
```

**What "tested with mutation regression" means:**
The two tests at the end of `describe('calculateDamage')` JSON-snapshot inputs before and after the call and assert byte-identical equality. If any reducer/util function silently mutates an input (the bug class from PITFALLS.md Pitfall 3), this test fails. **Every pure function in `src/engine/` must have at least one mutation regression test.**

---

## 9. `buildTurnQueue` — Algorithm + Edge Cases

`src/engine/turnQueue.ts`:

```typescript
import type { Character, Enemy, TurnEntry, CombatantId } from './types';

/**
 * Builds the turn order for a single round.
 *
 * Rules (ENGINE-03):
 *   - Sort by SPD descending.
 *   - Ties: stable — declaration order preserved (party listed first by convention,
 *     so player wins ties — favorable JRPG bias).
 *   - Defeated combatants are excluded (they don't get a turn this round).
 *   - SPD value is snapshotted at build time — mid-round SPD changes do not reorder.
 *
 * Pure function. Never mutates inputs.
 */
export function buildTurnQueue(
  party: readonly Character[],
  enemies: readonly Enemy[]
): TurnEntry[] {
  const entries: TurnEntry[] = [
    ...party
      .filter(c => !c.isDefeated)
      .map(c => ({
        combatantId: c.id as CombatantId,
        kind: 'player' as const,
        spd: c.spd, // snapshot
      })),
    ...enemies
      .filter(e => !e.isDefeated)
      .map(e => ({
        combatantId: e.id as CombatantId,
        kind: 'enemy' as const,
        spd: e.spd,
      })),
  ];

  // Array.prototype.sort is stable as of ES2019 — guaranteed in Node 12+
  // (we target Node 20, so safe). Ties preserve declaration order.
  return entries.sort((a, b) => b.spd - a.spd);
}
```

### 9.1 Tie-handling spec

| Case | Resolution |
|------|------------|
| Two combatants same SPD | Declaration order: party listed first → player goes first |
| All defeated | Returns `[]` (caller must handle: dispatch `CHECK_END_CONDITIONS`) |
| Only enemies alive | Returns enemies sorted; caller transitions to `GAME_OVER` |
| Only party alive | Returns party sorted; caller transitions to `VICTORY` |

### 9.2 Snapshot semantics

`spd` is copied into `TurnEntry` at queue-build time. Mid-round, if a status effect changes a combatant's SPD, **the existing queue is not reordered**. This is the standard JRPG convention — recomputing turn order mid-round causes player frustration and breaks the "I planned for X to go before Y" mental model.

The queue is rebuilt only when `currentTurnIndex >= turnQueue.length` (round end).

### 9.3 Reference tests

`src/engine/turnQueue.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildTurnQueue } from './turnQueue';
import type { Character, Enemy } from './types';

const c = (id: Character['id'], spd: number, defeated = false): Character => ({
  kind: 'player', id, name: id,
  hp: 1, maxHp: 1, en: 0, maxEn: 0, atk: 0, def: 0, spd,
  statusEffects: [], isDefeated: defeated, isDefending: false,
});

const e = (id: Enemy['id'], spd: number, defeated = false): Enemy => ({
  kind: 'enemy', id, name: id,
  hp: 1, maxHp: 1, en: 0, maxEn: 0, atk: 0, def: 0, spd,
  statusEffects: [], isDefeated: defeated, behavior: 'ALWAYS_ATTACK',
});

describe('buildTurnQueue', () => {
  it('sorts by SPD descending', () => {
    const party = [c('DEADZONE', 18), c('TORC', 12)];
    const enemies = [e('CASTING_PROBE_MK1', 10)];
    const q = buildTurnQueue(party, enemies);
    expect(q.map(t => t.combatantId)).toEqual(['DEADZONE', 'TORC', 'CASTING_PROBE_MK1']);
  });

  it('handles ties with stable sort (party first)', () => {
    const party = [c('TORC', 11)];
    const enemies = [e('NETWORKER_ENFORCER', 11)];
    const q = buildTurnQueue(party, enemies);
    expect(q[0]?.combatantId).toBe('TORC');
    expect(q[1]?.combatantId).toBe('NETWORKER_ENFORCER');
  });

  it('excludes defeated combatants', () => {
    const party = [c('DEADZONE', 18), c('TORC', 12, /* defeated */ true)];
    const enemies = [e('CASTING_PROBE_MK1', 10)];
    const q = buildTurnQueue(party, enemies);
    expect(q.map(t => t.combatantId)).toEqual(['DEADZONE', 'CASTING_PROBE_MK1']);
  });

  it('returns empty array when all combatants defeated', () => {
    const party = [c('DEADZONE', 18, true)];
    const enemies = [e('CASTING_PROBE_MK1', 10, true)];
    expect(buildTurnQueue(party, enemies)).toEqual([]);
  });

  it('snapshots SPD at build time (does not store reference)', () => {
    const dz = c('DEADZONE', 18);
    const q = buildTurnQueue([dz], []);
    // Mutate the original (illustrative — real code never does this)
    (dz as { spd: number }).spd = 99;
    expect(q[0]?.spd).toBe(18); // snapshot intact
  });

  it('does NOT mutate input arrays (purity)', () => {
    const party = [c('DEADZONE', 18), c('TORC', 12)];
    const enemies = [e('CASTING_PROBE_MK1', 10)];
    const partySnap = JSON.stringify(party);
    const enemiesSnap = JSON.stringify(enemies);
    buildTurnQueue(party, enemies);
    expect(JSON.stringify(party)).toBe(partySnap);
    expect(JSON.stringify(enemies)).toBe(enemiesSnap);
  });
});
```

---

## 10. Reducer Skeleton — Phase Enum, Action Union, Phase Guard

`src/engine/reducer.ts`:

```typescript
import type { BattleState, Action, Character, Enemy } from './types';
import { buildTurnQueue } from './turnQueue';

export const initialBattleState: BattleState = {
  phase: 'INIT',
  party: [],
  enemies: [],
  turnQueue: [],
  currentTurnIndex: 0,
  round: 0,
  pendingAction: null,
  log: [],
  items: { nanoMed: 3 },
};

/**
 * Pure reducer for battle state. Synchronous, deterministic, never throws.
 *
 * GROUND RULES (Phase 1 guardrails):
 *   1. Every PLAYER_ACTION case starts with the phase guard (ENGINE-05, QA-05).
 *   2. Every state update spreads parent objects AND nested combatants (ENGINE-06, QA-03).
 *   3. Math.random() is allowed here (QA-04 — reducer dispatch is a discrete event).
 *   4. Returns NEW state object on change; returns identical reference on no-op.
 */
export function battleReducer(state: BattleState, action: Action): BattleState {
  switch (action.type) {
    case 'INIT': {
      const { party, enemies } = action.payload;
      const turnQueue = buildTurnQueue(party, enemies);
      return {
        ...initialBattleState,
        party,
        enemies,
        turnQueue,
        phase: 'PLAYER_INPUT',
        round: 1,
        log: ['Encontro iniciado.'],
      };
    }

    case 'PLAYER_ACTION': {
      // ── PHASE GUARD (ENGINE-05, QA-05, Pitfall 4) ──────────────────────
      // Out-of-phase dispatches are silently dropped — return SAME reference
      // so React skips re-render.
      if (state.phase !== 'PLAYER_INPUT') {
        return state;
      }

      // Phase 1 stub: just transition to RESOLVING with a synthetic action.
      // Real action resolution lives in Phase 2 (ENGINE-07..10).
      return {
        ...state,
        phase: 'RESOLVING',
        pendingAction: {
          actorId: action.payload.actorId,
          description: `${action.payload.actorId} executes ${action.payload.type}.`,
          animationType: 'ATTACK',
        },
        log: [...state.log, `${action.payload.actorId} → ${action.payload.type}`],
      };
    }

    case 'ACTION_RESOLVED': {
      if (state.phase !== 'RESOLVING') return state;
      // Phase 1: clear pending action and advance
      return {
        ...state,
        pendingAction: null,
        phase: 'PLAYER_INPUT', // simplistic: skip ENEMY_TURN logic in Phase 1
      };
    }

    case 'ENEMY_ACTION': {
      if (state.phase !== 'ENEMY_TURN') return state;
      // Phase 1: stub (real enemy AI resolution in Phase 2)
      return { ...state, phase: 'RESOLVING' };
    }

    case 'NEXT_TURN': {
      const nextIndex = state.currentTurnIndex + 1;
      if (nextIndex >= state.turnQueue.length) {
        // New round
        const newQueue = buildTurnQueue(state.party, state.enemies);
        return {
          ...state,
          turnQueue: newQueue,
          currentTurnIndex: 0,
          round: state.round + 1,
        };
      }
      return { ...state, currentTurnIndex: nextIndex };
    }

    case 'CHECK_END_CONDITIONS': {
      const allEnemiesDefeated = state.enemies.every(e => e.isDefeated);
      const allPartyDefeated = state.party.every(c => c.isDefeated);
      if (allEnemiesDefeated) return { ...state, phase: 'VICTORY' };
      if (allPartyDefeated) return { ...state, phase: 'GAME_OVER' };
      return state;
    }

    default: {
      // Exhaustiveness check — TypeScript will error at compile time if
      // a new Action variant is added without a case here.
      const _exhaustive: never = action;
      return state;
    }
  }
}
```

### 10.1 Reference reducer tests (ENGINE-04, ENGINE-05, QA-05)

`src/engine/reducer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { battleReducer, initialBattleState } from './reducer';
import type { BattleState, Character, Enemy } from './types';

const dz: Character = {
  kind: 'player', id: 'DEADZONE', name: 'DEADZONE',
  hp: 95, maxHp: 95, en: 25, maxEn: 25, atk: 22, def: 10, spd: 18,
  statusEffects: [], isDefeated: false, isDefending: false,
};

const probe: Enemy = {
  kind: 'enemy', id: 'CASTING_PROBE_MK1', name: 'Casting Probe MK-I',
  hp: 40, maxHp: 40, en: 0, maxEn: 0, atk: 14, def: 6, spd: 10,
  statusEffects: [], isDefeated: false, behavior: 'ALWAYS_ATTACK',
};

describe('battleReducer', () => {
  it('INIT transitions from INIT to PLAYER_INPUT and builds turn queue', () => {
    const next = battleReducer(initialBattleState, {
      type: 'INIT',
      payload: { party: [dz], enemies: [probe] },
    });
    expect(next.phase).toBe('PLAYER_INPUT');
    expect(next.turnQueue).toHaveLength(2);
    expect(next.turnQueue[0]?.combatantId).toBe('DEADZONE');
    expect(next.round).toBe(1);
  });

  // ── PHASE GUARD (ENGINE-05, QA-05) ────────────────────────────────────
  it('drops PLAYER_ACTION when phase is RESOLVING — returns SAME reference', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'RESOLVING',
    };
    const next = battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    });
    expect(next).toBe(state); // reference identity → React skips re-render
  });

  it('drops PLAYER_ACTION when phase is ENEMY_TURN', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'ENEMY_TURN',
    };
    const next = battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    });
    expect(next).toBe(state);
  });

  it('drops PLAYER_ACTION when phase is GAME_OVER', () => {
    const state: BattleState = { ...initialBattleState, phase: 'GAME_OVER' };
    expect(battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    })).toBe(state);
  });

  it('accepts PLAYER_ACTION when phase is PLAYER_INPUT (transitions to RESOLVING)', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
    };
    const next = battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    });
    expect(next.phase).toBe('RESOLVING');
    expect(next.pendingAction).not.toBeNull();
    expect(next).not.toBe(state); // new reference
  });

  // ── PURITY / NO MUTATION (ENGINE-06, QA-03) ───────────────────────────
  it('does NOT mutate prior state on accepted dispatch', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
    };
    const snapshot = JSON.stringify(state);
    battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    });
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('CHECK_END_CONDITIONS transitions to VICTORY when all enemies defeated', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz],
      enemies: [{ ...probe, isDefeated: true }],
      phase: 'RESOLVING',
    };
    expect(battleReducer(state, { type: 'CHECK_END_CONDITIONS' }).phase).toBe('VICTORY');
  });

  it('CHECK_END_CONDITIONS transitions to GAME_OVER when all party defeated', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [probe],
      phase: 'RESOLVING',
    };
    expect(battleReducer(state, { type: 'CHECK_END_CONDITIONS' }).phase).toBe('GAME_OVER');
  });
});
```

---

## 11. `gameStateRef` Pattern — Safe Deferred Reads

`src/engine/gameStateRef.ts`:

```typescript
import { useRef, useEffect } from 'react';
import type { BattleState } from './types';

/**
 * Mirrors current battle state into a ref so deferred callbacks (setTimeout,
 * setInterval, AI handlers, animation completion) read the LATEST state, not
 * the value captured by closure at the time the callback was scheduled.
 *
 * This is the canonical fix for Pitfall 2 (stale closures) and the foundation
 * for AI-05 (AI reads via gameStateRef, not closure).
 *
 * Usage in BattleScene:
 *   const [state, dispatch] = useReducer(battleReducer, initialBattleState);
 *   const stateRef = useGameStateRef(state);
 *
 *   // Inside any deferred callback:
 *   setTimeout(() => {
 *     const current = stateRef.current; // ALWAYS fresh — never stale
 *     if (current.phase === 'RESOLVING') {
 *       dispatch({ type: 'ACTION_RESOLVED' });
 *     }
 *   }, 800);
 */
export function useGameStateRef(state: BattleState) {
  const ref = useRef<BattleState>(state);
  useEffect(() => {
    ref.current = state;
  }, [state]);
  return ref;
}
```

### 11.1 Usage in BattleScene (canonical pattern)

```typescript
// src/components/BattleScene.tsx (skeleton — Phase 1 minimal)
'use client';

import { useReducer, useEffect, useRef } from 'react';
import { battleReducer, initialBattleState } from '@/engine/reducer';
import { useGameStateRef } from '@/engine/gameStateRef';

export function BattleScene() {
  const [state, dispatch] = useReducer(battleReducer, initialBattleState);
  const stateRef = useGameStateRef(state);

  // Animation gate (Pitfall 1 + 2 combined)
  useEffect(() => {
    if (state.phase !== 'RESOLVING' || !state.pendingAction) return;

    const timer = setTimeout(() => {
      // Read FRESH state via ref — not closure
      const current = stateRef.current;
      if (current.phase === 'RESOLVING') {
        dispatch({ type: 'ACTION_RESOLVED' });
      }
    }, 800);

    // CRITICAL: cleanup on unmount/re-run (Pitfall 1, QA-01)
    return () => clearTimeout(timer);
  }, [state.phase, state.pendingAction, stateRef]);

  return (
    <main className="min-h-screen bg-bg-dark text-text-glow font-pixel p-8">
      <h1 className="text-electric text-2xl mb-4">[In]terfaces — Engine Skeleton</h1>
      <p>Phase: <span className="text-cyan-neon">{state.phase}</span></p>
      <p>Round: {state.round}</p>
      <p>Turn queue length: {state.turnQueue.length}</p>
      <p>Log entries: {state.log.length}</p>

      <button
        className="mt-4 bg-electric text-bg-dark px-4 py-2 disabled:opacity-50"
        disabled={state.phase !== 'PLAYER_INPUT'}
        onClick={() => dispatch({
          type: 'PLAYER_ACTION',
          payload: { type: 'ATTACK', actorId: 'DEADZONE' },
        })}
      >
        Synthetic Action (test phase transition)
      </button>

      <pre className="mt-4 text-xs opacity-60">
        {state.log.join('\n')}
      </pre>
    </main>
  );
}
```

`src/app/page.tsx`:
```typescript
'use client';
import { useEffect } from 'react';
import { useReducer } from 'react';
// ... wire BattleScene with INIT dispatch

import { BattleScene } from '@/components/BattleScene';

export default function Page() {
  return <BattleScene />;
}
```

(Phase 1 doesn't need GameController — Phase 2/3 introduces it. For Phase 1, `BattleScene` self-initializes via a one-shot `useEffect` dispatching `INIT` with placeholder party/enemy from `src/data/`.)

---

## 12. Enemy AI — `Record<EnemyBehaviorType, AIFn>` Skeleton

`src/engine/enemyAI.ts`:

```typescript
import type { Character, Enemy, ResolvedAction, EnemyBehaviorType, BattleState } from './types';

/**
 * AI function signature.
 *
 * Receives the LIVE battle state (not closure-captured) — callers must
 * pass `gameStateRef.current`, never a closed-over state variable (AI-05).
 *
 * Returns a ResolvedAction describing what the enemy does this turn.
 * Pure: no mutation, no side effects. The reducer applies the result.
 */
export type AIFn = (enemy: Enemy, state: BattleState) => ResolvedAction;

/**
 * Strategy map keyed by behavior type. Adding a new enemy archetype means
 * adding one entry here — no switch statements to extend, no class hierarchy.
 */
export const AI_BEHAVIORS: Record<EnemyBehaviorType, AIFn> = {
  // Phase 2 implements ALWAYS_ATTACK fully
  ALWAYS_ATTACK: (enemy, state) => stubAction(enemy, state, 'always_attack stub'),

  // Phase 3 implements TARGET_LOWEST_HP and ATTACK_RANDOM
  TARGET_LOWEST_HP: (enemy, state) => stubAction(enemy, state, 'target_lowest_hp stub'),
  ATTACK_RANDOM: (enemy, state) => stubAction(enemy, state, 'attack_random stub'),

  // Phase 4 implements OVERDRIVE_BOSS
  OVERDRIVE_BOSS: (enemy, state) => stubAction(enemy, state, 'overdrive_boss stub'),
};

function stubAction(enemy: Enemy, state: BattleState, label: string): ResolvedAction {
  // Defensive: validate at least one valid target exists (Pitfall 9)
  const validTargets = state.party.filter(c => !c.isDefeated);
  if (validTargets.length === 0) {
    throw new Error(`AI ${label}: no valid targets — caller must dispatch GAME_OVER first`);
  }

  // Phase 1 stub: stable placeholder action so the reducer can be tested.
  return {
    actorId: enemy.id,
    description: `${enemy.name} acts (${label})`,
    animationType: 'ATTACK',
  };
}

/**
 * Convenience entry point. The reducer (Phase 2+) calls this from ENEMY_ACTION
 * cases. Phase 1 only needs the SHAPE of the function map for AI-01.
 */
export function resolveEnemyAction(enemy: Enemy, state: BattleState): ResolvedAction {
  return AI_BEHAVIORS[enemy.behavior](enemy, state);
}
```

### 12.1 Phase 1 reference test (AI-01 — shape only)

`src/engine/enemyAI.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AI_BEHAVIORS, resolveEnemyAction } from './enemyAI';
import { initialBattleState } from './reducer';
import type { Enemy, Character, BattleState, EnemyBehaviorType } from './types';

const probe: Enemy = {
  kind: 'enemy', id: 'CASTING_PROBE_MK1', name: 'Probe',
  hp: 40, maxHp: 40, en: 0, maxEn: 0, atk: 14, def: 6, spd: 10,
  statusEffects: [], isDefeated: false, behavior: 'ALWAYS_ATTACK',
};
const dz: Character = {
  kind: 'player', id: 'DEADZONE', name: 'DEADZONE',
  hp: 95, maxHp: 95, en: 25, maxEn: 25, atk: 22, def: 10, spd: 18,
  statusEffects: [], isDefeated: false, isDefending: false,
};

describe('AI_BEHAVIORS map (AI-01)', () => {
  it('has an entry for every EnemyBehaviorType', () => {
    const requiredKeys: EnemyBehaviorType[] = [
      'ALWAYS_ATTACK', 'TARGET_LOWEST_HP', 'ATTACK_RANDOM', 'OVERDRIVE_BOSS',
    ];
    for (const k of requiredKeys) {
      expect(typeof AI_BEHAVIORS[k]).toBe('function');
    }
  });

  it('every AI function returns a ResolvedAction shape', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    for (const fn of Object.values(AI_BEHAVIORS)) {
      const action = fn(probe, state);
      expect(action).toHaveProperty('actorId');
      expect(action).toHaveProperty('description');
      expect(action).toHaveProperty('animationType');
    }
  });

  it('AI throws when no valid targets (defensive — Pitfall 9)', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [probe],
    };
    expect(() => resolveEnemyAction(probe, state)).toThrow();
  });

  it('does NOT mutate state', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    const snap = JSON.stringify(state);
    resolveEnemyAction(probe, state);
    expect(JSON.stringify(state)).toBe(snap);
  });
});
```

---

## 13. Placeholder Data — `src/data/`

Phase 1 needs minimal data so `BattleScene` can dispatch `INIT` and prove the loop works. Real character/enemy data lives in `src/data/` and gets expanded in Phases 2-4.

`src/data/characters.ts`:

```typescript
import type { Character } from '@/engine/types';

export const DEADZONE: Character = {
  kind: 'player',
  id: 'DEADZONE',
  name: 'DEADZONE',
  hp: 95, maxHp: 95,
  en: 25, maxEn: 25,
  atk: 22, def: 10, spd: 18,
  statusEffects: [],
  isDefeated: false,
  isDefending: false,
};

// TORC and TRINETRA stubs included for type-completeness; Phase 3 wires them in.
```

`src/data/enemies.ts`:

```typescript
import type { Enemy } from '@/engine/types';

export const CASTING_PROBE_MK1: Enemy = {
  kind: 'enemy',
  id: 'CASTING_PROBE_MK1',
  name: 'Casting Probe MK-I',
  hp: 40, maxHp: 40,
  en: 0, maxEn: 0,
  atk: 14, def: 6, spd: 10,
  statusEffects: [],
  isDefeated: false,
  behavior: 'ALWAYS_ATTACK',
};
```

---

## 14. ASSETS-07 — CSS-Only Sprite Fallback

The requirement: "Fallback CSS-only para sprites caso geração de IA falhe (silhuetas geométricas + glow)."

Phase 1 establishes the **pattern** so Phase 2+ can extend it per character/enemy. The minimum that satisfies the requirement is a single CSS class that produces a recognizable silhouette with a glowing outline, parameterized by a CSS variable for color.

`src/styles/sprite-fallback.module.css`:

```css
/* CSS-only combatant silhouettes. Used when sprite assets are missing.
 * Produces a glowing geometric outline keyed off a CSS variable.
 *
 * Usage:
 *   <div className={styles.sprite} data-kind="player" style={{ '--glow': '#00BFFF' }} />
 *   <div className={styles.sprite} data-kind="enemy"  style={{ '--glow': '#FF1744' }} />
 */

.sprite {
  --glow: #00BFFF;
  width: 96px;
  height: 128px;
  position: relative;
  display: inline-block;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(0, 191, 255, 0.05) 40%,
    var(--glow) 100%
  );
  border: 2px solid var(--glow);
  box-shadow:
    0 0 8px var(--glow),
    inset 0 0 12px color-mix(in srgb, var(--glow) 30%, transparent);
  /* Polygonal silhouette — humanoid by default */
  clip-path: polygon(
    35% 0%, 65% 0%, 70% 15%, 60% 25%, 70% 35%,
    85% 50%, 80% 75%, 70% 100%, 30% 100%, 20% 75%,
    15% 50%, 30% 35%, 40% 25%, 30% 15%
  );
  image-rendering: pixelated;
}

.sprite[data-kind="enemy"] {
  /* Wider, more menacing silhouette */
  clip-path: polygon(
    20% 0%, 80% 0%, 90% 20%, 100% 50%,
    90% 80%, 80% 100%, 20% 100%, 10% 80%,
    0% 50%, 10% 20%
  );
}

.sprite[data-kind="boss"] {
  width: 192px;
  height: 192px;
  /* Boss silhouette — angular and dominant */
  clip-path: polygon(
    25% 0%, 75% 0%, 100% 25%, 100% 75%,
    75% 100%, 25% 100%, 0% 75%, 0% 25%
  );
  animation: bossPulse 1.6s ease-in-out infinite;
}

@keyframes bossPulse {
  0%, 100% { box-shadow: 0 0 8px var(--glow), inset 0 0 12px color-mix(in srgb, var(--glow) 30%, transparent); }
  50%      { box-shadow: 0 0 24px var(--glow), inset 0 0 32px color-mix(in srgb, var(--glow) 50%, transparent); }
}
```

`src/components/SpriteFallback.tsx`:

```typescript
import styles from '@/styles/sprite-fallback.module.css';
import type { CombatantId } from '@/engine/types';

const COLOR_BY_ID: Record<string, string> = {
  DEADZONE:           '#00BFFF', // electric blue
  TORC:               '#FFD700', // gold
  TRINETRA:           '#7DF9FF', // cyan glow
  CASTING_PROBE_MK1:  '#FF1744', // red
  NETWORKER_ENFORCER: '#FF6E00', // orange
  CASTING_PATROL_BOT: '#FF1744',
  AEGIS_7:            '#FF00FF', // magenta — boss
};

interface Props {
  combatantId: CombatantId;
  kind: 'player' | 'enemy' | 'boss';
}

export function SpriteFallback({ combatantId, kind }: Props) {
  const glow = COLOR_BY_ID[combatantId] ?? '#00BFFF';
  return (
    <div
      className={styles.sprite}
      data-kind={kind}
      style={{ '--glow': glow } as React.CSSProperties}
      role="img"
      aria-label={combatantId}
    />
  );
}
```

**What "satisfies ASSETS-07" means for Phase 1:**
1. The CSS file exists and renders recognizable shapes for player / enemy / boss.
2. The `SpriteFallback` component is importable from anywhere.
3. The pattern is documented (this section) so Phase 2 character sprites can use it as the loading-state fallback.
4. No actual character sprites are required in Phase 1 — only the fallback system.

The Phase 1 `BattleScene` skeleton can optionally render a `<SpriteFallback combatantId="DEADZONE" kind="player" />` to visually validate the pattern, but is not required to.

---

## 15. Five Pitfall Guardrails — Code Patterns to Lift Verbatim

The five critical pitfalls, each as a concrete pattern. Phase 1 plans must encode all five.

### 15.1 Pitfall 1 — Strict Mode Double-Fire (QA-01)

**Pattern:** Every `useEffect` that schedules a timer returns `clearTimeout`.

```typescript
useEffect(() => {
  if (state.phase !== 'RESOLVING') return;
  const id = setTimeout(() => dispatch({ type: 'ACTION_RESOLVED' }), 800);
  return () => clearTimeout(id);   // ← MANDATORY
}, [state.phase]);
```

**One-shot init (e.g., dispatch INIT once):** use `useRef`, NOT `useState`:

```typescript
const initFired = useRef(false);
useEffect(() => {
  if (initFired.current) return;
  initFired.current = true;
  dispatch({ type: 'INIT', payload: { party: [DEADZONE], enemies: [PROBE] } });
}, []);
```

**Detection in tests:** Phase 1 doesn't run components in jsdom yet, but the manual smoke test in §17 includes "BattleScene transitions through phases without double-firing" — visually verifiable.

### 15.2 Pitfall 2 — Stale Closures in setTimeout (AI-05, QA-02)

**Pattern:** `useGameStateRef` hook (§11). Every deferred callback that reads game state uses `stateRef.current`, never closure variables.

```typescript
// BAD:
useEffect(() => {
  setTimeout(() => {
    const target = state.party.reduce((a, b) => a.hp < b.hp ? a : b); // ← stale!
  }, 1200);
}, []);

// GOOD:
useEffect(() => {
  setTimeout(() => {
    const current = stateRef.current; // ← fresh
    const target = current.party.reduce((a, b) => a.hp < b.hp ? a : b);
  }, 1200);
}, [stateRef]);
```

### 15.3 Pitfall 3 — Shallow Spread Mutations (ENGINE-06, QA-03)

**Pattern:** Reducer cases that touch combatants always `.map()` and spread the matched item:

```typescript
// BAD:
const newParty = [...state.party];
newParty[1].hp -= 20; // ← mutates original character

// GOOD:
const newParty = state.party.map((c, i) =>
  c.id === targetId ? { ...c, hp: c.hp - damage } : c
);
```

**Detection:** Mutation regression tests on every pure function (§8.2 example) AND a reducer test that snapshots prior state and asserts equality after dispatch.

### 15.4 Pitfall 4 — Turn Sequence Race Condition (ENGINE-05, QA-05)

**Pattern:** First line of every `PLAYER_ACTION` reducer case:

```typescript
case 'PLAYER_ACTION': {
  if (state.phase !== 'PLAYER_INPUT') return state; // ← MANDATORY first line
  // ... rest of handler
}
```

**UI mirror:** action buttons disabled when `phase !== 'PLAYER_INPUT'`:

```tsx
<button disabled={state.phase !== 'PLAYER_INPUT'}>ATACAR</button>
```

**Test:** `it('drops PLAYER_ACTION when phase is RESOLVING — returns SAME reference')` from §10.1.

### 15.5 Pitfall 5 — SSR Hydration Mismatch (FOUND-02, QA-04)

**Pattern A:** Every battle component starts with `'use client'`:

```typescript
'use client';
import { useReducer } from 'react';
// ...
```

**Pattern B:** No `Math.random()` or `Date.now()` during render. Always inside `useEffect` or reducer actions:

```typescript
// BAD: runs on server during SSR → mismatch
const [enemyHp] = useState(Math.floor(Math.random() * 20) + 40);

// GOOD: runs only after hydration
const [enemyHp, setEnemyHp] = useState(0);
useEffect(() => {
  setEnemyHp(Math.floor(Math.random() * 20) + 40);
}, []);

// BEST (Phase 1+): randomization belongs in the reducer's INIT action
dispatch({ type: 'INIT', payload: { ... } }); // reducer can use Math.random freely
```

**Detection:** Browser console clean of any `Warning: Text content did not match` or `Warning: Prop 'X' did not match`.

---

## 16. Recommended Directory Layout

Per FOUND-05, with Phase 1 specifics:

```
src/
├── app/
│   ├── layout.tsx           # Press Start 2P + Tailwind globals
│   ├── page.tsx             # 'use client'; renders <BattleScene />
│   └── globals.css          # Tailwind v4 import + @theme block
├── components/
│   ├── BattleScene.tsx      # 'use client'; useReducer + animation gate skeleton
│   └── SpriteFallback.tsx   # ASSETS-07 — CSS sprite fallback
├── engine/
│   ├── types.ts             # ENGINE-01 — all type definitions
│   ├── damage.ts            # ENGINE-02 — calculateDamage
│   ├── damage.test.ts
│   ├── turnQueue.ts         # ENGINE-03 — buildTurnQueue
│   ├── turnQueue.test.ts
│   ├── enemyAI.ts           # AI-01 — Record<EnemyBehaviorType, AIFn>
│   ├── enemyAI.test.ts
│   ├── reducer.ts           # ENGINE-04, ENGINE-05 — phase machine + guard
│   ├── reducer.test.ts
│   └── gameStateRef.ts      # AI-05, QA-02 — stale-closure prevention hook
├── data/
│   ├── characters.ts        # DEADZONE only in Phase 1
│   └── enemies.ts           # CASTING_PROBE_MK1 only in Phase 1
└── styles/
    └── sprite-fallback.module.css  # ASSETS-07 — CSS Module
```

---

## 17. Build & Verification Matrix (Phase 1 Done)

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript clean | `npx tsc --noEmit` | Zero errors |
| Lint clean | `npm run lint` | Zero errors, zero warnings |
| Tests pass | `npm run test` | All tests in `src/engine/**/*.test.ts` green |
| Coverage | `npm run test:coverage` | `src/engine/` >= 80% lines/branches |
| Dev server | `npm run dev` | `localhost:3000` shows BattleScene with phase displayed |
| Phase transition | Click "Synthetic Action" button | `PLAYER_INPUT` → `RESOLVING` → `PLAYER_INPUT`, no double-fire visible |
| Production build | `npm run build` | Completes with zero errors (FOUND-08) |
| Production start | `npm run start` | Same behavior as dev — phase transitions work |
| Strict Mode safe | DevTools console during dev | No "did not match" warnings; no double-log lines |
| Font loads | DevTools Network → Fonts | `press-start-2p` woff2 loads from `/_next/static/`; "Press Start 2P" appears applied to text |

---

## Architecture Patterns

### Pattern 1: Three-Layer Engine Separation

```
src/engine/             →  src/components/BattleScene  →  child components (Phase 2+)
pure TS, no React          useReducer + useEffect          read props, dispatch
```

Pure functions never touch React. The reducer never contains arithmetic — it calls pure functions and assembles the next state.

### Pattern 2: Discriminated Union for Phase Machine

Use a string union (not boolean flags) for `BattlePhase`. The reducer's `switch` on `action.type` combined with phase-guard checks at the top of each case enforces the state machine through types.

### Pattern 3: ResolvedAction as Logic-UI Bridge

Pure functions return `ResolvedAction` objects. The reducer stores them in `pendingAction`. The animation `useEffect` consumes them. The UI reads them for log entries. One typed object flows through every layer.

### Pattern 4: Function-Map Strategy for Polymorphism

Use `Record<Key, Function>` instead of class hierarchies or switch statements. Adding a new variant = adding one map entry. TypeScript checks completeness via `Record`.

### Anti-Patterns to Avoid

- **Mutating state inside reducers** — see Pitfall 3
- **Reading state via closure in setTimeout** — see Pitfall 2
- **Boolean state for one-shot init** — use `useRef` (see §15.1)
- **`if/else if/else` chains in reducers** — use `switch` with exhaustiveness `never` check
- **Computing damage inside the reducer body** — call pure functions from `damage.ts`
- **Using `Math.random()` during render** — only in `useEffect` or reducer (Pitfall 5)
- **Installing Zustand** — explicitly out of scope for v1 per SUMMARY.md reconciliation

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font loading | Manual `<link>` tags or `@fontsource` | `next/font/google` | Self-hosting, CLS=0, no runtime fetch |
| Test runner | Custom test scripts | Vitest 2 | TS-native, ESM-native, fast |
| State management | Global event bus, observable system | `useReducer` + `useGameStateRef` | Battle state has clear boundary |
| Animation library | JS animation loops, requestAnimationFrame | CSS `@keyframes` (Phase 2+) | GPU-composited, zero JS cost |
| Immutable update helper | Hand-written deep clone, `JSON.parse(JSON.stringify(...))` | `.map()` + spread (forces explicit pattern) | Forces the developer to think about each update |
| Strict-mode-safe init | useState + boolean flag | `useRef` flag | useState reset by Strict Mode double-mount; useRef survives |
| Type-safe action handlers | `if/else` chains | `switch` + `never` exhaustiveness | Compile-time completeness check |

**Key insight:** Phase 1 deliberately uses no external runtime libraries beyond React, Next, Tailwind. This is by design — every "could install a lib for this" decision falls to first principles for the demo's small scope.

---

## Common Pitfalls

(Full list in `.planning/research/PITFALLS.md`. The five critical ones are encoded as guardrails in §15. Two more relevant to Phase 1 setup:)

### Pitfall 6: Press Start 2P FOUT
**What goes wrong:** Brief flash of fallback font during load.
**Phase 1 stance:** FOUND-04 mandates `display: 'swap'`. We follow the requirement and accept FOUT for now. Document for Phase 5 polish review.

### Pitfall 9: Enemy AI infinite loop / undefined target
**What goes wrong:** AI tries to attack `undefined.id` when no valid targets exist.
**Phase 1 mitigation:** `stubAction()` in `enemyAI.ts` throws explicitly when `validTargets.length === 0`. Caller must dispatch `CHECK_END_CONDITIONS` first. Test in §12.1 covers this.

---

## Code Examples

All major code samples are inline in §1-§15. Cross-reference summary:

| Concern | Section |
|---------|---------|
| Install commands | §1 |
| `next.config.ts` | §2 |
| `tsconfig.json` | §3 |
| `globals.css` (Tailwind v4 + @theme) | §4 |
| `layout.tsx` (next/font) | §5 |
| `vitest.config.ts` | §6 |
| `src/engine/types.ts` | §7 |
| `src/engine/damage.ts` + tests | §8 |
| `src/engine/turnQueue.ts` + tests | §9 |
| `src/engine/reducer.ts` + tests | §10 |
| `src/engine/gameStateRef.ts` | §11 |
| `src/engine/enemyAI.ts` + tests | §12 |
| `src/data/{characters,enemies}.ts` | §13 |
| ASSETS-07 CSS sprite fallback | §14 |
| Five pitfall guardrails | §15 |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next 14, Vitest 2 | (planner verifies) | >= 20.18 | Required — install via nvm if missing |
| npm | All packages | (planner verifies) | bundled with Node | yarn/pnpm acceptable substitutes |
| Git | FOUND-07 | (planner verifies) | any recent | Required |

**No external services required for Phase 1.** No API keys, no databases, no AI assets (CSS fallback per ASSETS-07 covers visuals).

**Verify before scaffold:**
```bash
node --version    # expect v20.18+
npm --version
git --version
```

If Node < 20.18, the Tailwind v4 `lightningcss` build is more likely to fail. Recommend Node 20 LTS or 22 LTS.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vitest.config.ts` (created in §6) |
| Quick run command | `npx vitest run src/engine/<file>.test.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| FOUND-01 | Next 14 boots on :3000 with TS strict | smoke | `npm run dev` (manual: visit localhost:3000) | ❌ Wave 0 |
| FOUND-02 | Battle page is `'use client'` | static | `grep -l "'use client'" src/components/BattleScene.tsx` | ❌ Wave 0 |
| FOUND-03 | Tailwind v4 (or v3) Blue Wave palette | smoke | `npm run build` + visual inspection | ❌ Wave 0 |
| FOUND-04 | Press Start 2P loads with `display: 'swap'`, `variable: '--font-pixel'` | smoke | DevTools network check + `grep "Press_Start_2P" src/app/layout.tsx` | ❌ Wave 0 |
| FOUND-05 | Folder structure matches spec | static | `ls -d src/{app,components,engine,data,styles}` | ❌ Wave 0 |
| FOUND-06 | Vitest config runs node-environment tests | smoke | `npm run test` exits 0 | ❌ Wave 0 |
| FOUND-07 | Git initialized with `.gitignore` | static | `git status` succeeds; `cat .gitignore \| grep node_modules` | ❌ Wave 0 |
| FOUND-08 | `next build` clean | smoke | `npm run build` exits 0 | ❌ Wave 0 |
| ENGINE-01 | Types exported from `src/engine/types.ts` | static | `npx tsc --noEmit` exits 0 | ❌ Wave 0 |
| ENGINE-02 | `calculateDamage` returns max(1, ATK-DEF) | unit | `npx vitest run src/engine/damage.test.ts` | ❌ Wave 0 |
| ENGINE-03 | `buildTurnQueue` SPD desc, snapshot | unit | `npx vitest run src/engine/turnQueue.test.ts` | ❌ Wave 0 |
| ENGINE-04 | Reducer has all 6 phases | unit | `npx vitest run src/engine/reducer.test.ts -t "INIT transitions"` | ❌ Wave 0 |
| ENGINE-05 | Phase guard blocks out-of-phase actions | unit | `npx vitest run src/engine/reducer.test.ts -t "drops PLAYER_ACTION"` | ❌ Wave 0 |
| ENGINE-06 | HP/EN updates via `.map()` + spread (no mutation) | unit | `npx vitest run src/engine/reducer.test.ts -t "does NOT mutate"` | ❌ Wave 0 |
| AI-01 | AI as `Record<EnemyBehaviorType, AIFn>` | unit | `npx vitest run src/engine/enemyAI.test.ts -t "every EnemyBehaviorType"` | ❌ Wave 0 |
| AI-05 | AI reads via `gameStateRef` | static | `grep "stateRef.current" src/components/BattleScene.tsx` | ❌ Wave 0 |
| QA-01 | All useEffect timers have cleanup | static | `grep -A 5 "setTimeout" src/components/*.tsx \| grep clearTimeout` | ❌ Wave 0 |
| QA-02 | `gameStateRef` mirror used | static | `grep "useGameStateRef" src/components/BattleScene.tsx` | ❌ Wave 0 |
| QA-03 | Reducer uses `.map()` + spread | unit | mutation regression test in `reducer.test.ts` | ❌ Wave 0 |
| QA-04 | `Math.random()` only in useEffect/reducer | static | `grep -rn "Math.random" src/ \| grep -v "useEffect\|reducer\|.test."` returns empty | ❌ Wave 0 |
| QA-05 | Phase guard tested | unit | `reducer.test.ts -t "drops PLAYER_ACTION"` | ❌ Wave 0 |
| ASSETS-07 | CSS sprite fallback exists | static | `test -f src/styles/sprite-fallback.module.css && test -f src/components/SpriteFallback.tsx` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run <relevant-test-file>` (< 5 sec)
- **Per wave merge:** `npm run test` + `npx tsc --noEmit` + `npm run lint` (< 30 sec)
- **Phase gate:** Full suite green + `npm run build` + manual smoke test of `npm run dev` showing phase transition (< 2 min)

### Wave 0 Gaps

All test infrastructure must be created during Phase 1 (no prior tests exist).

- [ ] `vitest.config.ts` — created in §6
- [ ] `src/engine/damage.test.ts` — created alongside `damage.ts`
- [ ] `src/engine/turnQueue.test.ts` — created alongside `turnQueue.ts`
- [ ] `src/engine/reducer.test.ts` — created alongside `reducer.ts`
- [ ] `src/engine/enemyAI.test.ts` — created alongside `enemyAI.ts`
- [ ] No shared fixtures file needed in Phase 1 — each test file declares its own factory functions (see `makeChar` / `makeEnemy` in §8.2). Refactor to `src/engine/__fixtures__/combatants.ts` in Phase 2 when fixture reuse becomes painful.
- [ ] Framework install: `npm install -D vitest@^2 @vitest/ui @types/node` — covered in §1.5

### Manual Validation Steps

Three Phase 1 checks cannot be automated and require human verification:

1. **Strict Mode no double-fire** — open `localhost:3000`, click "Synthetic Action" once. Phase indicator must transition `PLAYER_INPUT → RESOLVING → PLAYER_INPUT` exactly once (not twice). Watch Network tab and console for any double-firing.
2. **Press Start 2P applied** — DevTools → Elements → inspect any text element → computed `font-family` shows `"Press Start 2P", monospace`.
3. **Blue Wave palette correct** — DevTools → Elements → root `<body>` computed `background-color: rgb(5, 5, 16)` (matches `#050510`).

---

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | Single-player local game; no auth |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | No multi-user concerns |
| V5 Input Validation | minimal | Phase guard in reducer (§10) is the only "input validation" surface in Phase 1 — no user-supplied strings, no network input, no file uploads |
| V6 Cryptography | no | No secrets, no PII, no network |

**Phase 1 security posture:** Effectively zero attack surface — single-player browser game, no backend, no user data, no network calls beyond static asset delivery. Standard Next.js + Vercel defaults are sufficient. Re-evaluate if any of the following change in later phases:
- Multiplayer is added (out of scope for v1)
- User-generated content is accepted (none planned)
- Save/load via cloud storage (out of scope for v1)

| Threat Pattern | STRIDE | Mitigation |
|----------------|--------|------------|
| Stale state from race condition | T (Tampering with state machine) | Phase guard in reducer (§15.4) |
| XSS via narrative log strings | T | Phase 1 log entries are reducer-controlled hardcoded strings; React escapes by default |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `tailwindcss@^4` installs cleanly on Node 20.18+ | §1.2 | Fallback to v3 already documented (§1.4); identical palette behavior — low risk |
| A2 | Press Start 2P single weight is `'400'` | §5 | LOW — verified via Google Fonts; if changed, TS literal type would catch |
| A3 | `next.config.ts` is supported by Next 14 (vs only `.mjs`) | §2 | LOW — Next 14 supports both per official docs; `.mjs` fallback trivial |
| A4 | `"strict": true` + the listed extra flags are tolerable for the engine layer | §3 | MEDIUM — if `noUncheckedIndexedAccess` causes excessive friction, can scope to `src/engine/**` only via separate `tsconfig.engine.json` |
| A5 | Vitest 2 `coverage.thresholds` syntax matches what's shown | §6 | LOW — verified syntax against Vitest 2 docs at research time |
| A6 | Stable sort in `Array.prototype.sort` is reliable for tie-breaking | §9 | NONE — guaranteed by ES2019 spec, all modern Node versions |
| A7 | The reducer pattern `if (state.phase !== 'PLAYER_INPUT') return state` returns the same reference, allowing React to skip re-render | §10, §15.4 | NONE — verified React behavior; test at §10.1 enforces it |
| A8 | `display: 'swap'` is REQUIRED by FOUND-04 even though Pitfall 6 prefers `'block'` | §5, §15 | LOW — explicit requirement compliance; Phase 5 polish review can revisit |

---

## Open Questions (RESOLVED)

1. **Should Phase 1 include a placeholder `src/data/` for all 3 characters and all 4 enemies, or just DEADZONE + Probe?**
   - What we know: ENGINE-01 requires the *types* to exist; nothing requires all data.
   - What's unclear: whether Phase 2 wants pre-existing stubs.
   - RESOLVED: include only DEADZONE + CASTING_PROBE_MK1 in Phase 1 (`src/data/`) — implemented in Plan 06. Phase 2/3/4 add the rest as encounter-specific files.

2. **Should the Phase 1 BattleScene render a `<SpriteFallback />` to visually validate ASSETS-07?**
   - What we know: ASSETS-07 requires the fallback exists and works; no requirement for it to render in Phase 1.
   - RESOLVED: Yes — implemented in Plan 07 Task 2. Renders one in the BattleScene shell to prove the CSS Module import works through Next's bundler.

3. **Auto mode + GSD enforcement: does scaffolding via `npx create-next-app` count as "direct repo edits outside GSD workflow"?**
   - What we know: CLAUDE.md says no direct edits outside GSD; scaffolding writes 50+ files.
   - RESOLVED: Structured as Plan 01 Task 2 within `/gsd-execute-phase` — satisfies the workflow contract.

4. **Discrepancy between CLAUDE.md and SUMMARY.md on state management:**
   - CLAUDE.md "Recommended Stack" still lists Zustand 5.
   - SUMMARY.md "Stack Conflict Resolution" + STATE.md "Key Decisions" lock `useReducer`.
   - RESOLVED: Phase 1 follows SUMMARY.md/STATE.md (no Zustand) — Plan 01 explicitly excludes Zustand from the install list, Plan 08 verifies via inverse grep. CLAUDE.md update deferred to a follow-up doc task post-Phase 1.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` JS theme config | Tailwind v4 `@theme` CSS block | v4 release (2025) | Theme is CSS-native; one less JS config file |
| `@fontsource/*` npm packages | `next/font/google` | Next 13 | Self-hosted fonts, zero CLS, bundled at build |
| `Jest` + `babel-jest` for TS | `Vitest` native ESM | 2024 widespread adoption | 30-70% faster test runs, no transform config |
| Class-based AI strategy | `Record<Key, Function>` map | (always) preferred in TS | No inheritance, simpler, fully typed |
| Pages Router | App Router | Next 13 stable, Next 14 default | Server Components capability + new file conventions |

**Deprecated/outdated:**
- `tailwindcss@2.x` — superseded by 3 then 4
- React 17 patterns (no Strict Mode double-mount in dev) — React 18 changed this; PITFALLS.md exists because of it
- Setting up Vitest with separate `vite.config.ts` for non-Vite projects — `vitest.config.ts` is the standalone path

---

## Sources

### Primary (HIGH confidence)
- `.planning/REQUIREMENTS.md` — phase requirement IDs and v1 scope
- `.planning/STATE.md` — locked stack decisions, pitfall watch list
- `.planning/PROJECT.md` — character/enemy stats, Blue Wave palette values
- `.planning/research/STACK.md` — installation commands, Tailwind v4 + v3 fallback, next/font integration
- `.planning/research/ARCHITECTURE.md` — reducer + pure function layer separation, AI strategy map, animation gate pattern
- `.planning/research/PITFALLS.md` — five critical pitfalls and their prevention patterns
- `.planning/research/SUMMARY.md` — useReducer-vs-Zustand reconciliation, 5-phase roadmap rationale
- Next.js Font Optimization: https://nextjs.org/docs/app/getting-started/fonts (CITED via STACK.md)
- Tailwind v4 release: https://tailwindcss.com/blog/tailwindcss-v4 (CITED via STACK.md)
- React `useReducer`: https://react.dev/reference/react/useReducer (CITED via ARCHITECTURE.md)
- Vitest config docs: https://vitest.dev/config/ (CITED via STACK.md)
- TypeScript strict mode: https://www.typescriptlang.org/tsconfig#strict

### Secondary (MEDIUM confidence)
- `feedback_strict_mode_istyping.md` (project memory) — confirms Pitfall 1 has happened in this codebase
- Game Programming Patterns — State chapter (CITED via ARCHITECTURE.md)
- React immutable update patterns docs (CITED via PITFALLS.md)

### Tertiary (LOW confidence)
- None used. All Phase 1 decisions trace to project research files or official documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version verified against STACK.md (researched same day) and official docs
- Architecture: HIGH — patterns directly derived from ARCHITECTURE.md, with phase-machine adapted to ENGINE-04's literal phase list
- Pitfalls: HIGH — five guardrails are mechanical encodings of PITFALLS.md prevention sections; project memory confirms Pitfall 1 is real

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (30 days — stable stack, low expected drift)
**Reviewer note:** If Tailwind v4 ships a major version bump or Next 15 stabilizes before Phase 1 execution starts, re-verify §1 install commands and §2 `next.config.ts` content.
