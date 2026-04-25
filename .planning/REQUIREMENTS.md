# Requirements — [In]terfaces JRPG Demo

**Project:** [In]terfaces JRPG — Browser turn-based demo
**Version:** v1 (MVP)
**Last updated:** 2026-04-25

---

## v1 Requirements

### Foundation (FOUND)

- [ ] **FOUND-01**: Next.js 14 com App Router roda em `localhost:3000` com TypeScript strict habilitado
- [ ] **FOUND-02**: Página de batalha marcada como `"use client"` (toda lógica de jogo é client-side)
- [ ] **FOUND-03**: Tailwind v4 (com fallback para v3 se `lightningcss` falhar) configurado com paleta Blue Wave em `@theme`
- [ ] **FOUND-04**: Fonte "Press Start 2P" carregada via `next/font/google` com `display: 'swap'` e `variable: '--font-pixel'`
- [ ] **FOUND-05**: Estrutura de pastas criada conforme PROJECT.md (`src/app`, `src/components`, `src/engine`, `src/data`, `src/styles`)
- [ ] **FOUND-06**: Vitest 2 configurado para testes do engine (puro TypeScript, sem DOM)
- [ ] **FOUND-07**: Repositório git inicializado com `.gitignore` adequado para Next.js
- [ ] **FOUND-08**: Aplicação compila e faz build de produção (`next build`) sem erros

### Battle Engine (ENGINE)

- [ ] **ENGINE-01**: Tipos TypeScript definidos para `Character`, `Enemy`, `BattleState`, `Action`, `StatusEffect` em `src/engine/types.ts`
- [ ] **ENGINE-02**: Pure function `calculateDamage(attacker, target, modifiers)` retorna `max(1, ATK - DEF)` — testada com Vitest
- [ ] **ENGINE-03**: Pure function `buildTurnQueue(combatants)` ordena por SPD desc — snapshot no início da round
- [ ] **ENGINE-04**: `useReducer` no `BattleScene` com phases: `INIT | PLAYER_INPUT | RESOLVING | ENEMY_TURN | VICTORY | GAME_OVER`
- [ ] **ENGINE-05**: Phase guard no reducer (`if (state.phase !== 'PLAYER_INPUT') return state`) bloqueia ações fora de turno
- [ ] **ENGINE-06**: Atualização de HP/EN usa `.map()` com spread por id (não mutação) — verificado por testes
- [ ] **ENGINE-07**: Action `[ATACAR]` aplica dano físico e avança para `RESOLVING`
- [ ] **ENGINE-08**: Action `[DEFENDER]` reduz dano em 50% no próximo turno e recupera 5 EN
- [ ] **ENGINE-09**: Action `[ITEM]` (Nano-Med) cura 30 HP de um aliado e consome 1 item do inventário
- [ ] **ENGINE-10**: Inventário simples `items: { nanoMed: number }` no GameState com `USE_ITEM` action

### Skills System (SKILL)

- [ ] **SKILL-01**: `[Signal Null]` (DEADZONE, custo 8 EN) aplica dano elétrico ignorando 30% da DEF inimiga
- [ ] **SKILL-02**: `[Forge Wall]` (TORC, custo 6 EN) aplica status `SHIELD` (+8 DEF) em todo o grupo por 2 turnos
- [ ] **SKILL-03**: `[System Override]` (TRINETRA, custo 10 EN) cura 30 HP de um aliado OU remove status negativo (alvo escolhe)
- [ ] **SKILL-04**: Validação de EN antes de executar habilidade — botão desabilitado se EN insuficiente
- [ ] **SKILL-05**: Status effects aplicados decrementam corretamente a cada turno e expiram

### Enemy AI (AI)

- [ ] **AI-01**: AI implementada como `Record<EnemyBehaviorType, AIFn>` em `src/engine/enemyAI.ts`
- [ ] **AI-02**: Behavior `always_attack` (Casting Probe MK-I) — sempre ataca o jogador disponível
- [ ] **AI-03**: Behavior `target_lowest_hp` (Networker Enforcer) — escolhe aliado com menor HP atual
- [ ] **AI-04**: Behavior `random_target` (Casting Patrol Bot) — escolhe alvo aleatório entre vivos
- [ ] **AI-05**: AI lê estado vivo via `gameStateRef` (não closure) — previne stale state

### Encounters (ENC)

