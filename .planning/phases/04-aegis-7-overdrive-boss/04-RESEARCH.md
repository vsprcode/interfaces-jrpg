# Phase 4: AEGIS-7 + OVERDRIVE Boss — Research

**Researched:** 2026-04-26
**Domain:** Boss state machine extension (OVERDRIVE_WARNING/RESOLVING), TERMINUS mechanic, end-screen wiring
**Confidence:** HIGH — baseado exclusivamente em leitura direta do código existente nas Fases 1-3

---

## Summary

A Fase 4 é uma extensão cirúrgica da máquina de estados existente, não uma reescrita. O reducer (`src/engine/reducer.ts`) já tem toda a infraestrutura necessária: phase guard, ACTION_RESOLVED, ENEMY_ACTION, NEXT_TURN com WR-01/02. O que falta é: (1) dois novos valores de `BattlePhase`, (2) a lógica `OVERDRIVE_BOSS` no `enemyAI.ts` em vez do stub atual, (3) tratamento dos novos phases no reducer para PLAYER_ACTION (com desvio especial de DEFENDER) e ENEMY_ACTION (para TERMINUS), (4) o Encounter 4 em `encounters.ts`, a instância AEGIS_7 em `enemies.ts`, e (5) os componentes de UI — overlay OVERDRIVE, `DemoCompletedScreen`, e os backgrounds/assets restantes.

A mecânica OVERDRIVE é um two-phase telegraph: `OVERDRIVE_WARNING` (turno do jogador de preparar DEFENDER) → `OVERDRIVE_RESOLVING` (turno do AEGIS-7 disparar TERMINUS em quem não defendeu). O GameController já existe e suporta a cadeia de encontros; basta adicionar o case do encounterIndex 3 que mostra `DemoCompletedScreen` em vez de `EncounterCompleteScreen`.

**Recomendação primária:** Estender `BattlePhase` com `OVERDRIVE_WARNING | OVERDRIVE_RESOLVING`, adaptar o reducer para rotear PLAYER_ACTION dentro de OVERDRIVE_WARNING para `RESOLVING` (não `PLAYER_INPUT` normal) mantendo o DEFENDER funcional mesmo com EN=0, e implementar TERMINUS no `OVERDRIVE_BOSS` AI handler como hpDelta de -999 em todos os `!isDefending && !isDefeated`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENC-04 | Encontro 4 (BOSS) — Trio vs. AEGIS-7 com mecânica OVERDRIVE | Adicionar `ENCOUNTER_CONFIGS[3]` em `encounters.ts` com `AEGIS_7` + `command_chamber` bg |
| OVERDRIVE-01 | AEGIS-7 entra em `OVERDRIVE_WARNING` quando HP < 100 | `OVERDRIVE_BOSS` AI verifica `enemy.hp < 100` e retorna `animationType: 'OVERDRIVE_WARNING'` antes de atacar normalmente |
| OVERDRIVE-02 | Banner não-dispensável "TERMINUS // CARREGANDO" com aviso | Overlay CSS em BattleScene quando `state.phase === 'OVERDRIVE_WARNING'`; pointer-events bloqueiam dismissal acidental |
| OVERDRIVE-03 | Botão `[DEFENDER]` recebe destaque visual cyan glow durante OVERDRIVE | ActionMenu recebe `isOverdrivePhase: boolean`; aplica classe CSS pulsante quando `true` |
| OVERDRIVE-04 | TERMINUS aplica 999 dano em todos que NÃO usaram DEFENDER | `OVERDRIVE_BOSS` AI em `OVERDRIVE_RESOLVING` itera `state.party.filter(c => !c.isDefeated && !c.isDefending)` com hpDelta -999 |
| OVERDRIVE-05 | Edge case — party toda morta antes do warning → GAME_OVER direto | Já tratado pelo CHECK_END_CONDITIONS e pela guarda de `validTargets.length === 0` no AI |
| OVERDRIVE-06 | Edge case — personagem morto não pode defender e não recebe dano | TERMINUS filtra `!c.isDefeated`; personagem morto não está na lista de alvos |
| OVERDRIVE-07 | Edge case — DEFENDER funciona em OVERDRIVE mesmo se EN=0 | No reducer, PLAYER_ACTION/DEFEND não tem EN check; precisa verificar que a phase guard aceita `OVERDRIVE_WARNING` além de `PLAYER_INPUT` |
| OVERDRIVE-08 | AEGIS-7 não pode anunciar + disparar OVERDRIVE no mesmo turno | `OVERDRIVE_BOSS` AI: quando `phase === 'ENEMY_TURN'` e HP < 100, PRIMEIRO retorna `OVERDRIVE_WARNING` (anúncio); TERMINUS só dispara quando `phase === 'OVERDRIVE_RESOLVING'` |
| VISUAL-06 | OVERDRIVE warning overlay — magenta border pulsante full-screen | `@keyframes overdrivePulse` em `battle.module.css`; `overdriveOverlayA/B` para restart |
| END-01 | Tela `DEMO COMPLETED` com ASCII art estilizada quando AEGIS-7 derrotado | Novo componente `DemoCompletedScreen`; GameController renderiza quando encounterIndex === 3 + VICTORY |
| END-05 | Botão "NOVA INFILTRAÇÃO" retorna ao Title Screen | `DemoCompletedScreen` recebe `onNewGame`; GameController passa callback que reseta `encounterIndex` + `battleKey` via key prop |
| ASSETS-02 (AEGIS-7) | Sprite do boss | `SpriteFallback` CSS silhouette para AEGIS_7; `image-rendering: pixelated` |
| ASSETS-03 (command_chamber) | Background da sala do boss | Novo `.bg_command_chamber` em `battle.module.css` — gradiente magenta/roxo escuro |
| ASSETS-04 | UI frames — HUD, menu, dialogue box, title frames | Refinamentos visuais do HUD e menu existentes para o boss fight |
| ASSETS-05 | FX sprite sheets + OVERDRIVE overlay | `overdriveOverlay` CSS class + `@keyframes overdrivePulse` em `battle.module.css` |
| QA-06 | Suite Vitest cobre edge cases OVERDRIVE | Testes em `reducer.test.ts` e `enemyAI.test.ts` cobrindo OVERDRIVE-01 a OVERDRIVE-08 |
</phase_requirements>

