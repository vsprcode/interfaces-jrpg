# Phase 5: Polish, Narrative & Demo Completion — Research

**Researched:** 2026-04-26
**Domain:** Narrative integration, Vercel deploy, Lighthouse performance/accessibility, lore text
**Confidence:** HIGH (all findings based on direct codebase audit; no unverified external claims)

---

## Summary

Phase 5 is the final delivery phase. Four phases of engine work are complete — 142 tests green, 97.4 kB production build, all gameplay mechanics functional. This phase is primarily **content and integration**, not new architecture: adding the opening cutscene (NARR-01), the closing "Próximo capítulo" hook (NARR-06), auditing battle log lore density (NARR-05), and deploying to Vercel (DEPLOY-01 through DEPLOY-04).

The existing `DialogueBox` component handles all cutscene requirements already — it supports multi-line dialogue with speaker attribution, Space/Enter/click advancement, and keyboard cleanup. NARR-02, NARR-03, and NARR-04 (TORC join, TRINETRA join, AEGIS-7 reveal) are **already implemented** in `GameController.tsx` as `E2_DIALOGUE`, `E3_DIALOGUE`, and `E4_DIALOGUE`. The battle log messages are **already lore-rich** — `reducer.ts` uses in-fiction telemetry language throughout (e.g., "encontra brecha no firewall", "ativa postura de contenção analógica"). NARR-05 is largely satisfied; only minor phrasing review is needed.

The largest open task is DEPLOY: the repository has no git remote configured. Either a GitHub repo must be created and connected to Vercel's dashboard (recommended for CI/CD) or `vercel` CLI can deploy directly from local. The `vercel` CLI (v50.37.0) is installed. The production build is already clean (0 TypeScript errors, 0 ESLint violations). Lighthouse blockers are likely minor: missing `aria-label` on some icon buttons, color contrast of disabled buttons, and font loading strategy are the primary candidates.

**Primary recommendation:** Wave 0 = NARR-01 + NARR-06 new `ControllerPhase` states in `GameController`. Wave 1 = Battle log audit (NARR-05) + ASSETS-04/05/06 polish. Wave 2 = Lighthouse fixes (QA-07/QA-08) + README (DEPLOY-04). Wave 3 = Vercel deploy (DEPLOY-01 through DEPLOY-03).

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NARR-01 | Cutscene de abertura — DEADZONE sob chuva ácida no corredor da arcologia | New `OPENING_DIALOGUE` ControllerPhase + new const array; DialogueBox already handles rendering |
| NARR-02 | Diálogo de junção do TORC antes do Encontro 2 | **ALREADY DONE** — `E2_DIALOGUE` in `GameController.tsx` lines 21-25 |
| NARR-03 | Diálogo de junção do TRINETRA antes do Encontro 3 | **ALREADY DONE** — `E3_DIALOGUE` in `GameController.tsx` lines 28-32 |
| NARR-04 | Cutscene de revelação do AEGIS-7 antes do Encontro 4 | **ALREADY DONE** — `E4_DIALOGUE` in `GameController.tsx` lines 35-39 |
| NARR-05 | Battle log inclui linhas lore-rich | **LARGELY DONE** — reducer.ts uses in-fiction language; audit needed for "Encontro iniciado." and "Probe MK-I neutralizada." victory lines |
| NARR-06 | Cutscene final após derrotar AEGIS-7 | New `CLOSING_DIALOGUE` ControllerPhase + const array; called from `DEMO_COMPLETED` path in `handleVictory`, before `DemoCompletedScreen` |
| ASSETS-04 | UI frames (HUD, menu, dialogue box, title logo) | `page.tsx` has no title screen; `layout.tsx` has metadata title; DialogueBox has minimal styling — add header/title to `page.tsx` |
| ASSETS-05 | Effect polish (OVERDRIVE overlay done; Signal Null/Forge Wall/System Override FX) | CSS keyframes for skill effects exist in `battle.module.css` (`skillShieldEffect`, `skillHealEffect`); Signal Null (SKILL_ELECTRIC) has no dedicated animation — only the screen flash fires |
| ASSETS-06 | Ícones (Nano-Med, habilidades, status effects) | Status badges render as text labels (`SHIELD 2T`, `TERMINUS`, `GUARD`); no pixel icons — decision needed: CSS text badges are acceptable for demo scope |
| QA-07 | Build de produção testado em modo Strict (sem warnings) | Build already clean: `next build` passes, 0 TypeScript errors, React Strict Mode enabled in `next.config.mjs`. Verify no console warnings from double-fire |
| QA-08 | Lighthouse score >= 80 Performance e Accessibility | Not yet measured. Known candidates: disabled button color contrast, missing `aria-valuemin` on some bars, font swap CLS |
| DEPLOY-01 | Aplicação deployada no Vercel via `git push` | `vercel` CLI v50.37.0 installed; no git remote configured — must create GitHub repo first OR use `vercel` CLI direct deploy |
| DEPLOY-02 | URL pública acessível e funcional em produção | Follows from DEPLOY-01 — Vercel auto-assigns `.vercel.app` subdomain |
| DEPLOY-03 | Assets servidos de `/public` com cache headers adequados | No files in `/public` currently; Next.js default Vercel edge caching applies to static assets — headers adequate by default |
| DEPLOY-04 | README.md com instruções de instalação local e link para demo | `README.md` exists but contains only the create-next-app boilerplate — must be rewritten |
</phase_requirements>

