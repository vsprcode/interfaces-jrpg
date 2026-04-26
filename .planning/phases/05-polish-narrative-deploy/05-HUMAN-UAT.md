---
phase: 5
slug: polish-narrative-deploy
type: human-uat
created: 2026-04-26
---

# Phase 5 — Human UAT Checklist

> Run against the production build: `npm run build && npm run start` (localhost:3000) or the live Vercel URL.
> All items must be checked before marking Phase 5 complete.

---

## Title Screen

- [ ] Page loads showing `[In]terfaces` title header with electric blue glow above the game container
- [ ] Subtitle `2042 — Era Pré-Transumana` is visible below the title
- [ ] No layout overflow or horizontal scroll on a standard 1280px viewport

---

## Opening Cutscene (NARR-01)

- [ ] Page loads showing the DialogueBox (not the battle screen) — first line: `SISTEMA: "Arcologia Casting-7. São Paulo. 2042..."`
- [ ] Clicking or pressing Space advances through 4 lines total (2 SISTEMA + 2 DEADZONE)
- [ ] After the 4th line, Encounter 1 battle begins (no extra blank screen)
- [ ] No console errors during cutscene playback

---

## Encounter Init Messages (NARR-05)

- [ ] E1 battle log first line: `DEADZONE infiltra o Corredor 7-A. Sensores detectam presença inimiga.`
- [ ] E2 battle log first line: `Docas de Carga. Dois Enforcers em patrulha. TORC assume posição de flanco.`
- [ ] E3 battle log first line: `Sala de Servidores. Três Patrol Bots em rotação automática. TRINETRA calibra o Override.`
- [ ] E4 battle log first line: `Câmara de Comando. AEGIS-7 online. Protocolo de eliminação pesado ativado.`

---

## Between-Encounter Dialogues (NARR-02, NARR-03, NARR-04)

- [ ] After E1 victory: TORC intro dialogue appears (3 lines) before E2 begins
- [ ] After E2 victory: TRINETRA intro dialogue appears (3 lines) before E3 begins
- [ ] After E3 victory: AEGIS-7 reveal dialogue appears (3 lines) before E4 begins

---

## Closing Cutscene (NARR-06)

- [ ] After defeating AEGIS-7: closing dialogue appears (4 lines: SISTEMA + TRINETRA + DEADZONE + SISTEMA)
- [ ] Final SISTEMA line reads: `>>> DEMO ENCERRADA. PRÓXIMO CAPÍTULO EM BREVE. <<<`
- [ ] After clicking through all 4 closing lines: DemoCompletedScreen appears
- [ ] DemoCompletedScreen shows `Próximo capítulo em breve...` tagline above the NOVA INFILTRACAO button

---

## NOVA INFILTRACAO Reset

- [ ] Clicking NOVA INFILTRACAO returns to the opening cutscene (not directly to E1 battle)
- [ ] Clicking through the opening cutscene again starts a fresh E1 with full HP/EN

---

## Build & Console (QA-07)

- [ ] `npm run build` exits 0 (no TypeScript errors, no ESLint violations)
- [ ] Browser DevTools console shows 0 errors and 0 warnings during full playthrough in dev mode
- [ ] React Strict Mode double-fire does not cause visible UI glitches or doubled log entries

---

## Accessibility Spot-Check (QA-08)

- [ ] DialogueBox pagination text (`1/4 ▶ CLIQUE OU ESPAÇO`) is readable (not dark grey on dark bg)
- [ ] Keyboard navigation: Space and Enter advance dialogue correctly
- [ ] Run Lighthouse on `localhost:3000` (production build): Performance >= 80, Accessibility >= 80

---

## Vercel Deploy (DEPLOY-01, DEPLOY-02)

- [ ] Public Vercel URL loads the game (not 404 or build error)
- [ ] E1 battle is playable from the Vercel URL
- [ ] AEGIS-7 OVERDRIVE triggers correctly in production
- [ ] DemoCompletedScreen appears after defeating AEGIS-7 in production
- [ ] README.md demo link points to the actual Vercel URL (not placeholder)

---

## Sign-off

**Date:** ___________
**Vercel URL:** ___________
**Lighthouse Performance:** ___ / 100
**Lighthouse Accessibility:** ___ / 100
**Tester:** ___________