---

## Standard Stack

### Core (sem mudanças — stack travada)

| Biblioteca | Versão | Propósito | Fonte |
|------------|--------|-----------|-------|
| Next.js | 14.x (App Router) | Shell da aplicação | [VERIFIED: CLAUDE.md] |
| TypeScript | 5.x strict | Tipos seguros para BattlePhase extension | [VERIFIED: CLAUDE.md] |
| React | 18.x | useReducer, useEffect, useState, useRef | [VERIFIED: src/components/BattleScene.tsx] |
| Vitest | 2.x | Testes unitários do engine e edge cases | [VERIFIED: CLAUDE.md + .planning/config.json] |
| CSS Modules | built-in | Keyframes para OVERDRIVE overlay | [VERIFIED: src/styles/battle.module.css] |
| Tailwind v4 | 4.x | Utilities de layout e spacing | [VERIFIED: CLAUDE.md] |

**Sem novas dependências.** Toda a Fase 4 opera com o stack já instalado.

---

## Architecture Patterns

### Estrutura de arquivos — Fase 4

```
src/
├── engine/
│   ├── types.ts          — Estender BattlePhase + AnimationType (OVERDRIVE_WARNING | OVERDRIVE_RESOLVING)
│   ├── reducer.ts        — Adicionar cases OVERDRIVE_WARNING na PLAYER_ACTION guard + TERMINUS no ACTION_RESOLVED
│   └── enemyAI.ts        — Implementar OVERDRIVE_BOSS (substituir stub)
├── data/
│   ├── enemies.ts        — Adicionar AEGIS_7 instance (HP 200, ATK 28, DEF 15, SPD 8)
│   └── encounters.ts     — Adicionar ENCOUNTER_CONFIGS[3] (command_chamber, trio vs AEGIS_7)
├── components/
│   ├── BattleScene.tsx   — Adicionar OVERDRIVE overlay, overdriveVariant state, phase routing
│   ├── ActionMenu.tsx    — Aceitar isOverdrivePhase prop; DEFENDER styled diferente em OVERDRIVE
│   ├── GameController.tsx — Adicionar case encounterIndex === 3 → DemoCompletedScreen
│   └── DemoCompletedScreen.tsx  — NOVO componente (END-01, END-05)
└── styles/
    └── battle.module.css — Adicionar bg_command_chamber, overdriveOverlayA/B, overdriveDefenderGlow
```

---

### Padrão 1: Extensão de BattlePhase (OVERDRIVE_WARNING + OVERDRIVE_RESOLVING)

**O que é:** Dois novos valores adicionados ao union discriminado `BattlePhase`. O TypeScript `never` exhaustiveness check no `default` case do reducer vai compilar erro se algum case novo não for tratado — isso é SAFETY, não bug.

**Onde alterar:** `src/engine/types.ts` linha 73-79.

**Código atual:**
```typescript
// [VERIFIED: src/engine/types.ts:73-79]
export type BattlePhase =
  | 'INIT'
  | 'PLAYER_INPUT'
  | 'RESOLVING'
  | 'ENEMY_TURN'
  | 'VICTORY'
  | 'GAME_OVER';
```

**Código após extensão:**
```typescript
// [VERIFIED: src/engine/types.ts — extensão fase 4]
export type BattlePhase =
  | 'INIT'
  | 'PLAYER_INPUT'
  | 'RESOLVING'
  | 'ENEMY_TURN'
  | 'OVERDRIVE_WARNING'   // AEGIS-7 anunciou TERMINUS — turno do jogador escolher DEFENDER
  | 'OVERDRIVE_RESOLVING' // AEGIS-7 dispara TERMINUS — reducer aplica 999 dano
  | 'VICTORY'
  | 'GAME_OVER';
```

**Impacto em cascata:** Qualquer arquivo que faz `switch` ou comparação direta com `BattlePhase` vai precisar de update:
- `src/components/ActionMenu.tsx` linha 34: `const isInputPhase = phase === 'PLAYER_INPUT'` — deve incluir `OVERDRIVE_WARNING` para habilitar DEFENDER
- `src/components/BattleScene.tsx` — `useEffect` para `ENEMY_TURN` não precisa mudar; o novo overlay ativa quando `state.phase === 'OVERDRIVE_WARNING'`

---

### Padrão 2: Phase Guard Duplo no reducer — PLAYER_ACTION

**Problema:** O phase guard atual bloqueia PLAYER_ACTION exceto em `PLAYER_INPUT`:
```typescript
// [VERIFIED: src/engine/reducer.ts:47-49]
if (state.phase !== 'PLAYER_INPUT') {
  return state;
}
```

**Solução:** Expandir o guard para aceitar `OVERDRIVE_WARNING` como phase válida para input do jogador:
```typescript
// Fase 4 — guard expandido
if (state.phase !== 'PLAYER_INPUT' && state.phase !== 'OVERDRIVE_WARNING') {
  return state;
}
```