---

## What Already Exists (Do NOT Re-implement)

This section is the most important research output for this phase. The risk of Phase 5 is re-doing work that is done.

### Confirmed Done — GameController Dialogues

| Requirement | Implementation Location | Status |
|-------------|-------------------------|--------|
| NARR-02 TORC join | `GameController.tsx` `E2_DIALOGUE` const, lines 21-25 | DONE |
| NARR-03 TRINETRA join | `GameController.tsx` `E3_DIALOGUE` const, lines 28-32 | DONE |
| NARR-04 AEGIS-7 reveal | `GameController.tsx` `E4_DIALOGUE` const, lines 35-39 | DONE |
| ENCOUNTER_4_DIALOGUE phase | `ControllerPhase` union includes `'ENCOUNTER_4_DIALOGUE'`, line 16 | DONE |
| OVERDRIVE overlay | `battle.module.css` `overdriveOverlayA/B` + BattleScene overlay render | DONE |
| DemoCompletedScreen | `DemoCompletedScreen.tsx` with NOVA INFILTRAÇÃO button | DONE |

### Confirmed Done — Battle Log Lore

Every player action in `reducer.ts` already produces in-fiction telemetry text:
- ATTACK: `"${actor.name} encontra brecha no firewall — ${dmg} de dano"` (line 68)
- DEFEND: `"${actor.name} ativa postura de contenção analógica — recupera 5 EN"` (line 88)
- ITEM: `"${actor.name} injeta Nano-Med — restaura ${healAmount} HP"` (line 113)
- SKILL Signal Null: `"DEADZONE transmite SIGNAL NULL — protocolo de ruído digital ativado — ${dmg} de dano (DEF ignorada em 30%)"` (line 213)
- SKILL Forge Wall: `"TORC ergue o FORGE WALL — barreira analógica ativada — DEF +8 por 2 turnos"` (line 141)
- SKILL System Override HEAL: `"TRINETRA executa SYSTEM OVERRIDE — restaura ${healAmount} HP em ${healTarget.name}"` (line 172)
- SKILL System Override REMOVE_STATUS: `"TRINETRA executa SYSTEM OVERRIDE — protocolo de limpeza em ${healTarget.name}"` (line 187)

Enemy actions in `enemyAI.ts` are also lore-rich: `"Casting Probe MK-I varre o corredor — sonda de ataque detecta DEADZONE"`, `"AEGIS-7 varre o setor com canhão de plasma"`, etc.

**NARR-05 gap items** (3 lines that are mechanical, not lore-rich):
1. `reducer.ts` line 43: `log: ['Encontro iniciado.']` — bare mechanical text
2. `reducer.ts` line 308: `'Probe MK-I neutralizada. Corredor 7-A desobstruído.'` — acceptable, lore-adjacent
3. `reducer.ts` line 318: `'DEADZONE eliminada. A resistência analógica recua.'` — acceptable

Priority fix: line 43 — change `'Encontro iniciado.'` to encounter-specific lore lines.

### Confirmed Done — CSS Animations

All required CSS keyframes are present in `battle.module.css`:
- Screen flash: `@keyframes flash` + `.flashA/.flashB` toggle pattern
- Camera shake: `@keyframes shake` + `.shakeA/.shakeB` toggle pattern
- HP bar drain: CSS `transition: width 600ms ease-out` on `.hpBarFill`
- OVERDRIVE pulse: `@keyframes overdrivePulse` + `.overdriveOverlayA/.overdriveOverlayB`
- Forge Wall: `@keyframes shieldPulse` + `.skillShieldEffect`
- System Override: `@keyframes healRipple` + `.skillHealEffect`
- DEFENDER glow: `@keyframes defenderGlow` + `.defenderOverdriveGlow`

**ASSETS-05 gap:** Signal Null (`SKILL_ELECTRIC` animationType) has no dedicated CSS effect. The screen flash fires, but no electric-specific particle effect exists. Options: (a) add `@keyframes electricPulse` with a yellow/blue hue-rotate flicker on the battle container, or (b) accept screen flash as sufficient (consistent with demo scope decision).

### Confirmed Done — Production Build

`npm run build` output (2026-04-26):
- Compiled successfully, 0 errors
- Route `/`: 10.1 kB, 97.4 kB First Load JS
- Static (`○`), prerendered — no server functions
- TypeScript strict: clean
- React Strict Mode: enabled (`next.config.mjs` line 7)

