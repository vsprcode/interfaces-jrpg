# [In]terfaces JRPG — Demo

## What This Is

Uma demo jogável de JRPG por turno ambientada no universo [In]terfaces (2042, Era Pré-Transumana). O jogador controla agentes da resistência analógica infiltrando uma Arcologia da Casting Syndicate, navegando por 4 encontros progressivos até o confronto final com AEGIS-7, a unidade de enforcement pesado da corporação Casting.

O jogo é fiel ao tom do [In]terfaces: sem heroísmo tradicional — apenas sobrevivência e resistência estrutural num sistema projetado para controlar.

## Core Value

Entregar uma experiência JRPG completa e polida em browser (4 batalhas + boss) que sirva como vitrine do universo [In]terfaces para leitores/players que nunca tiveram contato com o worldbuilding.

## Universo e Lore

**Ambientação:** Arcologia Casting-7, São Paulo, 2042. Corredores de aço revestidos de telas de monitoramento. Neons azuis elétricos. Chuva ácida externamente. O Interfaces Agreement em vigor: seu dispositivo = sua identidade.

**Facções envolvidas:**
- **The Casting Syndicate** — corporação dos Implantados (neural). Controla a Arcologia-7.
- **Agentes da resistência** — Portadores, Ornados e Visionários infiltrados.

### Personagens Jogáveis

| Código | Nome | Classe | HP | EN | ATK | DEF | SPD | Habilidade |
|--------|------|--------|----|----|-----|-----|-----|-----------|
| DEADZONE | Jack Rourke | Ghost/Carrier | 95 | 25 | 22 | 10 | 18 | [Signal Null] — dano elétrico que ignora 30% DEF inimiga. Custo: 8 EN |
| TORC | Saorla Byrne | Striker/Adorned | 130 | 20 | 18 | 20 | 12 | [Forge Wall] — aumenta DEF do grupo em +8 por 2 turnos. Custo: 6 EN |
| TRINETRA | Animesh Rao | Seer/Visionary | 85 | 35 | 15 | 12 | 15 | [System Override] — cura 30 HP de um aliado OU remove status negativo. Custo: 10 EN |

### Inimigos

| Nome | Fase | HP | ATK | DEF | SPD | Comportamento |
|------|------|----|-----|-----|-----|---------------|
| Casting Probe MK-I | 1 | 40 | 14 | 6 | 10 | Ataca sempre |
| Networker Enforcer | 2 (x2) | 55 | 16 | 8 | 11 | Ataca o menor HP |
| Casting Patrol Bot | 3 (x3) | 45 | 13 | 7 | 9 | Ataca aleatório |
| AEGIS-7 (Boss) | 4 | 200 | 28 | 15 | 8 | OVERDRIVE quando HP < 100 |

**Mecânica OVERDRIVE (AEGIS-7):**
Quando HP cai abaixo de 100, AEGIS-7 anuncia "CARREGANDO ATAQUE TERMINUS". No turno seguinte, qualquer personagem que não usar [DEFENDER] recebe dano letal (999). Jogador DEVE defender ou Game Over.

## Stack Técnica

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + variáveis CSS custom (paleta Blue Wave)
- **Google Fonts: "Press Start 2P"** — pixel font
- **CSS Animations** — flash de tela, tremor, partículas de pixel
- **React state machine** — battle engine puro (sem libs externas)
- **Vercel** — deploy

## Paleta Blue Wave

```css
--blue-electric: #00BFFF
--blue-cobalt:   #0047AB
--cyan-neon:     #00FFFF
--shadow-cold:   #0A0A1A
--bg-dark:       #050510
--text-glow:     #7DF9FF
```

## Fluxo da Demo

```
INTRO → [FASE 1: DEADZONE solo] → [FASE 2: +TORC] → [FASE 3: +TRINETRA] → [FASE 4: BOSS AEGIS-7] → DEMO COMPLETED
```

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Jogo roda em browser sem instalação (Next.js + Vercel)
- [ ] 4 encontros completos e jogáveis do início ao fim
- [ ] Sistema de menus por turno funcional ([ATACAR] [HABILIDADE] [DEFENDER] [ITEM])
- [ ] Habilidades únicas para cada personagem com custo de EN
- [ ] IA inimiga básica com comportamentos diferenciados
- [ ] Mecânica OVERDRIVE do boss (aviso + death instantânea se não defender)
- [ ] Status table em Markdown/tabela após cada turno
- [ ] Tela de Game Over e DEMO COMPLETED
- [ ] Estética pixel art "Blue Wave" (neons azuis, fonte Press Start 2P)
- [ ] Animações de batalha (flash, tremor de câmera, efeitos de habilidade)
- [ ] Narração cinematográfica em cada encontro
- [ ] Personagens do universo [In]terfaces (DEADZONE, TORC, TRINETRA)

### Out of Scope

- Sistema de save/load — demo linear, sem necessidade
- Inventário expansível — apenas Nano-Med como item consumível
- Mapa/overworld — demo vai direto às batalhas
- Múltiplas rotas narrativas — fluxo linear obrigatório
- Multiplayer — single-player apenas
- Mobile otimizado — foco em desktop (keyboard navigation)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js + React (sem Phaser/Unity) | Web-first, zero instalação, deploy rápido no Vercel | — Pending |
| CSS animations (sem sprite sheets externos) | Evita assets pesados; estética pixel art via CSS é suficiente para demo | — Pending |
| Battle engine em React state (sem lib) | Controle total, sem overhead, demo simples não precisa de game engine completa | — Pending |
| Lore [In]terfaces adaptado (não original) | Aproveita worldbuilding existente, dá profundidade sem criar do zero | ✓ Confirmado |

## Evolution

Este documento evolui a cada transição de fase.

**Após cada fase** (via `/gsd-transition`):
1. Requirements validados? → Mover para Validated
2. Requirements invalidados? → Mover para Out of Scope com motivo
3. Novos requirements? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions

---
*Last updated: 2026-04-25 — inicialização do projeto*