**CRÍTICO — OVERDRIVE-07:** Dentro de `OVERDRIVE_WARNING`, o case `DEFEND` **NÃO deve checar EN**. O reducer atual para DEFEND nunca checou EN (confirmado linha 82: `// Pitfall D: DEFEND has NO EN check — always available`). Isso já está correto. Apenas garantir que o guard expandido deixa passar.

**CRÍTICO — OVERDRIVE-08 (pitfall central):** Quando o jogador age em `OVERDRIVE_WARNING`, a próxima phase após `RESOLVING` deve ser `OVERDRIVE_RESOLVING` (não `PLAYER_INPUT` ou `ENEMY_TURN` normal). Isso requer uma flag no estado ou verificação de que AEGIS-7 tem o status `OVERDRIVE_CHARGE` ativo.

**Duas abordagens:**

| Abordagem | Como | Prós | Contras |
|-----------|------|------|---------|
| **A — Flag no estado** | `overdrivePending: boolean` em `BattleState` | Simples de verificar no reducer | Mais estado para manter sincronizado |
| **B — Status do inimigo** | Verificar `AEGIS_7.statusEffects.some(e => e.type === 'OVERDRIVE_CHARGE')` | Usa infra de statusEffects já existente | Mais verbose na checagem |

**Recomendação: Abordagem A** — adicionar `overdrivePending: boolean` em `BattleState`. É mais explícito, mais fácil de testar, e evita dependência na lista de status effects de um inimigo específico. O `ACTION_RESOLVED` checa `state.overdrivePending` ao avançar de `RESOLVING` → decide se vai para `ENEMY_TURN` (normal) ou `OVERDRIVE_RESOLVING`.

**Código conceitual para ACTION_RESOLVED após a expansão:**
```typescript
// [ASSUMED — padrão derivado de src/engine/reducer.ts:322-352]
// Ao final do ACTION_RESOLVED, em vez de sempre derivar nextPhase do kind da fila:
if (state.overdrivePending && nextEntry?.kind === 'enemy') {
  nextPhase = 'OVERDRIVE_RESOLVING';
} else {
  nextPhase = nextEntry?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
}
```

---

### Padrão 3: OVERDRIVE_BOSS AI — Dois modos em um handler

**Stub atual:**
```typescript
// [VERIFIED: src/engine/enemyAI.ts:88]
OVERDRIVE_BOSS: (enemy, state) => stubAction(enemy, state, 'overdrive_boss stub'),
```

**Lógica completa para substituir o stub:**

```typescript
// [ASSUMED — padrão derivado dos demais behaviors existentes]
OVERDRIVE_BOSS: (enemy, state) => {
  const validTargets = state.party.filter(c => !c.isDefeated);
  if (validTargets.length === 0) {
    return { actorId: enemy.id, description: '(no targets)', animationType: 'ATTACK' };
  }

  // Modo 1: fase OVERDRIVE_RESOLVING — dispara TERMINUS
  // Qualquer personagem vivo que não esteja defendendo recebe 999 dano
  if (state.phase === 'OVERDRIVE_RESOLVING') {
    const terminusTargets = validTargets.filter(c => !c.isDefending);
    return {
      actorId: enemy.id,
      description: 'AEGIS-7 dispara TERMINUS — protocolo de eliminação em cascata',
      hpDelta: terminusTargets.map(c => ({ targetId: c.id, amount: -999 })),
      animationType: 'OVERDRIVE_TERMINUS',
    };
  }

  // Modo 2: fase ENEMY_TURN — ataque normal OU anúncio OVERDRIVE_WARNING (HP < 100)
  // OVERDRIVE-08: não pode anunciar e disparar no mesmo turno
  if (enemy.hp < 100 && !state.overdrivePending) {
    // Primeiro turno abaixo de 100 HP — ANUNCIA; não ataca
    return {
      actorId: enemy.id,
      description: 'AEGIS-7 SOBRECARREGA OS SERVOS — CARREGANDO ATAQUE TERMINUS',
      animationType: 'OVERDRIVE_WARNING',
      // Sem hpDelta — sem dano neste turno (garantia de 1 turno de aviso)
    };
  }

  // Ataque físico normal (antes de 100 HP ou depois que OVERDRIVE já foi anunciado)
  const target = validTargets[0]!; // sempre ataca o primeiro alvo vivo (tank)
  const dmg = calculateDamage(enemy, target, {
    damageMultiplier: target.isDefending ? 0.5 : 1.0,
  });
  return {
    actorId: enemy.id,
    description: target.isDefending
      ? `AEGIS-7 varre o setor com canhão de plasma — ${target.name} absorve — ${dmg} de dano`
      : `AEGIS-7 varre o setor com canhão de plasma — ${target.name} sob ataque — ${dmg} de dano`,
    hpDelta: [{ targetId: target.id, amount: -dmg }],
    animationType: 'ATTACK',
  };
},
```

**CRÍTICO — onde o `state.phase` é lido:** O AI handler recebe `state` via `resolveEnemyAction(enemy, state)` chamado do reducer. No `ENEMY_ACTION` case do reducer, `state.phase` é `'ENEMY_TURN'` na chamada normal e deve ser `'OVERDRIVE_RESOLVING'` quando o reducer estiver em modo TERMINUS. O AI usa `state.phase` para discriminar — isso funciona porque o reducer já está no phase correto quando despacha `ENEMY_ACTION`.

---

### Padrão 4: AnimationType — novos valores

**Código atual:**
```typescript
// [VERIFIED: src/engine/types.ts:85-91]
export type AnimationType =
  | 'ATTACK' | 'DEFEND' | 'ITEM'
  | 'SKILL_ELECTRIC' | 'SKILL_SHIELD' | 'SKILL_HEAL'
  | 'OVERDRIVE_WARNING'
  | 'OVERDRIVE_TERMINUS';
```