QA-07 status: DONE as a build artifact; the only remaining action is to verify no console warnings appear during a browser dev session (STRICT_MODE double-fire protection via `useRef(false)` is confirmed in `BattleScene.tsx` and `GameController.tsx`).

---

## What Genuinely Needs to Be Built

### NARR-01: Opening Cutscene (New)

**What:** A new `ControllerPhase` state `'OPENING_DIALOGUE'` rendered before the first battle.

**Implementation pattern:**

1. Add `'OPENING_DIALOGUE'` to the `ControllerPhase` union in `GameController.tsx`
2. Initialize `controllerPhase` to `'OPENING_DIALOGUE'` (not `'BATTLE'`)
3. Add `OPENING_DIALOGUE` const array with 4-5 lines
4. Render `<DialogueBox lines={OPENING_DIALOGUE} onComplete={handleOpeningComplete} />`
5. `handleOpeningComplete` sets phase to `'BATTLE'`
6. The "NOVA INFILTRAÇÃO" reset path (`handleNewGame`) should optionally skip opening or show it — recommend showing it for full experience

**`DialogueBox` is fully capable:** multi-line, Space/Enter/click, keyboard cleanup, accessible `role="dialog"`.

### NARR-06: Closing Cutscene (New)

**What:** A new `ControllerPhase` state `'CLOSING_DIALOGUE'` inserted between AEGIS-7 victory and `DemoCompletedScreen`.

**Implementation pattern:**

1. Add `'CLOSING_DIALOGUE'` to the `ControllerPhase` union
2. In `handleVictory` for `encounterIndex === 3`, set phase to `'CLOSING_DIALOGUE'` (not `'DEMO_COMPLETED'`)
3. Add `CLOSING_DIALOGUE` const array with 3-4 lines (the "próximo capítulo" hook)
4. `handleClosingComplete` sets phase to `'DEMO_COMPLETED'`
5. `DemoCompletedScreen` is unchanged

### ASSETS-04: Title Screen / Logo Polish

**Current state:** `page.tsx` renders only `<GameController />` with no title branding. `layout.tsx` has metadata `title: '[In]terfaces — Demo'` for the browser tab. No visual title screen exists.

**What this means:** "Title logo final pass" means adding a pre-game title header to `page.tsx` — not a separate screen. Recommended approach: a static header above the game container with `[In]terfaces` logotype in the pixel font with Blue Wave palette styling. This is a CSS-only addition with no new components.

**Alternatively:** the `OPENING_DIALOGUE` cutscene serves as the title experience — rendering DEADZONE's first line before E1 implicitly positions the player. A styled header is still useful for when the page is shared via URL.

### DEPLOY-01 through DEPLOY-03: Vercel Deploy

**Current state:**
- `vercel` CLI v50.37.0 is installed
- No git remote configured (`git remote -v` shows empty)
- `next.config.mjs` has no special Vercel configuration required — standard Next.js 14 App Router deploy works out of the box
- The app is fully static after initial HTML (`○` in build output)
- `/public` directory is empty (no static assets to configure cache headers for)

**Two deploy paths:**

**Path A — Vercel CLI direct (fastest, no GitHub):**
```bash
cd "/Volumes/King Metror/Worldbuilding/[In]terfaces/Interfaces JRPG"
vercel login     # if not already authenticated
vercel           # interactive project setup
vercel --prod    # promote to production URL
```
This gives a `*.vercel.app` URL immediately. No GitHub integration required.

**Path B — GitHub + Vercel dashboard (recommended for DEPLOY-01 "via git push"):**
1. Create GitHub repo: `gh repo create interfaces-jrpg --public`
2. `git remote add origin <url>` + `git push -u origin main`
3. Connect Vercel dashboard to GitHub repo
4. Subsequent `git push` triggers auto-deploy

DEPLOY-01 explicitly says "via `git push`", so Path B satisfies the requirement letter. However, Path A satisfies the spirit (live URL accessible) with less setup. The planner should offer both options and let the executor choose based on whether GitHub integration is desired.

**DEPLOY-03 (cache headers):** The `/public` folder is currently empty. Vercel automatically applies long-lived cache headers (`Cache-Control: public, max-age=31536000, immutable`) to static assets served from `/public`. Since all game assets are CSS/JS bundles (not `/public` files), this requirement is satisfied by default Vercel behavior. No `vercel.json` is needed. If any assets are added to `/public` (images, fonts), they will be cached automatically.

### DEPLOY-04: README.md Rewrite

**Current state:** `README.md` is the create-next-app boilerplate — mentions Geist font, links to Next.js docs. Needs a full rewrite with:
- Project description (universe [In]terfaces, demo premise)
- Local install instructions (`npm install`, `npm run dev`)
- Test instructions (`npm run test`)
- Demo link (filled in after DEPLOY-01/02)
- Screenshots or ASCII art optional

### QA-08: Lighthouse Score >= 80

