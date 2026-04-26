---
phase: 01-foundation-pure-engine
plan: "02"
subsystem: ui
tags: [tailwind, css, next-font, google-fonts, blue-wave, palette, press-start-2p]

requires:
  - phase: 01-01
    provides: Next.js 14 scaffold with TypeScript strict config and FOUND-05 folder structure

provides:
  - Tailwind v4 installed with @tailwindcss/postcss plugin
  - Blue Wave palette as Tailwind utility classes (bg-electric, text-text-glow, bg-bg-dark, text-cyan-neon, etc.)
  - globals.css with @import "tailwindcss" and @theme block
  - Press Start 2P font self-hosted via next/font/google, bound to --font-pixel CSS variable
  - layout.tsx with display:swap and variable --font-pixel on <html>
  - page.tsx skeleton proving palette + font render correctly
  - next.config.mjs (renamed from .ts — Next.js 14.2.x does not support next.config.ts)

affects: [all-phases, ui-components, battle-engine, styles]

tech-stack:
  added:
    - tailwindcss@^4.2.4
    - "@tailwindcss/postcss@^4.2.4"
    - Press Start 2P via next/font/google (self-hosted at build time)
  patterns:
    - Blue Wave palette defined in @theme block, consumed as Tailwind utility classes
    - Font variable on <html> className, referenced in @theme and :root

key-files:
  created:
    - src/app/globals.css (Tailwind v4 @import + @theme Blue Wave palette)
    - postcss.config.mjs (@tailwindcss/postcss plugin)
    - next.config.mjs (renamed from .ts; JSDoc types preserve type safety)
  modified:
    - src/app/layout.tsx (Press_Start_2P next/font/google, --font-pixel variable, pt-BR lang)
    - src/app/page.tsx (Blue Wave skeleton replacing default create-next-app page)
    - package.json (tailwindcss@^4, @tailwindcss/postcss@^4 added to devDependencies)

key-decisions:
  - "Tailwind v4 succeeded — no lightningcss errors on this machine; v3 fallback not needed"
  - "display: swap chosen over block per FOUND-04 requirement; FOUT risk accepted and documented for Phase 5 polish review"
  - "next.config.ts renamed to next.config.mjs (Rule 3 fix) — Next.js 14.2.35 does not support .ts config; type safety preserved via JSDoc @type annotation"

patterns-established:
  - "Blue Wave palette: always define in @theme (v4) or tailwind.config.ts (v3), never hardcode hex values in components"
  - "Fonts: next/font/google with variable pattern — bind variable to <html>, reference in CSS via var(--font-pixel)"

requirements-completed: [FOUND-03, FOUND-04]

duration: 4min
completed: "2026-04-26"
---

# Phase 01 Plan 02: Tailwind v4 + Blue Wave Palette + Press Start 2P Summary

**Tailwind v4 with @theme Blue Wave palette and Press Start 2P self-hosted via next/font/google, replacing the default create-next-app page with a working visual ground-truth skeleton**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-26T04:33:02Z
- **Completed:** 2026-04-26T04:37:13Z
- **Tasks:** 2/2
- **Files modified:** 6

## Accomplishments

- Tailwind v4 installed and functional — `@import "tailwindcss"` with `@theme` block exposing Blue Wave palette as utility classes (`bg-bg-dark`, `text-text-glow`, `text-electric`, `text-cyan-neon`, `bg-shadow-cold`, `font-pixel`)
- Press Start 2P loaded via `next/font/google` with `display: 'swap'`, `weight: '400'`, `variable: '--font-pixel'` — self-hosted at build time, zero runtime Google requests
- Skeleton `page.tsx` proves all Blue Wave utilities and pixel font resolve correctly; `npm run build` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Tailwind v4 + Blue Wave @theme palette** - `62ea826` (feat)
2. **Task 2: Press Start 2P + skeleton page** - `19d8586` (feat)

## Files Created/Modified