`OVERDRIVE_WARNING` e `OVERDRIVE_TERMINUS` **já existem** nos tipos. Isso confirma que a extensão de types.ts está parcialmente preparada — só falta o `BattlePhase` e `overdrivePending`.

---

### Padrão 5: OVERDRIVE Warning Overlay em BattleScene

**Padrão existente para referência** (screen flash):
```typescript
// [VERIFIED: src/components/BattleScene.tsx:57-58, 93, 238-239]
const [flashVariant, setFlashVariant] = useState<'a' | 'b'>('a');
// ...
setFlashVariant(v => v === 'a' ? 'b' : 'a');
// ...
const flashClass = flashVariant === 'a' ? styles.flashA : styles.flashB;
```

**Padrão para OVERDRIVE overlay** (mesmo princípio de variant toggle):
```typescript
// [ASSUMED — derivado do padrão flash/shake existente]
const [overdriveVariant, setOverdriveVariant] = useState<'a' | 'b'>('a');

// Quando phase muda para OVERDRIVE_WARNING:
useEffect(() => {
  if (state.phase === 'OVERDRIVE_WARNING') {
    setOverdriveVariant(v => v === 'a' ? 'b' : 'a');
  }
}, [state.phase]);
```

**No JSX — overlay não-dismissível (OVERDRIVE-02):**
```tsx
// [ASSUMED — seguindo padrão de zIndex de BattleScene.tsx]
{(state.phase === 'OVERDRIVE_WARNING' || state.phase === 'OVERDRIVE_RESOLVING') && (
  <div
    key={overdriveVariant}
    className={styles.overdriveOverlay}
    style={{ zIndex: 25, pointerEvents: 'none' }} // não intercepta cliques nos botões
    aria-live="assertive"
    aria-label="TERMINUS CARREGANDO"
  >
    <p className={styles.overdriveText}>TERMINUS // CARREGANDO</p>
    <p className={styles.overdriveSubText}>USE [DEFENDER] OU SERÁ ELIMINADO</p>
  </div>
)}
```

**CRÍTICO — pointer-events:** O overlay deve ter `pointerEvents: 'none'` para não bloquear o botão DEFENDER. Os botões da ActionMenu ficam em `zIndex: 10`; o overlay fica visualmente acima (zIndex 25) mas não captura eventos.

---

### Padrão 6: ActionMenu — DEFENDER destacado em OVERDRIVE

**Código atual do botão DEFENDER:**
```tsx
// [VERIFIED: src/components/ActionMenu.tsx:153-161]
<button
  type="button"
  disabled={!isInputPhase}
  onClick={onDefend}
  className="px-3 py-1 text-xs border border-electric text-electric disabled:opacity-40 disabled:cursor-not-allowed font-pixel"
>
  DEFENDER
</button>
```

**Fase 4 — botão DEFENDER deve:**
1. Estar habilitado em `OVERDRIVE_WARNING` (não só em `PLAYER_INPUT`)
2. Ter glow cyan pulsante visualmente distinto quando `isOverdrivePhase === true`

**Implementação:**
```tsx
// [ASSUMED — extensão do componente existente]
interface ActionMenuProps {
  // ... props existentes ...
  isOverdrivePhase?: boolean; // NOVO — true quando phase === OVERDRIVE_WARNING
}

// Dentro do componente:
const isInputPhase = phase === 'PLAYER_INPUT' || phase === 'OVERDRIVE_WARNING';
// DEFENDER funciona em ambos — sem EN check (já existente, OVERDRIVE-07 ✓)

<button
  type="button"
  disabled={!isInputPhase} // habilitado em OVERDRIVE_WARNING também
  onClick={onDefend}
  className={[
    "px-3 py-1 text-xs border border-electric text-electric font-pixel",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    isOverdrivePhase ? styles.defenderOverdriveGlow : '',
  ].join(' ')}
>
  DEFENDER
</button>
```

---

### Padrão 7: GameController — Encounter 4 e DemoCompletedScreen

**Estado atual do GameController:**
```typescript
// [VERIFIED: src/components/GameController.tsx:65-85]
if (encounterIndex === 0) {
  // E1 complete → TORC dialogue → E2
} else if (encounterIndex === 1) {
  // E2 complete → TRINETRA dialogue → E3
} else {
  // E3+ → EncounterCompleteScreen
}
```

**Fase 4 — novo fluxo:**
```typescript
// [ASSUMED — extensão do GameController existente]
} else if (encounterIndex === 2) {
  // E3 complete → AEGIS-7 reveal dialogue → E4
  setControllerPhase('ENCOUNTER_4_DIALOGUE');
} else if (encounterIndex === 3) {
  // E4 complete (AEGIS-7 derrotado) → DEMO COMPLETED
  setControllerPhase('DEMO_COMPLETED');
}
```

**ControllerPhase union deve incluir:**
```typescript
type ControllerPhase =
  | 'BATTLE'
  | 'ENCOUNTER_2_DIALOGUE'
  | 'ENCOUNTER_3_DIALOGUE'
  | 'ENCOUNTER_4_DIALOGUE' // NOVO — reveal do AEGIS-7
  | 'ENCOUNTER_COMPLETE'
  | 'DEMO_COMPLETED'       // NOVO — fim da demo
  | 'GAME_OVER';
```