**Assessment based on codebase audit:**

**Performance (likely >= 80 already):**
- Build is 97.4 kB First Load JS — small for a game app
- `next/font/google` (Press Start 2P) is self-hosted with `display: 'swap'` — no CLS, no external font requests
- All animations use `transform`/`opacity` (GPU compositor — VISUAL-07)
- No images in `/public` to optimize
- Static prerendering (`○`) — no server-side latency

**Accessibility (needs audit — likely 60-75 without fixes):**

Known issues from codebase review:

1. **`EncounterCompleteScreen.tsx`**: `<button onClick={...} onKeyDown={...}>CONTINUAR</button>` — has explicit `onKeyDown` but the button is `<button type="button">` which already handles keyboard natively. Not a bug, but redundant. The `onKeyDown` handler only fires on `Space`/`Enter` — correct. No `aria-label` issues here.

2. **`ActionMenu.tsx`** main buttons: ATACAR, HABILIDADE, DEFENDER, ITEM have no `aria-label` beyond button text. Button text is uppercase which may fail contrast when `disabled:opacity-40` is applied. Disabled buttons at 40% opacity with small (8-9px) pixel font will likely fail Lighthouse contrast checks.

3. **`DialogueBox.tsx`**: `role="dialog"` present. Missing `aria-modal="true"` and `aria-labelledby` (the speaker name should be a proper heading reference). Will likely trigger Lighthouse accessibility warnings.

4. **Color contrast**: Blue Wave palette uses `--color-electric: #00BFFF` on `rgba(0,0,0,0.7)` background → contrast ratio approximately 5.3:1 (passes AA for normal text, but pixel font at 7-8px may be classified as "small text" needing 4.5:1). Should pass. The `#444` color used for pagination text in `DialogueBox.tsx` (`{currentLine + 1}/{lines.length} ▶ CLIQUE OU ESPAÇO`) on dark background will fail contrast.

5. **`BattleLog.tsx`**: `role="log"` + `aria-live="polite"` + `aria-label` — well-implemented.

6. **`CharacterHUD.tsx`**: HP/EN bars have `role="progressbar"` with `aria-valuenow`/`aria-valuemax`/`aria-label` — well-implemented. Missing `aria-valuemin={0}` (the EnemyPanel has it, CharacterHUD does not — minor).

7. **`SpriteFallback.tsx`**: `role="img"` with `aria-label={combatantId}` — acceptable. `combatantId` is a code string like `DEADZONE` which is human-readable.

**Recommended Lighthouse fixes (small scope, high impact):**

| Fix | File | Expected Impact |
|-----|------|-----------------|
| Add `aria-modal="true"` to DialogueBox | `DialogueBox.tsx` | Accessibility |
| Change `#444` pagination text to `#888` or `--color-text-glow` | `DialogueBox.tsx` | Contrast |
| Add `aria-valuemin={0}` to CharacterHUD HP/EN bars | `CharacterHUD.tsx` | Accessibility |
| Add `type="button"` to EncounterCompleteScreen button | `EncounterCompleteScreen.tsx` | Minor |
| Verify disabled button contrast | `ActionMenu.tsx` | Contrast |

---

## Architecture Patterns

### Pattern 1: New ControllerPhase State (NARR-01, NARR-06)

All dialogue phases in `GameController` follow a uniform pattern. Adding NARR-01 and NARR-06 means:

```typescript
// 1. Extend the union (GameController.tsx)
type ControllerPhase =
  | 'OPENING_DIALOGUE'   // NEW — fires before E1
  | 'BATTLE'
  | 'ENCOUNTER_2_DIALOGUE'
  | 'ENCOUNTER_3_DIALOGUE'
  | 'ENCOUNTER_4_DIALOGUE'
  | 'CLOSING_DIALOGUE'   // NEW — fires after E4 victory, before DEMO_COMPLETED
  | 'ENCOUNTER_COMPLETE'
  | 'DEMO_COMPLETED'
  | 'GAME_OVER';

// 2. Initialize to OPENING_DIALOGUE (not BATTLE)
const [controllerPhase, setControllerPhase] = useState<ControllerPhase>('OPENING_DIALOGUE');

// 3. Add dialogue const (before component)
const OPENING_DIALOGUE = [ ... ];
const CLOSING_DIALOGUE = [ ... ];

// 4. Add handlers
const handleOpeningComplete = () => setControllerPhase('BATTLE');
const handleClosingComplete = () => setControllerPhase('DEMO_COMPLETED');

// 5. In handleVictory for encounterIndex === 3:
// Change: setControllerPhase('DEMO_COMPLETED')
// To:     setControllerPhase('CLOSING_DIALOGUE')

// 6. Add JSX render blocks (follow existing pattern)
{controllerPhase === 'OPENING_DIALOGUE' && (
  <DialogueBox lines={OPENING_DIALOGUE} onComplete={handleOpeningComplete} />
)}
{controllerPhase === 'CLOSING_DIALOGUE' && (
  <DialogueBox lines={CLOSING_DIALOGUE} onComplete={handleClosingComplete} />
)}
```