- `src/app/globals.css` — Tailwind v4 `@import "tailwindcss"` + `@theme` block with all Blue Wave color tokens
- `postcss.config.mjs` — PostCSS config using `@tailwindcss/postcss` plugin (Tailwind v4 requirement)
- `next.config.mjs` — Renamed from `.ts`; preserves `reactStrictMode: true`, type safety via JSDoc
- `src/app/layout.tsx` — `Press_Start_2P` from `next/font/google`, `display: 'swap'`, `variable: '--font-pixel'`, `lang="pt-BR"`
- `src/app/page.tsx` — Blue Wave skeleton using `bg-bg-dark`, `text-text-glow`, `font-pixel`, `text-electric`, `text-cyan-neon`
- `package.json` — `tailwindcss@^4.2.4` and `@tailwindcss/postcss@^4.2.4` added to devDependencies

## Decisions Made

- **Tailwind v4 succeeded** — No lightningcss native binding errors on this macOS machine. v3 fallback was not needed.
- **`display: 'swap'` accepted** — FOUND-04 mandates swap over block. FOUT risk is acknowledged and deferred to Phase 5 polish review (per RESEARCH A8). No override.
- **`next.config.ts` → `next.config.mjs`** — Next.js 14.2.35 does not support TypeScript config files at the loader level. Renamed; type safety preserved via `/** @type {import('next').NextConfig} */` JSDoc annotation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renamed next.config.ts to next.config.mjs**
- **Found during:** Task 1 (first `npm run build` attempt)
- **Issue:** Next.js 14.2.35 throws `Error: Configuring Next.js via 'next.config.ts' is not supported. Please replace the file with 'next.config.js' or 'next.config.mjs'.` — this blocked the build entirely.
- **Fix:** Created `next.config.mjs` with identical config (`reactStrictMode: true`) using JSDoc type annotation for type safety; ran `git rm next.config.ts`
- **Files modified:** `next.config.mjs` (created), `next.config.ts` (deleted)
- **Verification:** `npm run build` exits 0 after rename
- **Committed in:** `62ea826` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix — plan's own build verification step would fail without it. No scope creep.

## Issues Encountered

- Parent directory has a `.eslintrc.json` that conflicts with the project's ESLint config when Next.js resolves ESLint plugins. Results in a non-fatal warning during `npm run build` (`ESLint: Plugin "@next/next" was conflicted...`). Build still succeeds and static pages generate correctly. Out of scope for this plan — logged to deferred items.

## Tailwind Version Details

- **Path taken:** Tailwind v4 (primary path — no fallback needed)
- **lightningcss status:** No errors. v4 native CSS engine compiled successfully on macOS Darwin 25.4.0.
- **Installed:** `tailwindcss@4.2.4`, `@tailwindcss/postcss@4.2.4`
- **If v3 fallback had been needed:** The plan documented full v3 fallback instructions (Step 5). Not required here.

## Font Self-Hosting Confirmation

Press Start 2P is fetched from Google Fonts at **build time** by `next/font/google` and bundled as static assets served from the CDN. At runtime, zero requests are made to `fonts.googleapis.com` or `fonts.gstatic.com`. This satisfies the T-02-02 threat mitigation (IP disclosure prevention) and FOUND-04 requirement.

## FOUT Risk Documentation

`display: 'swap'` is set per FOUND-04. This means on slow connections, the fallback `monospace` font renders briefly before Press Start 2P loads. The flash affects the visual experience but not game logic. Deferred to **Phase 5 polish review** as documented in RESEARCH A8.

## Next Phase Readiness

- **Plan 03 (Vitest):** Can proceed immediately — zero file overlap with this plan
- **Plan 04+:** All components can use `bg-electric`, `text-text-glow`, `font-pixel`, `bg-bg-dark`, `text-cyan-neon`, `bg-shadow-cold`, `text-cobalt` utility classes confidently
- **No blockers** for subsequent plans in Phase 1

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `src/app/globals.css` exists | FOUND |
| `postcss.config.mjs` exists | FOUND |
| `next.config.mjs` exists | FOUND |
| `src/app/layout.tsx` exists | FOUND |
| `src/app/page.tsx` exists | FOUND |
| `01-02-SUMMARY.md` exists | FOUND |
| Commit `62ea826` exists | FOUND |
| Commit `19d8586` exists | FOUND |