**DemoCompletedScreen com reset via React key (END-05, padrão END-03):**
```typescript
// [ASSUMED — padrão derivado de GameOverScreen e battleKey reset]
const handleNewGame = () => {
  setEncounterIndex(0);
  setCarryParty(ENCOUNTER_CONFIGS[0]!.party);
  setBattleKey(k => k + 1);
  setControllerPhase('BATTLE');
  // O BattleScene com key={battleKey} novo é recriado do zero (END-03 pattern)
};
```

---

### Padrão 8: CSS — OVERDRIVE Overlay e Glow

**Adicionar em `battle.module.css`:**

```css
/* [ASSUMED — seguindo padrão shieldPulse e healRipple existentes] */

/* Background boss — magenta escuro (ASSETS-03) */
.bg_command_chamber {
  background: linear-gradient(
    180deg,
    #1a0010 0%,
    #2e001a 60%,
    #100008 100%
  );
}

/* OVERDRIVE warning overlay (VISUAL-06, OVERDRIVE-02) */
@keyframes overdrivePulse {
  0%, 100% { box-shadow: inset 0 0 0 0 rgba(255, 0, 128, 0.0); border-color: rgba(255, 0, 128, 0.4); }
  50%       { box-shadow: inset 0 0 40px 8px rgba(255, 0, 128, 0.3); border-color: rgba(255, 0, 128, 0.9); }
}

/* Variant A/B para forçar restart da animação (mesmo padrão flash/shake) */
.overdriveOverlayA {
  position: absolute;
  inset: 0;
  border: 3px solid rgba(255, 0, 128, 0.6);
  animation: overdrivePulse 800ms ease-in-out infinite;
  pointer-events: none;
  z-index: 25;
}
.overdriveOverlayB {
  /* identical — class name change forces React DOM diff → animation restart */
  position: absolute;
  inset: 0;
  border: 3px solid rgba(255, 0, 128, 0.6);
  animation: overdrivePulse 800ms ease-in-out infinite;
  pointer-events: none;
  z-index: 25;
}

/* OVERDRIVE overlay text */
.overdriveText {
  color: #ff0080;
  font-size: 16px;
  text-align: center;
  text-shadow: 0 0 12px rgba(255, 0, 128, 0.8);
  font-family: var(--font-pixel), monospace;
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.overdriveSubText {
  color: #ff8080;
  font-size: 8px;
  text-align: center;
  font-family: var(--font-pixel), monospace;
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

/* DEFENDER button glow em OVERDRIVE (OVERDRIVE-03) */
@keyframes defenderGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.6); }
  50%       { box-shadow: 0 0 8px 4px rgba(0, 255, 255, 0); }
}
.defenderOverdriveGlow {
  animation: defenderGlow 600ms ease-in-out infinite;
  border-color: var(--color-cyan-neon) !important;
}
```

---

### Padrão 9: AEGIS_7 Enemy Instance

**Adicionar em `enemies.ts`:**
```typescript
// [VERIFIED: src/data/enemies.ts — padrão dos inimigos existentes]
// Stats de PROJECT.md: HP 200, ATK 28, DEF 15, SPD 8
export const AEGIS_7: Enemy = {
  kind: 'enemy',
  id: 'AEGIS_7',
  name: 'AEGIS-7',
  hp: 200, maxHp: 200,
  en: 0, maxEn: 0,
  atk: 28, def: 15, spd: 8,
  statusEffects: [],
  isDefeated: false,
  behavior: 'OVERDRIVE_BOSS',
  isOverdriveActive: false,
};
```

**Encounter 4 em `encounters.ts`:**
```typescript
// [VERIFIED: src/data/encounters.ts — padrão dos configs existentes]
{
  index: 3,
  background: 'command_chamber',
  party: [DEADZONE, TORC, TRINETRA], // party completa do E3 com HP carry
  enemies: [AEGIS_7],
}
```

---

### Padrão 10: BattleState — campo overdrivePending

**Adicionar em `types.ts`:**
```typescript
// [ASSUMED — necessário para sinalizar transição OVERDRIVE_WARNING → OVERDRIVE_RESOLVING]
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
  overdrivePending: boolean; // NOVO: true após AEGIS-7 anunciar TERMINUS
}
```

**No `initialBattleState`:**
```typescript
// [ASSUMED]
export const initialBattleState: BattleState = {
  // ... campos existentes ...
  overdrivePending: false,
};
```

**No reducer — ENEMY_ACTION case:** Quando `resolvedAction.animationType === 'OVERDRIVE_WARNING'`, o reducer deve setar `overdrivePending: true` ao salvar o pending action. O `ACTION_RESOLVED` usa esse flag para determinar a próxima phase.

---

### Padrão 11: ENEMY_TURN useEffect em BattleScene para OVERDRIVE_RESOLVING

**Problema:** O useEffect atual só despacha `ENEMY_ACTION` quando `state.phase === 'ENEMY_TURN'`:
```typescript
// [VERIFIED: src/components/BattleScene.tsx:132-133]
if (state.phase !== 'ENEMY_TURN') return;
```

**Solução:** Expandir para incluir `OVERDRIVE_RESOLVING`:
```typescript
if (state.phase !== 'ENEMY_TURN' && state.phase !== 'OVERDRIVE_RESOLVING') return;
```

Quando `OVERDRIVE_RESOLVING`, o `AEGIS_7` sempre é o ator — o useEffect encontra o enemy no turnQueue normalmente e despacha `ENEMY_ACTION`. O AI handler, ao ler `state.phase === 'OVERDRIVE_RESOLVING'`, dispara TERMINUS.

---

### Anti-Patterns a Evitar