**Source:** `GameController.tsx` existing pattern [VERIFIED: codebase]

### Pattern 2: NARR-05 Encounter-Specific Init Log

Replace the generic `'Encontro iniciado.'` in `reducer.ts` `INIT` case with encounter-specific lore text. The simplest approach: pass an optional `encounterLabel` in the `INIT` payload, or — simpler — define a lookup by `enemies[0].id` inside the reducer. Since the reducer already has access to `enemies`, this works without touching types.

```typescript
// reducer.ts INIT case — replace static message
const ENCOUNTER_INIT_MESSAGES: Partial<Record<string, string>> = {
  'CASTING_PROBE_MK1': 'DEADZONE infiltra o Corredor 7-A. Sensores detectam presença inimiga.',
  'NETWORKER_ENFORCER': 'Docas de Carga. Dois Enforcers patrulham a área. Torc assume posição.',
  'CASTING_PATROL_BOT': 'Sala de Servidores. Três Patrol Bots em rotação. Trinetra calibra o Override.',
  'AEGIS_7': 'Câmara de Comando. AEGIS-7 online. Protocolo de eliminação ativo.',
};
const firstEnemyId = enemies[0]?.id;
const initMessage = (firstEnemyId && ENCOUNTER_INIT_MESSAGES[firstEnemyId])
  ?? 'Encontro iniciado.';
```

**Source:** `reducer.ts` lines 34-44 [VERIFIED: codebase]

### Pattern 3: Vercel Deploy (No vercel.json Needed)

The app is pure Next.js 14 App Router with no environment variables and no server functions. Standard deploy:

```bash
# CLI deploy (Path A)
vercel --prod

# GitHub-connected deploy (Path B)
gh repo create interfaces-jrpg --public --source=. --remote=origin --push
# Then connect to Vercel dashboard: vercel.com/new → Import Git Repository
```

**vercel.json is not needed** because:
- No custom headers required (Vercel defaults handle static assets)
- No rewrites/redirects
- No environment variables
- No serverless functions
- Next.js 14 is first-party supported

**Source:** `next.config.mjs` (no custom config), `package.json` build script [VERIFIED: codebase]

---

## Lore Content: Dialogue Scripts (Portuguese, Canon)

All dialogue is written faithful to [In]terfaces tone: no heroism, just survival and structural resistance. Language register: terse, operational, telemetric. Characters never sound optimistic — they assess, calculate, and execute.

### OPENING_DIALOGUE (NARR-01)
*Context: DEADZONE (Jack Rourke) is alone, infiltrating Arcologia Casting-7 through Corridor 7-A during acid rain.*

```typescript
const OPENING_DIALOGUE = [
  {
    speaker: 'SISTEMA',
    text: 'Arcologia Casting-7. São Paulo. 2042. Protocolo Interfaces Agreement em vigor — identidade = dispositivo.',
  },
  {
    speaker: 'SISTEMA',
    text: 'Chuva ácida no Corredor 7-A. Visibilidade: 12%. Patrulhas: 3 setores ativos.',
  },
  {
    speaker: 'DEADZONE',
    text: 'Rourke. Ghost. Sem implante neural, sem rastro no grid. Aqui começa a infiltração.',
  },
  {
    speaker: 'DEADZONE',
    text: 'Objetivo: atravessar a arcologia. Sem heróis. Apenas saída.',
  },
];
```

**Design notes:**
- Speaker `'SISTEMA'` (not a character) gives the opening a cold, diegetic telemetry feel — as if the player is reading a system readout, not watching a cutscene. This is consistent with the [In]terfaces aesthetic.
- Two `SISTEMA` lines establish setting efficiently for a first-contact player.
- Two `DEADZONE` lines establish the protagonist's voice and the game's anti-heroic tone.
- Total: 4 clicks, ~20 seconds — appropriate for an opening before E1.

### CLOSING_DIALOGUE (NARR-06)
*Context: AEGIS-7 has been neutralized. The trio is in the Command Chamber. The demo ends here — hook for the next chapter.*

```typescript
const CLOSING_DIALOGUE = [
  {
    speaker: 'SISTEMA',
    text: 'AEGIS-7 neutralizado. Câmara de Comando: protocolo de lockdown em 90 segundos.',
  },
  {
    speaker: 'TRINETRA',
    text: 'Os dados foram extraídos. O que a Casting Syndicate queria esconder agora está conosco.',
  },
  {
    speaker: 'DEADZONE',
    text: 'Isso foi um setor. A arcologia tem dezesseis.',
  },
  {
    speaker: 'SISTEMA',
    text: '>>> DEMO ENCERRADA. PRÓXIMO CAPÍTULO EM BREVE. <<<',
  },
];
```