- [ ] **ENC-01**: Encontro 1 — DEADZONE solo vs. 1 Casting Probe MK-I (tutorial, sem habilidades obrigatórias)
- [ ] **ENC-02**: Encontro 2 — DEADZONE + TORC vs. 2 Networker Enforcers (introduz tank/skill)
- [ ] **ENC-03**: Encontro 3 — Trio completo vs. 3 Casting Patrol Bots (gerenciamento de recursos, jogador testa DEFENDER)
- [ ] **ENC-04**: Encontro 4 (BOSS) — Trio vs. AEGIS-7 (aplicação obrigatória da mecânica OVERDRIVE)
- [ ] **ENC-05**: HP persiste entre encontros (não restaura); EN reseta para max ao iniciar próximo encontro
- [ ] **ENC-06**: Tela interstitial "ENCOUNTER COMPLETE" entre encontros mostra status do grupo e narrativa

### OVERDRIVE Mechanic (OVERDRIVE)

- [ ] **OVERDRIVE-01**: AEGIS-7 entra em estado `OVERDRIVE_WARNING` quando HP < 100
- [ ] **OVERDRIVE-02**: Banner não-dispensável "TERMINUS // CARREGANDO" aparece com aviso explícito ("USE [DEFENDER] OU SERÁ ELIMINADO")
- [ ] **OVERDRIVE-03**: Botão `[DEFENDER]` recebe destaque visual (cyan glow pulsante) durante o turno OVERDRIVE
- [ ] **OVERDRIVE-04**: TERMINUS aplica 999 dano em todos que NÃO usaram DEFENDER no turno anterior
- [ ] **OVERDRIVE-05**: Edge case — se todos os personagens morreram antes do warning, transição direta para GAME_OVER
- [ ] **OVERDRIVE-06**: Edge case — personagem morto não pode defender e não recebe dano (já está fora)
- [ ] **OVERDRIVE-07**: Edge case — DEFENDER funciona em OVERDRIVE mesmo se EN = 0 (não consome EN nesse contexto)
- [ ] **OVERDRIVE-08**: AEGIS-7 não pode entrar em OVERDRIVE no mesmo turno em que anuncia (mínimo 1 turno de aviso)

### UI Components (UI)

- [ ] **UI-01**: `BattleScreen` — layout 16:9 com áreas inimigos (topo), aliados (meio), HUD (rodapé)
- [ ] **UI-02**: `CommandMenu` — 4 botões: ATACAR | HABILIDADE | DEFENDER | ITEM, navegáveis por teclado e mouse
- [ ] **UI-03**: `StatusTable` — exibe HP/EN de todos os combatentes (formato Markdown table requirement do prompt original)
- [ ] **UI-04**: `CharacterSprite` — renderiza sprite do personagem com estados (idle, attack, hurt, defend)
- [ ] **UI-05**: `EnemySprite` — renderiza inimigo com estados (idle, attack, hurt, defeat)
- [ ] **UI-06**: `DialogueBox` — caixa de diálogo cinemática para narração antes/durante/após batalhas
- [ ] **UI-07**: `BattleLog` — feed de ações com texto narrativo lore-rich (ordem: mais recente embaixo)
- [ ] **UI-08**: `TurnOrderIndicator` — mostra ordem dos próximos turnos baseado em SPD
- [ ] **UI-09**: Floating damage numbers animam para cima e fade-out (CSS @keyframes)
- [ ] **UI-10**: HP/EN bars animam suavemente quando valor muda (não snap instantâneo)

### Visual Polish (VISUAL)

- [ ] **VISUAL-01**: Paleta Blue Wave aplicada (variáveis CSS em `:root`, sem cores hardcoded)
- [ ] **VISUAL-02**: `image-rendering: pixelated` em todos os sprites
- [ ] **VISUAL-03**: CSS keyframe animation `screen-flash` para acertos críticos (white→transparent 200ms)
- [ ] **VISUAL-04**: CSS keyframe animation `screen-shake` para impactos pesados (translate ±4px 300ms)
- [ ] **VISUAL-05**: CSS keyframe particle effects para 3 habilidades (Signal Null, Forge Wall, System Override)
- [ ] **VISUAL-06**: OVERDRIVE warning overlay (magenta border pulsante full-screen) durante turno OVERDRIVE
- [ ] **VISUAL-07**: Todas animações usam `transform`/`opacity` (GPU compositor — sem layout thrashing)

### Narrative (NARR)

- [ ] **NARR-01**: Cutscene de abertura — DEADZONE sob chuva ácida no corredor da arcologia (texto + background)
- [ ] **NARR-02**: Diálogo de junção do TORC antes do Encontro 2
- [ ] **NARR-03**: Diálogo de junção do TRINETRA antes do Encontro 3
- [ ] **NARR-04**: Cutscene de revelação do AEGIS-7 antes do Encontro 4
- [ ] **NARR-05**: Battle log inclui linhas lore-rich (não apenas "DEADZONE atacou — 14 dano"; usar "DEADZONE encontra brecha no firewall — 14 de dano")
- [ ] **NARR-06**: Cutscene final após derrotar AEGIS-7 — gancho narrativo "Próximo capítulo em breve"