- **NÃO hardcodar "se o inimigo é AEGIS_7" no reducer:** A lógica OVERDRIVE fica no AI handler e no campo `overdrivePending`; o reducer não deve ter `if (enemy.id === 'AEGIS_7')` — mantém a separação de concerns existente.
- **NÃO usar `state.pendingAction?.animationType` no useEffect de ENEMY_TURN para decidir o mode:** Isso é stale closure — usar `stateRef.current.overdrivePending`.
- **NÃO criar um `OVERDRIVE_ACTION` separado no Action union:** Reutilizar `ENEMY_ACTION` com phase check no AI é mais limpo e consistente.
- **NÃO remover o exhaustiveness check (`const _exhaustive: never = action`):** Ele é uma rede de segurança; qualquer Action nova sem case vai gerar erro de compilação.
- **NÃO resetar `overdrivePending` prematuramente:** Deve ser resetado apenas no `INIT` (novo encontro) ou quando AEGIS_7 for derrotado.

---

## Don't Hand-Roll

| Problema | Não construir | Usar em vez | Por quê |
|----------|---------------|-------------|---------|
| State machine multi-phase | Novo sistema de estado | Extensão do `BattlePhase` union existente | Reducer já trata todas as transições; extensão é cirúrgica |
| Timer control em OVERDRIVE | setTimeout custom para OVERDRIVE | Mesmo padrão do `ENEMY_TURN` useEffect existente | QA-01/02 já garantem cleanup e staleRef; não duplicar |
| CSS overlay animation | JS-based animation library | CSS `@keyframes` em `battle.module.css` | CLAUDE.md proíbe Framer Motion; GPU compositor via transform/opacity |
| Reset de estado completo | Limpar manualmente cada campo do reducer | React `key` prop no `<BattleScene>` (padrão END-03 confirmado) | Destroy + recreate garante estado limpo sem risco de estado residual |

---

## Common Pitfalls

### Pitfall 1: Phase guard bloqueando DEFENDER em OVERDRIVE_WARNING
**O que dá errado:** `if (state.phase !== 'PLAYER_INPUT') return state;` bloqueia PLAYER_ACTION em OVERDRIVE_WARNING — DEFENDER nunca dispara, todos morrem no TERMINUS.
**Por que acontece:** O guard atual não foi escrito com OVERDRIVE_WARNING em mente.
**Como evitar:** `if (state.phase !== 'PLAYER_INPUT' && state.phase !== 'OVERDRIVE_WARNING') return state;`
**Sinal de alerta:** Testes de OVERDRIVE-07 falham; botão DEFENDER visualmente habilitado mas dispatch é no-op.

### Pitfall 2: AEGIS-7 anunciando E disparando TERMINUS no mesmo turno (viola OVERDRIVE-08)
**O que dá errado:** `OVERDRIVE_BOSS` AI retorna `OVERDRIVE_WARNING` mas o reducer avança diretamente para `OVERDRIVE_RESOLVING` sem dar turno ao jogador.
**Por que acontece:** `ACTION_RESOLVED` avança a fila sem checar `overdrivePending` corretamente.
**Como evitar:** `overdrivePending` é setado como `true` em `ENEMY_ACTION` quando `animationType === 'OVERDRIVE_WARNING'`; o `ACTION_RESOLVED` avança para `PLAYER_INPUT` (não `ENEMY_TURN`), dando ao jogador o turno de defesa.
**Sinal de alerta:** Teste OVERDRIVE-08 falha; player não tem chance de defender.

### Pitfall 3: stale closure em OVERDRIVE_RESOLVING
**O que dá errado:** O useEffect de `ENEMY_TURN` captura `state.phase` da closure e nunca vê `OVERDRIVE_RESOLVING`.
**Por que acontece:** useEffect não inclui `OVERDRIVE_RESOLVING` no guard de entrada.
**Como evitar:** Guard expandido: `if (state.phase !== 'ENEMY_TURN' && state.phase !== 'OVERDRIVE_RESOLVING') return;`
**Sinal de alerta:** TERMINUS nunca dispara; jogo trava em `OVERDRIVE_RESOLVING` para sempre.

### Pitfall 4: Overlay OVERDRIVE bloqueando cliques nos botões
**O que dá errado:** `pointerEvents: 'auto'` no overlay intercepta todos os cliques — DEFENDER não responde.
**Por que acontece:** Overlay tem `zIndex` maior que os botões.
**Como evitar:** `pointerEvents: 'none'` no overlay (igual ao flash overlay existente — ver `BattleScene.tsx:263`).
**Sinal de alerta:** DEFENDER visível e habilitado mas clicks não registram.

### Pitfall 5: `overdrivePending` não resetado no INIT do novo jogo
**O que dá errado:** Player completa demo, clica "NOVA INFILTRAÇÃO", começa E1 com AEGIS-7 em OVERDRIVE imediatamente.
**Por que acontece:** `initialBattleState.overdrivePending = false` mas o GameController não reseta a instância AEGIS_7 com HP correto.
**Como evitar:** GameController incrementa `battleKey` ao resetar — o `key` prop destrói e recria `BattleScene`, que despacha `INIT` com `ENCOUNTER_CONFIGS[0]` (DEADZONE vs Probe, sem AEGIS-7). `overdrivePending` em `initialBattleState` é `false`.

### Pitfall 6: TERMINUS matando personagem já morto (viola OVERDRIVE-06)
**O que dá errado:** hpDelta de -999 aplicado em character com `isDefeated: true`.
**Por que acontece:** TERMINUS targets não filtram por `isDefeated`.
**Como evitar:** `terminusTargets = validTargets.filter(c => !c.isDefending)` onde `validTargets = state.party.filter(c => !c.isDefeated)` — dois filtros em cascata.
**Sinal de alerta:** Teste OVERDRIVE-06 falha; HP de personagem morto vai para valores negativos (mas HP já está 0, então `Math.max(0, 0-999) = 0` — o bug real é que `isDefeated` já é true, então o dano é redundante mas não cria estado inválido).