**Design notes:**
- Maintains operational tone — no celebration, just the next threat on the horizon.
- `TRINETRA`'s line gives narrative weight: the infiltration had a purpose beyond survival.
- `DEADZONE`'s line re-contextualizes the "victory" — they won one fight in a larger war.
- `SISTEMA` closing with the demo hook is clean: it reads as a system message, not fourth-wall breaking.

### NARR-05 Encounter Init Messages (for reducer.ts)

```
E1: 'DEADZONE infiltra o Corredor 7-A. Sensores detectam presença inimiga.'
E2: 'Docas de Carga. Dois Enforcers em patrulha. TORC assume posição de flanco.'
E3: 'Sala de Servidores. Três Patrol Bots em rotação automática. TRINETRA calibra o Override.'
E4: 'Câmara de Comando. AEGIS-7 online. Protocolo de eliminação pesado ativado.'
```

---

## Standard Stack

No new libraries are needed for Phase 5. All requirements are implemented with the existing stack.

### Existing (Confirmed Current)

| Library | Version | Phase 5 Use | Source |
|---------|---------|-------------|--------|
| Next.js | 14.2.35 | Build, deploy, font loading | [VERIFIED: package.json] |
| TypeScript | ^5 | Type safety on new dialogue constants | [VERIFIED: package.json] |
| React | ^18 | DialogueBox, GameController state | [VERIFIED: package.json] |
| Tailwind CSS | ^4.2.4 | Title screen header styling | [VERIFIED: package.json] |
| CSS Modules | (built-in) | Any new animation keyframes | [VERIFIED: battle.module.css] |
| Vitest | ^2.1.9 | Tests for new dialogue phases | [VERIFIED: package.json] |
| vercel CLI | 50.37.0 | Deployment | [VERIFIED: shell] |

### No New Dependencies Required

Phase 5 adds zero new npm packages. All features (dialogue, CSS animations, Vercel deploy) are achievable with the existing stack.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Typewriter text effect | Custom character-by-character renderer | Plain text in DialogueBox | Press Start 2P at 7px is already slow to read; typewriter at 7px would take 5+ seconds per line. Line-at-a-time is the right UX. |
| Dialogue skip button | Custom "SKIP" route | Existing click/Space handler on the whole DialogueBox div | The entire dialog area is already clickable — no separate skip button needed |
| Custom cache headers | `vercel.json` headers config | Vercel default headers | Static Next.js assets are automatically cached with immutable headers by Vercel's edge network |
| Accessibility overlays | Custom focus management library | Native `aria-*` attributes | The app uses keyboard navigation via `addEventListener('keydown')` — no focus trap library needed for a game |
| Image optimization | Custom lazy loading | `next/image` or no images | The game uses CSS geometric fallback sprites (ASSETS-07) — no actual images to optimize in Phase 5 |

---

## Common Pitfalls

### Pitfall 1: Initializing controllerPhase to 'OPENING_DIALOGUE' breaks NOVA INFILTRAÇÃO reset

**What goes wrong:** `handleNewGame` resets `controllerPhase` to `'BATTLE'` (line 128). If the opening dialogue is required for the first run only, this is fine. But if the opening should replay on NOVA INFILTRAÇÃO (desired for full experience), `handleNewGame` must set phase to `'OPENING_DIALOGUE'`.

**Why it happens:** Developer initializes `useState` to `'OPENING_DIALOGUE'` but forgets to update `handleNewGame`.

**How to avoid:** When implementing NARR-01, update `handleNewGame` to `setControllerPhase('OPENING_DIALOGUE')` at the same time. Decide upfront whether NOVA INFILTRAÇÃO replays the opening (recommended: yes, for full experience on reset).

**Warning signs:** NOVA INFILTRAÇÃO button goes straight to battle without opening cutscene.

### Pitfall 2: CLOSING_DIALOGUE fires before DemoCompletedScreen — check state transition order

**What goes wrong:** `handleVictory` for encounterIndex 3 currently sets `setControllerPhase('DEMO_COMPLETED')` directly. Changing this to `'CLOSING_DIALOGUE'` is correct, but `handleClosingComplete` must then set `'DEMO_COMPLETED'`, not `'BATTLE'`.

**Why it happens:** Copy-paste error from `handleDialogueComplete` (which sets phase to `'BATTLE'`).

**How to avoid:** Create a dedicated `handleClosingComplete = () => setControllerPhase('DEMO_COMPLETED')` function — do not reuse `handleDialogueComplete`.

**Warning signs:** After closing dialogue, game resets to E1 instead of showing DEMO COMPLETED screen.

### Pitfall 3: Lighthouse runs must be on production build, not dev server

**What goes wrong:** Running Lighthouse against `localhost:3000` (dev server) gives inaccurate scores due to unoptimized JavaScript bundles and missing compression.

**Why it happens:** Dev server does not apply production optimizations (minification, tree-shaking, font subsetting).