### End States (END)

- [ ] **END-01**: Tela `DEMO COMPLETED` com ASCII art estilizada quando AEGIS-7 derrotado
- [ ] **END-02**: Tela `GAME OVER` quando todos personagens HP = 0
- [ ] **END-03**: Reset usando padrão `key` prop no `<BattleEngine>` (destrói e recria estado completo)
- [ ] **END-04**: Botão "TENTAR NOVAMENTE" em Game Over reinicia o encontro atual (não a demo inteira)
- [ ] **END-05**: Botão "NOVA INFILTRAÇÃO" em DEMO COMPLETED retorna ao Title Screen

### Visual Assets (ASSETS)

- [ ] **ASSETS-01**: Sprites de batalha + portraits dos 3 personagens (DEADZONE, TORC, TRINETRA)
- [ ] **ASSETS-02**: Sprites dos 4 inimigos (Probe MK-I, Networker Enforcer, Patrol Bot, AEGIS-7)
- [ ] **ASSETS-03**: 4 backgrounds (corridor, loading dock, server room, command chamber)
- [ ] **ASSETS-04**: UI frames (HUD, menu, dialogue box, title logo)
- [ ] **ASSETS-05**: 3 effect sprite sheets (Signal Null, Forge Wall, System Override) + OVERDRIVE warning overlay
- [ ] **ASSETS-06**: Ícones (Nano-Med, 3 habilidades, status effects)
- [ ] **ASSETS-07**: Fallback CSS-only para sprites caso geração de IA falhe (silhuetas geométricas + glow)

### Quality & Pitfall Prevention (QA)

- [ ] **QA-01**: Todos `useEffect` com timer têm cleanup com `clearTimeout` (Strict Mode safe)
- [ ] **QA-02**: `gameStateRef` mirror para todas leituras de estado dentro de callbacks deferidos
- [ ] **QA-03**: Reducer cases usam `.map()` com spread (não index assignment) — testado com mutação detection
- [ ] **QA-04**: `Math.random()` apenas dentro de `useEffect` ou actions do reducer (não no render)
- [ ] **QA-05**: Phase guard testado: dispatch fora de PLAYER_INPUT é no-op
- [ ] **QA-06**: Suite Vitest cobre damage calc, turn queue, AI behaviors, OVERDRIVE edge cases
- [ ] **QA-07**: Build de produção testado em modo Strict (sem warnings)
- [ ] **QA-08**: Lighthouse score >= 80 em Performance e Accessibility

### Deploy (DEPLOY)

- [ ] **DEPLOY-01**: Aplicação deployada no Vercel via `git push`
- [ ] **DEPLOY-02**: URL pública acessível e funcional em produção
- [ ] **DEPLOY-03**: Assets servidos de `/public` com cache headers adequados
- [ ] **DEPLOY-04**: README.md com instruções de instalação local e link para demo

---

## v2 Requirements (deferred — out of v1)

- Sistema de save/load (não necessário para demo linear)
- Multiple difficulty modes (apenas modo standard no v1)
- DISRUPTED status effect adicional para Signal Null em criticais (avaliado durante Phase 3 se houver tempo)
- Audio/SFX (decisão pendente — confirmar com owner se entra em v1)
- Mobile responsive layout (foco em desktop no v1)

---

## Out of Scope

- **Leveling/XP** — demo linear de 4 batalhas não justifica o sistema
- **Equipamento/gear** — overhead de UI sem payoff em 4 batalhas
- **Elemental type chart** — adiciona complexidade tática sem ROI no escopo
- **Item drops aleatórios** — Nano-Med é o único item; nada a dropar
- **Branching encounters** — fluxo linear é parte do design
- **Skill cinematics full-screen** — efeitos de partícula CSS são suficientes
- **Multiplayer** — single player apenas
- **World map / overworld** — demo vai direto às batalhas, sem exploração
- **Sistema de diálogo ramificado** — apenas cutscenes lineares

---

## Traceability

(A ser preenchido pelo gsd-roadmapper após criação do ROADMAP)

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| FOUND-01 | TBD | TBD | pending |
| ... | ... | ... | ... |

---

*Total: 76 requirements across 12 categories.*
*Last updated: 2026-04-25 — initialized after research synthesis.*