### Pitfall 7: OVERDRIVE_BOSS atacando normalmente depois que AEGIS-7 foi derrotado
**O que dá errado:** `validTargets.length === 0` mas o AI tenta calcular dano.
**Por que acontece:** Pitfall coberto pelo guard existente nos outros AIs — `OVERDRIVE_BOSS` precisa do mesmo guard.
**Como evitar:** Primeiro check no handler: `if (validTargets.length === 0) return no-op action`.

---

## Runtime State Inventory

Esta é uma fase de adição de features (não rename/refactor). Sem necessidade de migração de dados em runtime.

**Stored data:** Nenhum — o jogo não persiste estado entre sessões (sem localStorage, sem DB).
**Live service config:** Nenhum — sem serviços externos.
**OS-registered state:** Nenhum.
**Secrets/env vars:** Nenhum — sem variáveis de ambiente relevantes para esta fase.
**Build artifacts:** Nenhum problema esperado — extensão de tipos não quebra builds existentes.

---

## Environment Availability

| Dependência | Requerida por | Disponível | Versão | Fallback |
|-------------|---------------|------------|--------|---------|
| Node.js | Next.js dev server | Assumido (Fases 1-3 rodaram) | n/a | — |
| npm | Instalação de deps | Assumido | n/a | — |
| Vitest 2 | QA-06 — testes OVERDRIVE | [VERIFIED: config.json + test files existentes] | 2.x | — |
| CSS Modules | battle.module.css | [VERIFIED: src/styles/battle.module.css] | built-in | — |

Sem dependências externas novas. Toda a Fase 4 usa o ambiente já estabelecido.

---

## Validation Architecture

Nyquist validation: **habilitado** (`workflow.nyquist_validation: true` em config.json).

### Test Framework

| Propriedade | Valor |
|-------------|-------|
| Framework | Vitest 2.x |
| Config file | `vitest.config.ts` (confirmado presente — 124 testes rodando) |
| Quick run | `npm run test -- --reporter=dot` |
| Full suite | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Comportamento | Tipo | Comando Automatizado | Arquivo |
|--------|---------------|------|----------------------|---------|
| OVERDRIVE-01 | AEGIS-7 HP < 100 → OVERDRIVE_WARNING | unit | `npm run test -- src/engine/enemyAI.test.ts -t "OVERDRIVE"` | ❌ Wave 0 |
| OVERDRIVE-02 | Banner não-dismissível renderizado | component | `npm run test -- src/components/BattleScene.test.tsx -t "overdrive overlay"` | ❌ Wave 0 |
| OVERDRIVE-03 | DEFENDER glow em OVERDRIVE_WARNING | component | `npm run test -- src/components/ActionMenu.test.tsx -t "overdrive glow"` | ❌ Wave 0 |
| OVERDRIVE-04 | TERMINUS aplica 999 em não-defenders | unit | `npm run test -- src/engine/reducer.test.ts -t "TERMINUS"` | ❌ Wave 0 |
| OVERDRIVE-05 | Party morta antes do warning → GAME_OVER | unit | `npm run test -- src/engine/reducer.test.ts -t "OVERDRIVE party wiped"` | ❌ Wave 0 |
| OVERDRIVE-06 | Personagem morto não recebe TERMINUS | unit | `npm run test -- src/engine/enemyAI.test.ts -t "dead character terminus"` | ❌ Wave 0 |
| OVERDRIVE-07 | DEFENDER funciona com EN=0 em OVERDRIVE | unit | `npm run test -- src/engine/reducer.test.ts -t "DEFENDER EN=0 OVERDRIVE"` | ❌ Wave 0 |
| OVERDRIVE-08 | AEGIS não anuncia + dispara no mesmo turno | unit | `npm run test -- src/engine/reducer.test.ts -t "OVERDRIVE_WARNING one turn"` | ❌ Wave 0 |
| ENC-04 | Encontro 4 config existe e é válido | unit | `npm run test -- src/data/encounters.test.ts -t "encounter 4"` | ❌ Wave 0 |
| END-01 | DemoCompletedScreen renderiza | component | `npm run test -- src/components/DemoCompletedScreen.test.tsx` | ❌ Wave 0 |
| END-05 | NOVA INFILTRAÇÃO reseta para E1 | component | `npm run test -- src/components/GameController.test.tsx -t "new game"` | ❌ Wave 0 |