**How to avoid:** Run `npm run build && npm run start` to test the production build locally before the Vercel URL is available. Use `next start` on port 3000, then run Lighthouse against `localhost:3000` with the production build.

**Warning signs:** Lighthouse performance scores 20-30 points lower than production — this is normal for dev server, not a real issue.

### Pitfall 4: DialogueBox renders over BattleScene during battle if state is wrong

**What goes wrong:** If `controllerPhase` stays on `'OPENING_DIALOGUE'` due to a bug in `handleOpeningComplete`, the DialogueBox will render indefinitely and the game will never start.

**Why it happens:** `onComplete` callback is not wired correctly in the JSX.

**How to avoid:** Test by clicking through the entire opening dialogue locally before shipping. The fix is trivial (wire `onComplete={handleOpeningComplete}`), but the symptom is total game lockout.

### Pitfall 5: `vercel --prod` without login/project config

**What goes wrong:** First-time `vercel --prod` run fails if user is not authenticated or if no project is linked.

**Why it happens:** The vercel CLI requires `vercel login` + `vercel link` (or interactive project creation) before `--prod` works.

**How to avoid:** Run `vercel` (without `--prod`) first — it creates the project interactively and gives a preview URL. Verify the preview URL works. Then run `vercel --prod` for the production promotion.

### Pitfall 6: Accessibility audit on Press Start 2P at small sizes

**What goes wrong:** Lighthouse flags text at 6-8px as failing contrast even when color contrast ratio passes AA, because Lighthouse uses font-size to determine "large" vs "small" text thresholds. At 7px, all text is "small" and requires 4.5:1.

**Why it happens:** The pixel font is rendered at 7-10px which is below the 18px threshold for "large text".