### Sampling Rate
- **Por task commit:** `npm run test -- src/engine/reducer.test.ts src/engine/enemyAI.test.ts --reporter=dot`
- **Por wave merge:** `npm run test`
- **Phase gate:** Full suite green (>= 124 testes existentes + novos OVERDRIVE) antes do `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Testes OVERDRIVE em `src/engine/reducer.test.ts` — cobre OVERDRIVE-04, 05, 07, 08
- [ ] Testes OVERDRIVE em `src/engine/enemyAI.test.ts` — cobre OVERDRIVE-01, 06
- [ ] Testes de overlay em `src/components/BattleScene.test.tsx` — cobre OVERDRIVE-02, 03
- [ ] `src/components/DemoCompletedScreen.test.tsx` — novo arquivo (END-01, END-05)
- [ ] Teste de config em `src/data/encounters.test.ts` — cobre ENC-04 (novo arquivo ou extensão do existente)

---

## Security Domain

`security_enforcement` não está explicitamente configurado em `config.json`. Como o jogo é 100% client-side, sem auth, sem dados de usuário, sem endpoints de servidor, e sem input sensível, não há superfície de ataque relevante para ASVS nesta fase.

- V5 Input Validation: ação do jogador é um union TypeScript discriminado — validação via reducer phase guard (já implementado).
- Sem V2/V3/V4/V6 aplicáveis: sem autenticação, sem sessões, sem criptografia.

---

## Assumptions Log

| # | Claim | Seção | Risco se errado |
|---|-------|-------|-----------------|
| A1 | `overdrivePending: boolean` como campo de BattleState é a melhor abordagem para sinalizar a transição | Padrão 2 | Se a equipe preferir status effect approach, os testes ainda passam mas o código fica diferente — impacto baixo |
| A2 | OVERDRIVE_BOSS AI lê `state.phase` para discriminar modo TERMINUS vs anúncio | Padrão 3 | Se o reducer chamar AI antes de atualizar phase para OVERDRIVE_RESOLVING, AI leria phase errada — resolver garantindo que ENEMY_ACTION só é despachado quando `stateRef.current.phase === 'OVERDRIVE_RESOLVING'` |
| A3 | A fase OVERDRIVE_WARNING é fase do JOGADOR (não do inimigo) — AEGIS-7 anunciou e agora o jogador tem seu turno para defender | Padrão 2 | Se interpretado como fase do inimigo, o fluxo do turn queue fica incorreto — verificar com a progressão: AEGIS turno → anuncia → ACTION_RESOLVED → PLAYER_INPUT ou OVERDRIVE_WARNING para os jogadores |
| A4 | `bgVariants` em BattleScene precisa incluir `'command_chamber'` como quarto valor | Padrão 9 | Se não incluído, encounterIndex 3 usa `'corridor'` como fallback — bug visual, não crash |

---

## Open Questions (RESOLVED)

1. **Fluxo exato de OVERDRIVE_WARNING como phase do jogador vs fase intermediária** — RESOLVED
   - Decisão: OVERDRIVE_WARNING é phase explícita para turnos do JOGADOR (não para o anúncio do AEGIS).
   - ENEMY_ACTION com animationType OVERDRIVE_WARNING → phase: 'RESOLVING' (não OVERDRIVE_WARNING direto, para não quebrar o animation loop que depende de RESOLVING para disparar ACTION_RESOLVED).
   - ACTION_RESOLVED com overdrivePending=true e next=player → phase: 'OVERDRIVE_WARNING' (player vê overlay + DEFENDER glow).
   - ACTION_RESOLVED com overdrivePending=true e next=enemy → phase: 'OVERDRIVE_RESOLVING'.

2. **AEGIS-7 tem mais de um turno antes de atingir HP < 100?** — RESOLVED
   - Não há ajuste necessário. Se o player derrotar AEGIS antes de 100 HP, OVERDRIVE nunca acontece (valid play). Os 13 testes do QA-06 cobrem o cenário em que HP < 100 é atingido.

3. **DemoCompletedScreen — precisa de E4_DIALOGUE antes (NARR-04 é Phase 5)?** — RESOLVED
   - Decisão: Phase 4 inclui um dialogue minimal de revelação do AEGIS-7 (ENCOUNTER_4_DIALOGUE) antes da batalha, sem precisar da cutscene polida (Phase 5). Segue padrão dos dialogues de E2/E3.

---

## Sources

### Primary (HIGH confidence)
- `src/engine/types.ts` — union BattlePhase atual, AnimationType, StatusEffectType, EnemyBehaviorType — leitura direta
- `src/engine/reducer.ts` — todos os cases existentes, phase guard, ACTION_RESOLVED, WR-01/02 fixes — leitura direta
- `src/engine/enemyAI.ts` — stub OVERDRIVE_BOSS, padrão dos behaviors existentes — leitura direta
- `src/components/BattleScene.tsx` — padrão flash/shake variant toggle, ENEMY_TURN useEffect, gameStateRef usage — leitura direta
- `src/components/ActionMenu.tsx` — isInputPhase guard, DEFENDER button, SKILL_EN_COSTS map — leitura direta
- `src/components/GameController.tsx` — encounter chain, battleKey pattern, handleVictory/handleGameOver — leitura direta
- `src/data/encounters.ts` + `src/data/enemies.ts` — padrões de instância de enemy e config de encontro — leitura direta
- `src/styles/battle.module.css` — todos os keyframes existentes, padrão de variant A/B, CSS custom properties — leitura direta
- `.planning/STATE.md` — decisão chave "OVERDRIVE como two-phase state extension", WR-01/02 fixes, pitfall watch lista
- `.planning/REQUIREMENTS.md` — OVERDRIVE-01 a 08 completos, ENC-04, END-01, END-05
- `.planning/PROJECT.md` — stats AEGIS-7 (HP 200, ATK 28, DEF 15, SPD 8), mecânica OVERDRIVE descrita
- `CLAUDE.md` — stack travada, convenções, proibição de Framer Motion, CSS keyframes obrigatório

### Secondary (LOW confidence — sem tool verification nesta sessão)
- `@keyframes` animation patterns para pulse/glow — derivados do padrão shieldPulse e defenderPulse-red do CLAUDE.md

---

## Metadata

**Confidence breakdown:**
- Engine extension (BattlePhase, reducer, AI): HIGH — código fonte lido diretamente
- CSS patterns (OVERDRIVE overlay, glow): HIGH — padrão flash/shake lido e seguido
- GameController extension: HIGH — código lido diretamente
- OVERDRIVE flow sequence: MEDIUM — lógica derivada da leitura do código mas não executada
- Asset stats: HIGH — lidos de PROJECT.md (fonte canônica do projeto)

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (stack estável, sem deps externas para esta fase)