**How to avoid:** Ensure foreground/background contrast ratios meet 4.5:1 for all text. The Blue Wave palette `--color-electric: #00BFFF` on `rgba(0,0,0,0.7)` is approximately 5.1:1 — passes. The `#444` pagination text in DialogueBox on dark background is approximately 2.0:1 — fails. Fix: change `#444` to `#888` (~3.5:1 on black) or `var(--color-text-glow)` (#7DF9FF, ~8:1 on black).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| vercel CLI | DEPLOY-01/02/03 | Yes | 50.37.0 | GitHub + Vercel dashboard |
| gh CLI | DEPLOY-01 Path B | Yes | 2.63.2 | Manual GitHub repo creation |
| Node.js | Build | Yes | (Next.js running) | — |
| npm | Package management | Yes | (package.json present) | — |
| Git | Version control | Yes | (repo initialized) | — |
| Git remote | DEPLOY-01 "via git push" | No | — | vercel CLI direct deploy |

**Missing dependencies with fallback:**
- **Git remote**: No GitHub remote configured. Path A (vercel CLI direct) works without it. Path B requires creating a GitHub repo first via `gh repo create` — gh CLI is available.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |
| Baseline | 142 tests, 12 test files, 4 todo — all green |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NARR-01 | Opening dialogue renders, advances on click, transitions to BATTLE | Component | `npm run test -- DialogueBox` | Yes (DialogueBox.test.tsx) |
| NARR-02 | TORC join dialogue — already tested via DialogueBox tests | Component | `npm run test -- DialogueBox` | Yes |
| NARR-03 | TRINETRA join dialogue — already tested | Component | `npm run test -- DialogueBox` | Yes |
| NARR-04 | AEGIS-7 reveal — already tested | Component | `npm run test -- DialogueBox` | Yes |
| NARR-05 | Battle log init message is lore-rich | Unit | `npm run test -- reducer` | Yes (reducer.test.ts) |
| NARR-06 | Closing dialogue renders after AEGIS-7 defeat, transitions to DEMO_COMPLETED | Component | `npm run test -- DemoCompletedScreen` | Yes (DemoCompletedScreen.test.tsx extends) |
| QA-07 | Production build has 0 TypeScript errors, 0 ESLint warnings | Build | `npm run build` | N/A (build script) |
| QA-08 | Lighthouse >= 80 Performance and Accessibility | Manual | Lighthouse CLI or DevTools | Manual only |
| DEPLOY-01/02 | Vercel URL responds 200 | Manual smoke | `curl -s <url>` | Manual only |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run build` (confirms no TypeScript regression)
- **Phase gate:** Full suite green + production build clean + Lighthouse >= 80 manually verified

### Wave 0 Gaps

- [ ] `GameController` has no automated tests — NARR-01/06 state transitions should have at minimum a smoke test. Recommend adding `GameController.test.tsx` covering: (1) initial phase is OPENING_DIALOGUE, (2) after OPENING onComplete, phase is BATTLE, (3) after E4 victory, phase is CLOSING_DIALOGUE, (4) after CLOSING onComplete, phase is DEMO_COMPLETED.
- [ ] `reducer.test.ts` should include one assertion that INIT log message for enemy `CASTING_PROBE_MK1` matches the new lore string (not `'Encontro iniciado.'`).

---

## Security Domain

This is a static client-side browser game with no user input that touches a server, no authentication, no user data stored, and no network requests beyond the initial page load and font asset. ASVS categories V2, V3, V4, V6 do not apply.

V5 (Input Validation) applies only in the trivial sense: all user input (button clicks, keyboard events) is handled by React synthetic events or `addEventListener` — no string input, no SQL, no shell commands. The reducer's phase guard (`if (state.phase !== 'PLAYER_INPUT') return state`) is the only "input validation" the engine needs and it is already implemented.

No security domain work is required for Phase 5.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | DialogueBox `role="dialog"` without `aria-modal="true"` is a Lighthouse Accessibility finding | Lighthouse Assessment | If Lighthouse does not flag this, the fix is still good practice but not required for >=80 |
| A2 | `#444` text on dark background fails 4.5:1 contrast threshold | Lighthouse Assessment | Actual ratio is ~2.0:1 — very likely to fail, but exact Lighthouse score impact is estimated |
| A3 | "NOVA INFILTRAÇÃO" reset should replay opening dialogue | NARR-01 implementation | Owner may prefer skipping opening on reset — ask at plan review if unclear |

---

## Open Questions

1. **Should NOVA INFILTRAÇÃO replay the opening cutscene?**
   - What we know: `handleNewGame` resets to E1; opening cutscene is DEADZONE's first appearance
   - What's unclear: User preference — immersive replay vs. fast retry
   - Recommendation: Default to replaying (set `controllerPhase` to `'OPENING_DIALOGUE'` in `handleNewGame`) — it takes 4 clicks to skip and provides full experience for friends the player shares the URL with

2. **Should ASSETS-05 include a dedicated Signal Null (SKILL_ELECTRIC) visual effect?**
   - What we know: Forge Wall and System Override have dedicated CSS effects; Signal Null only gets the screen flash
   - What's unclear: Whether the scope calls for a third CSS effect or whether flash is sufficient
   - Recommendation: Add a simple `@keyframes electricFlicker` (yellow→cyan hue-rotate on the battle container, 300ms) to distinguish Signal Null from normal attacks — minimal CSS, no new components

3. **ASSETS-06: Text badges vs. pixel icons for status effects**
   - What we know: Current implementation uses text labels (`SHIELD 2T`, `GUARD`, `TERMINUS`) in styled `<span>` elements
   - What's unclear: Whether ASSETS-06 requires actual pixel art icons or whether the text badge approach satisfies the requirement
   - Recommendation: Text badges are appropriate for demo scope. If the owner wants icons, they should be CSS-only (Unicode symbols or SVG data URIs in the `::before` pseudo-element) — no external icon library needed

---

## Sources

### Primary (HIGH confidence — direct codebase audit)

- `src/components/GameController.tsx` — ControllerPhase union, E2/E3/E4 dialogues, handleVictory flow
- `src/components/DialogueBox.tsx` — existing dialogue component capabilities
- `src/components/DemoCompletedScreen.tsx` — existing end screen
- `src/components/BattleScene.tsx` — full battle render pipeline, animation triggers
- `src/engine/reducer.ts` — all battle log messages, INIT case
- `src/engine/enemyAI.ts` — enemy action descriptions
- `src/styles/battle.module.css` — all CSS keyframes, skill effects
- `src/app/page.tsx` — no title screen exists
- `src/app/layout.tsx` — Press Start 2P font loading, metadata
- `src/app/globals.css` — Blue Wave palette CSS vars
- `package.json` — exact dependency versions
- `.planning/STATE.md` — Phase 4 completion status, 142 tests green, 97.4 kB build
- `.planning/PROJECT.md` — character lore, universe context, factional details
- `next.config.mjs` — reactStrictMode: true, no vercel-specific config needed
- `vitest.config.ts` — test environment configuration

### Secondary (HIGH confidence — shell verification)

- `vercel --version` → 50.37.0 [VERIFIED: shell]
- `gh --version` → 2.63.2 [VERIFIED: shell]
- `npm run build` → success, 97.4 kB, 0 errors [VERIFIED: shell]
- `npm run test` → 142 tests green [VERIFIED: shell]
- `git remote -v` → no remotes [VERIFIED: shell]

---

## Metadata

**Confidence breakdown:**
- What's already done (NARR-02/03/04, battle log lore): HIGH — directly read from source files
- What needs building (NARR-01, NARR-06): HIGH — clear pattern in GameController established over 4 phases
- Vercel deploy path: HIGH — vercel CLI present, Next.js 14 is standard deploy target
- Lighthouse score estimate: MEDIUM — identified specific likely failures but actual score requires measurement
- Lore dialogue content: HIGH (faithful to PROJECT.md lore) — character voices, faction names, setting verified against PROJECT.md

**Research date:** 2026-04-26
**Valid until:** 2026-06-01 (stable stack, no fast-moving dependencies)
