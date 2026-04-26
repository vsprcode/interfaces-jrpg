# Phase 3: Party Expansion (Encounters 2 & 3) — Research

**Researched:** 2026-04-26
**Domain:** Multi-party JRPG turn loop — status effects, encounter chaining, new AI behaviors, target selection UI
**Confidence:** HIGH — grounded entirely in direct codebase inspection of Phase 2 source files, verified battle math via Node.js, and documented patterns from prior research.

---

## Summary

Phase 3 extends a proven single-encounter engine into a three-encounter chain with two new party members, two new enemy types, and three new mechanics (status effects, multi-target selection, HP persistence). Every new mechanic has a clear home in the existing architecture — no new architectural patterns are needed. The reducer extension pattern, the `ResolvedAction` bridge, and the animation gate useEffect all scale directly to multiple combatants and multiple encounters.

The single highest-risk item is the encounter-chaining state flow: passing persistent HP values from one encounter initializer to the next requires lifting state from `BattleScene` into the page-level `GameController`. Phase 2's `BattleScene` is self-contained with hardcoded `DEADZONE` + `CASTING_PROBE_MK1`; Phase 3 must parameterize it so the controller can feed updated party state into each successive encounter. This is a planned extension point, not a regression risk.

The WR-01/WR-02 bugs from the Phase 2 code review MUST be fixed before any Phase 3 encounter runs. With 2 Networker Enforcers or 3 Patrol Bots, a mid-round enemy defeat will trigger the skip path immediately, and the unfixed reducer will hang the game in `ENEMY_TURN` indefinitely. The fixes are documented in the review and are reproduced verbatim in this research.

**Primary recommendation:** Fix WR-01/WR-02 first (Wave 0). Then build the encounter-chaining controller. Then add TORC + TRINETRA + new enemies + new skills. Then add status effects. Then add the two new AIs. Finish with DialogueBox, TurnOrderIndicator, and camera-shake hardening.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKILL-02 | [Forge Wall] (TORC, 6 EN) — DEF_BUFF +8 on all party members for 2 turns | STATUS EFFECTS section: `statusApplied` on `ResolvedAction`, decrement in `ACTION_RESOLVED` |
| SKILL-03 | [System Override] (TRINETRA, 10 EN) — heal 30 HP OR remove status on selected ally | TARGET SELECTION section: two-step ally picker in ActionMenu |
| SKILL-05 | Status effects decrement each turn and expire correctly | STATUS EFFECTS section: decrement in `ACTION_RESOLVED` after applying deltas |
| AI-03 | `TARGET_LOWEST_HP` behavior (Networker Enforcer) — targets alive party member with lowest HP | AI section: pure sort, already `state.party.filter(!isDefeated).sort(hp asc)[0]` |
| AI-04 | `ATTACK_RANDOM` behavior (Casting Patrol Bot) — random alive party member | AI section: `Math.random()` inside AI function is legal (reducer dispatch is discrete event) |
| ENC-02 | Encounter 2: DEADZONE + TORC vs 2 Networker Enforcers | ENCOUNTER CHAIN section: GameController feeds party + enemies into BattleScene |
| ENC-03 | Encounter 3: DEADZONE + TORC + TRINETRA vs 3 Casting Patrol Bots | ENCOUNTER CHAIN section |
| ENC-05 | HP persists between encounters; EN resets to max | ENCOUNTER CHAIN section: GameController normalizes EN on transition |
| ENC-06 | Interstitial "ENCOUNTER COMPLETE" screen between encounters | ENCOUNTER CHAIN section: EncounterCompleteScreen component in GameController |
| UI-06 | DialogueBox cinematic between encounters | DIALOGUE BOX section: full-screen overlay, linear text progression |
| UI-08 | TurnOrderIndicator shows upcoming turns based on SPD | TURN ORDER INDICATOR section: derived from `state.turnQueue` slice |
| VISUAL-04 | Camera-shake on heavy hits (VISUAL-03 variant hardened) | CAMERA SHAKE section: already in battle.module.css; trigger threshold added |
| VISUAL-05 | Particle effects for Forge Wall + System Override skills | VISUAL EFFECTS section: CSS keyframe classes per AnimationType |
| ASSETS-01 | TORC + TRINETRA sprites (battle + portrait) | SpriteFallback covers missing PNGs; data route via `combatantId` |
| ASSETS-02 | Networker Enforcer + Patrol Bot sprites | Same SpriteFallback pattern as Probe MK-I |
| ASSETS-03 | loading_dock + server_room backgrounds | CSS gradient placeholders per battleBackground variant |
| ASSETS-06 | Status effect icons, skill icons | CSS-only icons acceptable; see STATUS ICON section |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **State management:** `useReducer` at BattleScene / GameController level. NOT Zustand. Locked.
- **Styling:** Tailwind v4 + CSS Modules for keyframes. No styled-components, no Framer Motion.
- **Animations:** CSS `@keyframes` in CSS Modules only. GPU compositing (`transform`/`opacity`). HP/EN bars via CSS `transition: width`.
- **Font:** `var(--font-pixel)` (Press Start 2P). Already wired globally.
- **Testing:** Vitest 2 (node env) for engine logic; @testing-library/react + jsdom for components.
- **`'use client'`:** All battle components. Every new component added in Phase 3 must begin with `'use client'`.
- **QA guardrails:** Every `useEffect` with timer must `clearTimeout` in cleanup. All deferred reads via `stateRef.current`. No `Math.random` in render path. Reducer phase guard returns same reference.

---

## Critical Bug Fixes Required Before Phase 3 Can Run (WR-01/WR-02)

These bugs are latent in Phase 2 (single enemy, so skip path never fires) but will break immediately in Phase 3 with multiple enemies.

### WR-01 Fix: `ENEMY_ACTION` skip path must set `phase`

**File:** `src/engine/reducer.ts:241-248`

```typescript
// REPLACE this block:
if (!enemy || enemy.isDefeated) {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    return { ...state, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1 };
  }
  return { ...state, currentTurnIndex: nextIndex };
}

// WITH this:
if (!enemy || enemy.isDefeated) {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    const nextPhase = newQueue[0]?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
    return { ...state, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1, phase: nextPhase };
  }
  const nextEntry = state.turnQueue[nextIndex];
  const nextPhase = nextEntry?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
  return { ...state, currentTurnIndex: nextIndex, phase: nextPhase };
}
```

### WR-02 Fix: `NEXT_TURN` must set `phase`

**File:** `src/engine/reducer.ts:259-271`

```typescript
// REPLACE:
case 'NEXT_TURN': {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    return { ...state, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1 };
  }
  return { ...state, currentTurnIndex: nextIndex };
}

// WITH:
case 'NEXT_TURN': {
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(state.party, state.enemies);
    const nextPhase = newQueue[0]?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
    return { ...state, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1, phase: nextPhase };
  }
  const nextEntry = state.turnQueue[nextIndex];
  const nextPhase = nextEntry?.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
  return { ...state, currentTurnIndex: nextIndex, phase: nextPhase };
}
```

### WR-03 Fix: AI stubs must not throw inside reducer

Replace `throw new Error(...)` in `ALWAYS_ATTACK` and `stubAction` with console-error + no-op return (as documented in 02-REVIEW.md). Phase 3 fully implements TARGET_LOWEST_HP and ATTACK_RANDOM so the stubs are replaced — but WR-03 must still be patched in ALWAYS_ATTACK in case of a future edge case.

### WR-04 Fix: Enemy HP upper clamp

```typescript
// reducer.ts, enemy delta application — add Math.min(e.maxHp, ...):
const newHp = Math.max(0, Math.min(e.maxHp, e.hp + delta.amount));
return { ...e, hp: newHp, isDefeated: newHp <= 0 };
```

---

## What Phase 2 Delivered (Delta Baseline)

| File | Status | Phase 3 Needs |
|------|--------|---------------|
| `src/engine/types.ts` | Complete — `StatusEffect`, `StatusEffectType`, `StatusApplied`, `StatusRemoved` all defined | No changes to types needed |
| `src/engine/reducer.ts` | PLAYER_ACTION, ACTION_RESOLVED, ENEMY_ACTION wired; WR-01/WR-02 bugs present | Fix WR-01/WR-02; add status effect decrement; add Forge Wall + System Override SKILL cases; multi-target support |
| `src/engine/enemyAI.ts` | `ALWAYS_ATTACK` real; `TARGET_LOWEST_HP`/`ATTACK_RANDOM` are stubs | Implement TARGET_LOWEST_HP and ATTACK_RANDOM |
| `src/engine/damage.ts` | `getEffectiveDef()` already reads `DEF_BUFF` statusEffects and adds magnitude | No changes — Forge Wall works automatically |
| `src/data/characters.ts` | DEADZONE only | Add TORC and TRINETRA |
| `src/data/enemies.ts` | CASTING_PROBE_MK1 only | Add NETWORKER_ENFORCER (x2 instances) and CASTING_PATROL_BOT (x3 instances) |
| `src/components/BattleScene.tsx` | Hardcoded to Encounter 1 | Refactor: accept `party`, `enemies`, `encounterIndex` as props |
| `src/components/CharacterHUD.tsx` | Shows name, HP bar, EN bar, defending badge | Add status effect icons with turn countdown |
| `src/components/ActionMenu.tsx` | Fixed 4 buttons; no target selection | Add target picker for ally skills (System Override) |
| `src/app/page.tsx` | Simple `battleKey` + `BattleScene` | Replace with `GameController` managing encounter state machine |

---

## Architecture Patterns

### Pattern 1: Encounter Chain — GameController

The page (`src/app/page.tsx`) must become a `GameController` that owns the encounter index, carry-over party HP, and transition state. `BattleScene` becomes parameterized.

**GameController responsibilities:**
1. Track `encounterIndex` (0=E1, 1=E2, 2=E3, 3=E4)
2. Track `carryParty: Character[]` — updated HP/EN after each victory
3. Show DialogueBox interstital before each encounter (except E1)
4. Show `EncounterCompleteScreen` between encounters
5. Pass `party` + `enemies` + `onVictory(finalParty)` to `BattleScene`

**State machine in GameController:**

```
'ENCOUNTER_1_DIALOGUE'  -- E1 has no dialogue, skip to:
'ENCOUNTER_1_BATTLE'    → onVictory → 'ENCOUNTER_2_DIALOGUE'
'ENCOUNTER_2_DIALOGUE'  → advance  → 'ENCOUNTER_2_BATTLE'
'ENCOUNTER_2_BATTLE'    → onVictory → 'ENCOUNTER_3_DIALOGUE'
'ENCOUNTER_3_DIALOGUE'  → advance  → 'ENCOUNTER_3_BATTLE'
'ENCOUNTER_3_BATTLE'    → onVictory → Phase 4 (AEGIS-7)
```

**HP persistence + EN reset:**

```typescript
// GameController: onVictory callback receives final party state from BattleScene
const handleVictory = (finalParty: Character[]) => {
  // ENC-05: HP carries, EN resets to maxEn
  const nextParty = finalParty.map(c => ({
    ...c,
    en: c.maxEn,              // EN resets to max
    isDefending: false,        // clear transient flags
    statusEffects: [],         // clear all status effects on encounter transition
    isDefeated: false,         // ensure no dead party members carry over
  }));
  setCarryParty(nextParty);
  setPhase('ENCOUNTER_2_DIALOGUE'); // or E3_DIALOGUE
};
```

**Key insight:** `statusEffects` should be cleared on encounter transition. DEF_BUFF from Forge Wall should not persist between encounters — that's mechanically correct and prevents state leakage.

**BattleScene extended props:**

```typescript
interface BattleSceneProps {
  party: Character[];
  enemies: Enemy[];
  encounterIndex: number;        // used for background variant + lore text
  onVictory: (finalParty: Character[]) => void;
  onGameOver: () => void;
}
```

BattleScene calls `onVictory(state.party)` when `state.phase === 'VICTORY'` (via a useEffect watching `state.phase`). The `finalParty` carries the real HP values at time of victory.

**Pattern for the INIT dispatch with parameterized party:**

```typescript
// In BattleScene — INIT now uses props, not hardcoded data
const initFired = useRef(false);
useEffect(() => {
  if (initFired.current) return;
  initFired.current = true;
  dispatch({ type: 'INIT', payload: { party, enemies } });
}, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once
```

The `INIT` case in the reducer already clones party/enemies via spread, so the prop reference is safe.

---

### Pattern 2: Status Effects — Decrement in ACTION_RESOLVED

**Where:** At the end of the `ACTION_RESOLVED` case, after applying deltas and before checking end conditions.

**Why ACTION_RESOLVED:** Status effects logically expire "at the end of a turn." ACTION_RESOLVED is the single point where turn advancement happens (it computes `nextIndex`). Decrementing here means every actor's status effects tick once per turn, regardless of who is taking the turn.

```typescript
// In ACTION_RESOLVED case — AFTER applying hpDelta/enDelta, BEFORE end condition check:

// Decrement status effects on ALL combatants (party + enemies)
// Effects at turnsRemaining === 1 expire (filter them out)
const decrementStatuses = <T extends { statusEffects: StatusEffect[] }>(combatants: T[]): T[] =>
  combatants.map(c => ({
    ...c,
    statusEffects: c.statusEffects
      .map(e => ({ ...e, turnsRemaining: e.turnsRemaining - 1 }))
      .filter(e => e.turnsRemaining > 0),
  }));

newParty = decrementStatuses(newParty);
newEnemies = decrementStatuses(newEnemies);
```

**Important:** Apply status effect decrement to `newParty`/`newEnemies` (already delta-applied) not to `state.party`/`state.enemies`. This ensures the decrement is part of the same immutable snapshot.

**DEF_BUFF behavior:** `damage.ts`'s `getEffectiveDef()` already reads `statusEffects.filter(e => e.type === 'DEF_BUFF')` and sums `magnitude`. Adding a DEF_BUFF status effect with `magnitude: 8, turnsRemaining: 2` is sufficient — damage calculation works automatically.

**Verified:** `src/engine/damage.ts:37-40` — `getEffectiveDef` iterates `combatant.statusEffects`, filters for `DEF_BUFF`, sums magnitudes. No changes to damage.ts needed.

---

### Pattern 3: Forge Wall Skill Case in Reducer

```typescript
// In PLAYER_ACTION, SKILL case — route by actorId or skill name
case 'SKILL': {
  if (actorId === 'TORC') {
    const EN_COST = 6;
    if (actor.en < EN_COST) return state;

    // Apply DEF_BUFF to ALL alive party members (group buff — SKILL-02)
    const shieldEffect: StatusEffect = {
      type: 'DEF_BUFF',
      turnsRemaining: 2,
      magnitude: 8,
      appliedBy: 'TORC',
    };

    const resolved: ResolvedAction = {
      actorId: actor.id,
      description: `TORC ergue o FORGE WALL — barreira analógica ativada — DEF +8 por 2 turnos`,
      enDelta: [{ targetId: actor.id, amount: -EN_COST }],
      statusApplied: state.party
        .filter(c => !c.isDefeated)
        .map(c => ({ targetId: c.id, effect: shieldEffect })),
      animationType: 'SKILL_SHIELD',
    };

    return {
      ...state,
      party: partyCleared,
      phase: 'RESOLVING',
      pendingAction: resolved,
      log: [...state.log, resolved.description],
    };
  }

  if (actorId === 'TRINETRA') {
    // System Override — see TARGET SELECTION pattern below
    // ...
  }

  if (actorId === 'DEADZONE') {
    // Signal Null — existing implementation (unchanged)
    // ...
  }
}
```

**STATUS_APPLIED application in ACTION_RESOLVED:**

```typescript
// Add after hpDelta/enDelta application:
if (state.pendingAction?.statusApplied) {
  for (const sa of state.pendingAction.statusApplied) {
    newParty = newParty.map(c =>
      c.id === sa.targetId
        ? { ...c, statusEffects: [...c.statusEffects, sa.effect] }
        : c
    );
    // If enemies can receive statuses, map newEnemies here too
  }
}
```

**STATUS_REMOVED application in ACTION_RESOLVED (for System Override):**

```typescript
if (state.pendingAction?.statusRemoved) {
  for (const sr of state.pendingAction.statusRemoved) {
    newParty = newParty.map(c =>
      c.id === sr.targetId
        ? { ...c, statusEffects: c.statusEffects.filter(e => e.type !== sr.effectType) }
        : c
    );
  }
}
```

---

### Pattern 4: System Override — Target Selection

System Override (TRINETRA, 10 EN) has two effects: **heal 30 HP** OR **remove a status** from a chosen ally. The player must select a target and an effect. This is the most complex UI change in Phase 3.

**Two-level selection model:**

1. Player clicks `[HABILIDADE]` → ActionMenu enters `SKILL_TARGET_SELECT` mode (local state)
2. ActionMenu shows alive party members as clickable targets
3. Player clicks a target → ActionMenu asks "CURAR ou REMOVER STATUS" (two buttons)
4. Player picks one → dispatch PLAYER_ACTION with SKILL + targetId + skillVariant

**Local state in ActionMenu (or parent-level):**

```typescript
type SkillSelectStep =
  | { step: 'none' }
  | { step: 'pick_target' }
  | { step: 'pick_effect'; targetId: CharacterId };

const [skillSelect, setSkillSelect] = useState<SkillSelectStep>({ step: 'none' });
```

**Key decision:** Keep `SkillSelectStep` as LOCAL state inside the component handling skill dispatch — either ActionMenu or BattleScene. Do NOT put it in the reducer. The reducer only sees the final resolved dispatch. This keeps the reducer clean and testable without UI concerns.

**Passing skill variant to reducer:**

The current `PlayerAction` type has `type: PlayerActionType` where `PlayerActionType = 'ATTACK' | 'SKILL' | 'DEFEND' | 'ITEM'`. Phase 3 needs to distinguish "SKILL heal" vs "SKILL remove status" for System Override. Two options:

**Option A (recommended):** Add `skillVariant?: 'HEAL' | 'REMOVE_STATUS'` to `PlayerAction`:

```typescript
export interface PlayerAction {
  type: PlayerActionType;
  actorId: CharacterId;
  targetId?: CombatantId;
  skillVariant?: 'HEAL' | 'REMOVE_STATUS'; // Phase 3 addition for System Override
}
```

**Option B:** Encode variant in a separate action type. More reducer boilerplate, no clear benefit. Option A is simpler.

**System Override reducer case:**

```typescript
if (actorId === 'TRINETRA') {
  const EN_COST = 10;
  if (actor.en < EN_COST) return state;

  const healTarget = state.party.find(c => c.id === targetId);
  if (!healTarget) return state;

  const variant = action.payload.skillVariant ?? 'HEAL';

  if (variant === 'HEAL') {
    const healAmount = Math.min(30, healTarget.maxHp - healTarget.hp);
    const resolved: ResolvedAction = {
      actorId: actor.id,
      description: `TRINETRA executa SYSTEM OVERRIDE — restaura ${healAmount} HP em ${healTarget.name}`,
      hpDelta: [{ targetId: healTarget.id, amount: healAmount }],
      enDelta: [{ targetId: actor.id, amount: -EN_COST }],
      animationType: 'SKILL_HEAL',
    };
    // ...
  }

  if (variant === 'REMOVE_STATUS') {
    // Remove first negative status (or all — design choice)
    const toRemove = healTarget.statusEffects[0]?.type;
    const resolved: ResolvedAction = {
      actorId: actor.id,
      description: `TRINETRA executa SYSTEM OVERRIDE — protocolo de limpeza em ${healTarget.name}`,
      enDelta: [{ targetId: actor.id, amount: -EN_COST }],
      statusRemoved: toRemove
        ? [{ targetId: healTarget.id, effectType: toRemove }]
        : [],
      animationType: 'SKILL_HEAL',
    };
    // ...
  }
}
```

**Multi-target ATACAR:** With 2 Enforcers and 3 Patrol Bots, the ATTACK and SKILL (Signal Null) actions also need enemy target selection. Recommendation: Show enemy targets as clickable in EnemyPanel when `[ATACAR]` or `[HABILIDADE]` (for DEADZONE) is clicked. Same two-step pattern as ally selection.

---

### Pattern 5: Multi-Enemy Target Selection for ATACAR

For encounters with multiple enemies, `handleAttack` in BattleScene can no longer hardcode `targetId: 'CASTING_PROBE_MK1'`. Options:

**Option A (recommended for Phase 3):** Enter target selection mode on ATACAR click. Show enemy panels with a highlight ring; player clicks an enemy to confirm attack.

```typescript
type AttackTargetStep = 'none' | 'pick_enemy';
const [attackTarget, setAttackTarget] = useState<AttackTargetStep>('none');
const [selectedEnemyId, setSelectedEnemyId] = useState<EnemyId | null>(null);
```

When `attackTarget === 'pick_enemy'`, EnemyPanel renders with a clickable/highlighted ring on alive enemies. Clicking dispatches the PLAYER_ACTION.

**Default target shortcut:** Auto-select first alive enemy when ATACAR is pressed (same UX as Encounter 1). Only show picker if there are 2+ alive enemies. This avoids friction in single-enemy encounters while providing clarity in multi-enemy ones.

**Keyboard shortcut:** After pressing `1` (ATACAR), `1`/`2`/`3` keys cycle through enemy targets for quick selection.

---

### Pattern 6: TARGET_LOWEST_HP AI

```typescript
TARGET_LOWEST_HP: (enemy, state) => {
  const validTargets = state.party.filter(c => !c.isDefeated);
  if (validTargets.length === 0) {
    console.error('TARGET_LOWEST_HP: no valid targets');
    return { actorId: enemy.id, description: '(no targets)', animationType: 'ATTACK' };
  }
  // Sort ascending by hp — first entry is lowest HP alive party member
  const target = [...validTargets].sort((a, b) => a.hp - b.hp)[0]!;
  const dmg = calculateDamage(enemy, target, {
    damageMultiplier: target.isDefending ? 0.5 : 1.0,
  });
  return {
    actorId: enemy.id,
    description: `${enemy.name} escana o grupo — mira em ${target.name} (HP mais baixo) — ${dmg} de dano`,
    hpDelta: [{ targetId: target.id, amount: -dmg }],
    animationType: 'ATTACK',
  };
},
```

**QA-04 compliance:** No `Math.random()` — pure sort is deterministic. No issue.

**Tie-breaking:** If two party members have the same HP, `.sort()` is stable (ES2019) and preserves declaration order — first declared in the party array wins. This is acceptable and consistent.

---

### Pattern 7: ATTACK_RANDOM AI

```typescript
ATTACK_RANDOM: (enemy, state) => {
  const validTargets = state.party.filter(c => !c.isDefeated);
  if (validTargets.length === 0) {
    console.error('ATTACK_RANDOM: no valid targets');
    return { actorId: enemy.id, description: '(no targets)', animationType: 'ATTACK' };
  }
  // QA-04: Math.random() inside AI fn is called from reducer dispatch (discrete event)
  // The reducer ground rules (comment line 24 in reducer.ts) explicitly permit Math.random()
  // "inside reducer" because dispatch is a discrete event, not a render.
  const idx = Math.floor(Math.random() * validTargets.length);
  const target = validTargets[idx]!;
  const dmg = calculateDamage(enemy, target, {
    damageMultiplier: target.isDefending ? 0.5 : 1.0,
  });
  return {
    actorId: enemy.id,
    description: `${enemy.name} varre o setor aleatoriamente — ${target.name} é atingida — ${dmg} de dano`,
    hpDelta: [{ targetId: target.id, amount: -dmg }],
    animationType: 'ATTACK',
  };
},
```

**QA-04 note:** `Math.random()` is called inside the AI function which is called from the `ENEMY_ACTION` reducer case. The reducer is invoked via `dispatch` — a discrete event, not the render path. Ground rule #3 in reducer.ts (`// 3. Math.random() is allowed here`) explicitly permits this. [VERIFIED: src/engine/reducer.ts line 24 comment]

---

### Pattern 8: DialogueBox Component

A full-screen overlay that renders a character portrait, speaker name, and dialogue text with a line-by-line reveal. Player advances via click or keyboard. Disappears when all lines are consumed.

```typescript
interface DialogueBoxProps {
  lines: DialogueLine[];
  onComplete: () => void;
}

interface DialogueLine {
  speaker: string;       // e.g., 'TORC', 'DEADZONE', 'NARRADOR'
  text: string;
  portrait?: string;     // combatantId for SpriteFallback
}
```

**Reveal pattern:** Render one line at a time. `currentLine` index in component state. On click or `Space`/`Enter`, advance `currentLine`. When `currentLine >= lines.length`, call `onComplete`.

**Where to use:** GameController renders `<DialogueBox>` when phase is `'ENCOUNTER_2_DIALOGUE'` or `'ENCOUNTER_3_DIALOGUE'`. When `onComplete` fires, GameController transitions to the corresponding battle phase.

**No React key prop trick needed:** DialogueBox is conditionally rendered by GameController. When it unmounts and remounts for E3, it starts fresh automatically because component state is local.

**Lore text for E2 dialogue (TORC introduction):**
```
TORC: "Você sobreviveu ao corredor. Impressionante para um Ghost."
TORC: "Saorla Byrne. Striker. Não venho pelo heroísmo — venho pela saída."
DEADZONE: "Forge Wall primeiro. Perguntas depois."
```

**Lore text for E3 dialogue (TRINETRA introduction):**
```
TRINETRA: "Meus sensores captaram o padrão de vocês dois. Eficiência aceitável."
TRINETRA: "Animesh Rao. Visionário. System Override já está calibrado."
TORC: "Trio completo. Próxima sala: Patrol Bots. Sigam minha formação."
```

---

### Pattern 9: TurnOrderIndicator

Derives directly from `state.turnQueue` and `state.currentTurnIndex`. Shows the next N entries (e.g., 5) starting from `currentTurnIndex + 1`.

```typescript
interface TurnOrderIndicatorProps {
  turnQueue: TurnEntry[];
  currentTurnIndex: number;
  party: Character[];
  enemies: Enemy[];
}

export function TurnOrderIndicator({ turnQueue, currentTurnIndex, party, enemies }: TurnOrderIndicatorProps) {
  // Show up to 5 upcoming combatants (wraps to next round if near end)
  const upcoming = [...Array(5)].map((_, i) => {
    const idx = (currentTurnIndex + 1 + i) % turnQueue.length;
    return turnQueue[idx];
  });
  // ...
}
```

**Caveat:** The "wrap to next round" visualization may show stale entries if a combatant dies mid-round. Options:
- Show only within the current round's remaining entries (cleaner, may show < 5)
- Show wrapped + gray out entries for dead combatants (more informative)

**Recommendation:** Show remaining current-round entries only (no wrap). This is honest about uncertainty of next round order. When queue exhausts, show empty or "end of round" message.

```typescript
const upcoming = turnQueue.slice(currentTurnIndex + 1);
```

**Render:** A horizontal list of combatant chips. Each chip shows name abbreviation + a small color dot (blue for player, red for enemy). Current actor is highlighted separately in the BattleScene header.

**No animation needed:** Static list that re-derives on every state change. No `key` rotation required — the list changes naturally as turns advance.

---

### Pattern 10: Status Icon in CharacterHUD

**Where to render:** Inside `CharacterHUD`, below the EN bar. Conditionally shown when `character.statusEffects.length > 0`.

```tsx
{/* Status effects row */}
{character.statusEffects.length > 0 && (
  <div className={styles.statusRow}>
    {character.statusEffects.map((effect, i) => (
      <span key={`${effect.type}-${i}`} className={styles.statusBadge} data-type={effect.type}>
        {STATUS_ICON_MAP[effect.type]}
        {effect.turnsRemaining}T
      </span>
    ))}
  </div>
)}
```

```typescript
const STATUS_ICON_MAP: Record<StatusEffectType, string> = {
  DEF_BUFF: 'SHIELD',
  OVERDRIVE_CHARGE: 'TERMINUS',
  DEFENDING: 'GUARD',
};
```

**CSS for badge:**

```css
.statusBadge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 7px;
  padding: 1px 4px;
  border-radius: 2px;
  font-family: var(--font-pixel), monospace;
}

.statusBadge[data-type="DEF_BUFF"] {
  background: rgba(0, 191, 255, 0.2);
  border: 1px solid var(--color-electric);
  color: var(--color-electric);
}
```

**Turn countdown "2T → 1T → gone":** The `turnsRemaining` value is already on the `StatusEffect` object. The badge renders `{effect.turnsRemaining}T` directly. When `turnsRemaining` reaches 0 after decrement, `decrementStatuses` filters it out and the badge disappears.

---

### Pattern 11: Camera Shake (VISUAL-04)

The `.shake` keyframe animation class already exists in `battle.module.css`. Phase 2 defined it but did not implement a trigger threshold. Phase 3 adds the threshold.

**Trigger condition:** Shake fires when a hit exceeds a threshold relative to the target's maxHp. Recommendation: `Math.abs(hpDelta.amount) >= Math.floor(target.maxHp * 0.2)` (hit for >= 20% of max HP).

**Implementation:** In the RESOLVING useEffect in BattleScene, alongside the existing flashVariant toggle, check hpDelta amounts:

```typescript
// In RESOLVING useEffect, after popup generation:
const heavyHit = state.pendingAction?.hpDelta?.some(d => {
  const target = [...state.party, ...state.enemies].find(c => c.id === d.targetId);
  return target && Math.abs(d.amount) >= Math.floor(target.maxHp * 0.2);
});
if (heavyHit) {
  setShakeVariant(v => v === 'a' ? 'b' : 'a');
}
```

**Same variant-toggle pattern as screen flash:** `.shakeA` and `.shakeB` share `@keyframes shake` but alternate class names to force DOM diff → animation restart.

```css
@keyframes shake {
  0%, 100% { transform: translate(0, 0); }
  25%       { transform: translate(-4px, 2px); }
  75%       { transform: translate(4px, -2px); }
}

.shakeA { animation: shake 300ms ease-in-out; }
.shakeB { animation: shake 300ms ease-in-out; }
```

**Apply to:** The outermost battle container (`div.relative.w-full`). This shakes the entire battle area. Use `key={shakeVariant}` on the container OR use a class toggle. Prefer class toggle (not key) because key remounts the entire tree — instead, a `data-shake` attribute + CSS animation restart via class rename is cleaner.

**VISUAL-07 compliance:** `transform: translate` is GPU-composited. No layout thrashing.

---

### Pattern 12: Visual Effects for SKILL_SHIELD and SKILL_HEAL (VISUAL-05)

Phase 2 added `SKILL_ELECTRIC` for Signal Null. Phase 3 adds `SKILL_SHIELD` (Forge Wall) and `SKILL_HEAL` (System Override).

```css
/* battle.module.css additions */

@keyframes shieldPulse {
  0%   { box-shadow: 0 0 0 0 rgba(0, 191, 255, 0.6); }
  50%  { box-shadow: 0 0 12px 4px rgba(0, 191, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 191, 255, 0); }
}

/* Applied to party area when SKILL_SHIELD resolves */
.skillShieldEffect {
  animation: shieldPulse 600ms ease-out;
}

@keyframes healRipple {
  0%   { opacity: 0.8; transform: scale(0.8); }
  100% { opacity: 0; transform: scale(1.6); }
}

/* Applied to healed character's HUD area when SKILL_HEAL resolves */
.skillHealEffect {
  animation: healRipple 500ms ease-out forwards;
  border-radius: 50%;
  border: 2px solid var(--color-cyan-neon);
  position: absolute;
  inset: 0;
}
```

**Trigger mechanism:** Same as screen flash — a `skillEffectVariant` useState toggle keyed to the AnimationType of the resolved action.

---

### Pattern 13: EncounterCompleteScreen (ENC-06)

Shown between encounters. Displays final party HP, a narrative sentence, and a "CONTINUAR" button.

```typescript
interface EncounterCompleteProps {
  party: Character[];
  encounterIndex: number;
  onContinue: () => void;
}
```

Narrative strings per encounter:
- E1 → E2: `"Corredor 7-A desobstruído. TORC emerge das sombras."`
- E2 → E3: `"Doca de Carga limpa. TRINETRA sincroniza com o grupo."`

**No animation needed:** Static overlay with Blue Wave palette. Press `Space` or click to continue.

---

### Recommended Project Structure Extension

```
src/
├── app/
│   └── page.tsx            ← Replace with GameController render
├── components/
│   ├── GameController.tsx  ← NEW: encounter state machine
│   ├── DialogueBox.tsx     ← NEW: cinematic text display
│   ├── EncounterCompleteScreen.tsx  ← NEW: interstitial
│   ├── TurnOrderIndicator.tsx       ← NEW: SPD queue display
│   ├── BattleScene.tsx     ← EXTEND: accept party/enemies as props
│   ├── ActionMenu.tsx      ← EXTEND: target selection state
│   ├── CharacterHUD.tsx    ← EXTEND: status effect icons
│   ├── EnemyPanel.tsx      ← EXTEND: multiple enemies, clickable targets
│   └── ...existing...
├── data/
│   ├── characters.ts       ← ADD: TORC, TRINETRA
│   ├── enemies.ts          ← ADD: NETWORKER_ENFORCER, CASTING_PATROL_BOT
│   └── encounters.ts       ← NEW: encounter configs (party + enemies per encounter)
└── engine/
    ├── reducer.ts          ← EXTEND: WR fixes + status effects + new skills
    ├── enemyAI.ts          ← EXTEND: TARGET_LOWEST_HP + ATTACK_RANDOM real
    └── ...no changes to types/damage/turnQueue/gameStateRef...
```

**`src/data/encounters.ts`** — centralizes encounter configuration:

```typescript
export interface EncounterConfig {
  index: number;
  background: 'corridor' | 'loading_dock' | 'server_room' | 'command_chamber';
  enemies: Enemy[];
  newPartyMember?: Character; // character that joins before this encounter
}

export const ENCOUNTER_CONFIGS: EncounterConfig[] = [
  { index: 0, background: 'corridor', enemies: [CASTING_PROBE_MK1] },
  { index: 1, background: 'loading_dock', enemies: [NETWORKER_ENFORCER_A, NETWORKER_ENFORCER_B], newPartyMember: TORC },
  { index: 2, background: 'server_room', enemies: [PATROL_BOT_A, PATROL_BOT_B, PATROL_BOT_C], newPartyMember: TRINETRA },
];
```

For multiple enemies of the same type, create distinct object instances with unique IDs: `NETWORKER_ENFORCER_A` (`id: 'NETWORKER_ENFORCER_A'`) and `NETWORKER_ENFORCER_B` (`id: 'NETWORKER_ENFORCER_B'`). This requires extending `EnemyId` in types.ts — or using a more flexible ID scheme.

**EnemyId extension:** Add to `src/engine/types.ts`:
```typescript
export type EnemyId =
  | 'CASTING_PROBE_MK1'
  | 'NETWORKER_ENFORCER_A'
  | 'NETWORKER_ENFORCER_B'
  | 'CASTING_PATROL_BOT_A'
  | 'CASTING_PATROL_BOT_B'
  | 'CASTING_PATROL_BOT_C'
  | 'AEGIS_7';
```

---

## Battle Math (Verified via Node.js)

### Encounter 2: DEADZONE + TORC vs 2 Networker Enforcers

| Action | Result |
|--------|--------|
| DEADZONE attacks Enforcer | 14 dmg |
| DEADZONE Signal Null vs Enforcer (defPen 0.7) | 17 dmg |
| TORC attacks Enforcer | 10 dmg |
| Enforcer attacks DEADZONE | 6 dmg |
| Enforcer attacks TORC (base) | 1 dmg (min 1) |
| Enforcer attacks DEADZONE (defending) | 3 dmg |
| Enforcer attacks TORC with DEF_BUFF +8 | 1 dmg (min 1; DEF_BUFF is very effective) |

Turn order (SPD desc, stable ties): `DEADZONE(18) → TORC(12) → ENFORCER_A(11) → ENFORCER_B(11)`

TORC EN budget for Forge Wall: Start 20 EN, cost 6/use. Two uses available (14, 8). Third use requires EN recovery via DEFENDER.

Enforcer HP 55 — needs 4 DEADZONE attacks OR a mix. Forge Wall makes TORC nearly immune (1 dmg per hit). DEADZONE is the priority target for TARGET_LOWEST_HP behavior.

### Encounter 3: DEADZONE + TORC + TRINETRA vs 3 Patrol Bots

| Action | Result |
|--------|--------|
| DEADZONE attacks Patrol Bot | 15 dmg |
| TORC attacks Patrol Bot | 11 dmg |
| TRINETRA attacks Patrol Bot | 8 dmg |
| Patrol Bot attacks DEADZONE | 3 dmg |
| Patrol Bot attacks TORC | 1 dmg (min 1) |
| Patrol Bot attacks TRINETRA | 1 dmg (min 1) |

Turn order: `DEADZONE(18) → TRINETRA(15) → TORC(12) → BOT_A(9) → BOT_B(9) → BOT_C(9)`

Patrol Bot HP 45 — 3 DEADZONE attacks to kill one, or 3 rounds of combined fire. With random targeting, damage is spread and manageable.

TRINETRA System Override: Start 35 EN, cost 10. Three full uses available (35 → 25 → 15 → 5; fourth blocked since 5 < 10). DEFENDER recovers 5 EN per use.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status effect decrement | Per-effect timer or custom countdown | `turnsRemaining` field + filter in `ACTION_RESOLVED` | Single source of truth, already in types.ts |
| Target selection UI | Custom overlay manager | Local `useState` in ActionMenu for step machine | Keeps reducer clean; no global state needed |
| Multi-enemy display | Custom carousel or scroll | Multiple EnemyPanel instances in flex row | Existing EnemyPanel works; just map over `state.enemies` |
| Encounter persistence | localStorage or URL params | `carryParty` state in GameController | Demo is linear; no persistence needed across page reloads |
| Dialogue system | State machine library | `currentLine` index in local useState | Linear dialogue with no branching needs < 20 lines of code |
| Turn order calculation | Re-sort on every render | Derive from `state.turnQueue` slice | turnQueue is already SPD-sorted by `buildTurnQueue` in reducer |
| Skill routing | New action types per skill | `actorId` switch in SKILL case | Scales cleanly; no new action types needed |

---

## Common Pitfalls

### Pitfall 1: WR-01/WR-02 Not Fixed Before First Multi-Enemy Test

**What goes wrong:** First Enforcer is killed mid-round. ENEMY_ACTION skip path fires. `phase` stays `'ENEMY_TURN'` forever. Game hangs.
**Why it happens:** Single-enemy Encounter 1 never triggered the skip path, so the bug was invisible.
**How to avoid:** Fix WR-01/WR-02 in Wave 0 (same wave as test infra). Write a Vitest test that kills one enemy mid-round and asserts `phase` transitions to `PLAYER_INPUT`.
**Warning signs:** Game stops accepting input after first enemy is killed.

### Pitfall 2: Status Effect `turnsRemaining` Decrementing Wrong

**What goes wrong:** DEF_BUFF applied at turn 1 with `turnsRemaining: 2` decrements to 0 before the player gets the benefit (because decrement fires immediately on the same turn).
**Why it happens:** Decrement order matters. If STATUS_APPLIED and decrement both happen in the same `ACTION_RESOLVED`, the newly applied effect gets decremented immediately.
**How to avoid:** Apply `statusApplied` entries FIRST, then decrement ALL statuses. The new effect starts at 2, gets decremented to 1 on that same ACTION_RESOLVED. This means the buff lasts for the current turn + 1 more full round = effectively 2 turns of protection. Alternatively: don't decrement in the same ACTION_RESOLVED where STATUS_APPLIED was set. Both interpretations are valid design choices; pick one and document it.
**Recommendation:** Decrement AFTER applying — results in 2 decrement cycles (buff lasts 2 full turns of enemy attacks). This matches the "2 turns" spec.

### Pitfall 3: Multiple Enemy Instances Sharing the Same Object Reference

**What goes wrong:** `ENCOUNTER_CONFIGS` has `enemies: [NETWORKER_ENFORCER, NETWORKER_ENFORCER]` (same reference). The INIT case does `enemies.map(e => ({ ...e }))` — shallow spread. Both get unique top-level objects, but they have the same `id`. The reducer uses `id` for all lookups. Two enemies with the same id are indistinguishable.
**How to avoid:** Create distinct data objects with unique IDs per instance: `NETWORKER_ENFORCER_A`, `NETWORKER_ENFORCER_B`. Extend `EnemyId` type accordingly.

### Pitfall 4: GameController `onVictory` Using Stale `state.party`

**What goes wrong:** `onVictory` callback in BattleScene closes over initial `party` prop (always full HP) instead of reading final reducer state.
**How to avoid:** Use a `useEffect` watching `state.phase === 'VICTORY'` to call `onVictory(stateRef.current.party)` — read from `stateRef.current` (fresh). Do NOT call `onVictory(state.party)` in a timeout closure.

```typescript
// In BattleScene:
useEffect(() => {
  if (state.phase === 'VICTORY') {
    onVictory(stateRef.current.party); // fresh state via ref
  }
}, [state.phase, onVictory, stateRef]);
```

### Pitfall 5: ActionMenu SkillSelectStep Not Resetting on Phase Change

**What goes wrong:** Player opens ally target picker for System Override, then somehow the phase changes to RESOLVING (e.g., an enemy sneak attack due to a bug). The target picker UI persists even though it's not PLAYER_INPUT.
**How to avoid:** In ActionMenu, add a `useEffect` that resets `skillSelect` to `{ step: 'none' }` whenever `phase !== 'PLAYER_INPUT'`.

### Pitfall 6: Attack Default-Target on Single Alive Enemy vs Multiple

**What goes wrong:** With 2 enemies, ATACAR auto-dispatches to first enemy. First enemy dies. Second enemy is alive. Player clicks ATACAR again and auto-dispatches to `enemies[0]` — but `enemies[0]` is defeated. Reducer's PLAYER_ACTION ATTACK case does `state.enemies.find(e => e.id === targetId)!` and gets the defeated enemy.
**How to avoid:** Auto-select logic in BattleScene must filter to `enemies.filter(e => !e.isDefeated)[0]`. The reducer itself should also guard: if the targeted enemy is defeated, return same state (no-op with console.warn). Add this safety net.

### Pitfall 7: `turnsRemaining` Decrement Timing with Multi-Enemy AI

**What goes wrong:** In a round where 5 combatants act, `ACTION_RESOLVED` fires 5 times. If decrement happens in each ACTION_RESOLVED, a 2-turn DEF_BUFF decrements 5 times (once per action, not once per round).
**How to avoid:** Decrement per ACTION_RESOLVED is CORRECT — each action represents one "action step." A 2-turn buff should last for 2 action steps of ENEMY attacks, not 2 full rounds. If the design intent is "2 player turns," adjust `turnsRemaining` initialization. Check PROJECT.md: "DEF +8 por 2 turnos" — in context, "turno" likely means player turns, not action steps. [ASSUMED: design intent is 2 ROUNDS, not 2 action steps]

**Safer implementation:** Decrement status effects only at end-of-round (when `nextIndex >= state.turnQueue.length` triggers queue rebuild). This guarantees 2-turn buff = 2 full rounds. Change: move `decrementStatuses` call to inside the end-of-round branch of ACTION_RESOLVED's turn-advance logic.

```typescript
// At end-of-round queue rebuild:
if (nextIndex >= state.turnQueue.length) {
  const newQueue = buildTurnQueue(newParty, newEnemies);
  // Decrement statuses at end-of-round only (1 decrement per round)
  newParty = decrementStatuses(newParty);
  newEnemies = decrementStatuses(newEnemies);
  // ...
}
```

### Pitfall 8: BattleScene INIT Guard with Changing Props

**What goes wrong:** `initFired.current` prevents re-INIT. But if `party` prop changes (e.g., GameController unmounts and remounts BattleScene with new data), the new BattleScene instance correctly starts fresh. However, if for some reason BattleScene re-renders without unmounting (which React's `key` prop increment prevents), `initFired.current` would still be `true` from the previous encounter.
**How to avoid:** GameController MUST increment a `key` prop on `<BattleScene>` at each encounter transition. This destroys the component tree, resets all useState and useRef, and forces fresh INIT. This is already the established pattern (`battleKey` increment) — extend it to encounter transitions.

---

## Data Objects to Create

### TORC (src/data/characters.ts addition)

```typescript
export const TORC: Character = {
  kind: 'player',
  id: 'TORC',
  name: 'TORC',
  hp: 130, maxHp: 130,
  en: 20, maxEn: 20,
  atk: 18, def: 20, spd: 12,
  statusEffects: [],
  isDefeated: false,
  isDefending: false,
};
```

### TRINETRA (src/data/characters.ts addition)

```typescript
export const TRINETRA: Character = {
  kind: 'player',
  id: 'TRINETRA',
  name: 'TRINETRA',
  hp: 85, maxHp: 85,
  en: 35, maxEn: 35,
  atk: 15, def: 12, spd: 15,
  statusEffects: [],
  isDefeated: false,
  isDefending: false,
};
```

### NETWORKER_ENFORCER_A / _B (src/data/enemies.ts)

```typescript
const networkerEnforcerBase = {
  kind: 'enemy' as const,
  name: 'Networker Enforcer',
  hp: 55, maxHp: 55,
  en: 0, maxEn: 0,
  atk: 16, def: 8, spd: 11,
  statusEffects: [],
  isDefeated: false,
  behavior: 'TARGET_LOWEST_HP' as const,
};

export const NETWORKER_ENFORCER_A: Enemy = { ...networkerEnforcerBase, id: 'NETWORKER_ENFORCER_A' };
export const NETWORKER_ENFORCER_B: Enemy = { ...networkerEnforcerBase, id: 'NETWORKER_ENFORCER_B' };
```

### CASTING_PATROL_BOT_A / _B / _C (src/data/enemies.ts)

```typescript
const patrolBotBase = {
  kind: 'enemy' as const,
  name: 'Casting Patrol Bot',
  hp: 45, maxHp: 45,
  en: 0, maxEn: 0,
  atk: 13, def: 7, spd: 9,
  statusEffects: [],
  isDefeated: false,
  behavior: 'ATTACK_RANDOM' as const,
};

export const CASTING_PATROL_BOT_A: Enemy = { ...patrolBotBase, id: 'CASTING_PATROL_BOT_A' };
export const CASTING_PATROL_BOT_B: Enemy = { ...patrolBotBase, id: 'CASTING_PATROL_BOT_B' };
export const CASTING_PATROL_BOT_C: Enemy = { ...patrolBotBase, id: 'CASTING_PATROL_BOT_C' };
```

**EnemyId type extension required** — add all six new IDs to `types.ts`.

---

## Lore Text Reference

| Action | Log Text |
|--------|----------|
| TORC ATACAR | `"TORC investe com carga estrutural — impacto analógico — {dmg} de dano"` |
| TORC Forge Wall | `"TORC ergue o FORGE WALL — barreira analógica ativada — DEF +8 por 2 turnos"` |
| TORC DEFENDER | `"TORC assume posição defensiva — resistência máxima — recupera 5 EN"` |
| TRINETRA ATACAR | `"TRINETRA executa varredura de protocolo — {dmg} de dano"` |
| TRINETRA System Override (heal) | `"TRINETRA executa SYSTEM OVERRIDE — restaura {hp} HP em {target}"` |
| TRINETRA System Override (clear) | `"TRINETRA executa SYSTEM OVERRIDE — status limpo em {target}"` |
| TRINETRA DEFENDER | `"TRINETRA entra em modo de espera analítica — recupera 5 EN"` |
| Networker Enforcer attacks | `"{enemy.name} mira no alvo mais vulnerável — {target.name} sob ataque — {dmg} de dano"` |
| Networker Enforcer attacks defending | `"{enemy.name} mira em {target.name} — DEFENDER absorve o impacto — {dmg} de dano"` |
| Casting Patrol Bot attacks | `"{enemy.name} varre o setor aleatoriamente — {target.name} é atingida — {dmg} de dano"` |
| E2 Victory | `"Docas de Carga: Networker Enforcers neutralizados. Rota para o servidor desobstruída."` |
| E3 Victory | `"Sala de Servidores: Patrol Bots neutralizados. AEGIS-7 detectado no nível superior."` |

---

## Environment Availability

Step 2.6 audit: Phase 3 is code + config only. No new external services, databases, or OS tools needed.

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js >= 20 | Next.js 14 | Confirmed (Phase 2 build passed) | No action needed |
| @testing-library/react | Component tests | Installed in Phase 2 | No action needed |
| jsdom | Component tests | Installed in Phase 2 | No action needed |

No missing dependencies. All infra from Phase 2 carries forward.

---

## Validation Architecture

`nyquist_validation: true` in config.json — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `vitest.config.ts` (updated in Phase 2 with jsdom env) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKILL-02 | Forge Wall: DEF_BUFF applied to all alive party; turnsRemaining: 2 | unit | `npm run test -- src/engine/reducer.test.ts` | Partial (new cases needed) |
| SKILL-02 | getEffectiveDef uses DEF_BUFF magnitude: TORC DEF = 20+8 = 28 | unit | `npm run test -- src/engine/damage.test.ts` | Partial (already tests DEF_BUFF path) |
| SKILL-03 | System Override heal: hpDelta applied, EN cost 10 deducted | unit | `npm run test -- src/engine/reducer.test.ts` | New cases needed |
| SKILL-03 | System Override remove status: statusRemoved applied | unit | `npm run test -- src/engine/reducer.test.ts` | New cases needed |
| SKILL-05 | DEF_BUFF turnsRemaining decrements end-of-round; expires after 2 rounds | unit | `npm run test -- src/engine/reducer.test.ts` | New integration test |
| AI-03 | TARGET_LOWEST_HP: selects party member with lowest HP | unit | `npm run test -- src/engine/enemyAI.test.ts` | New cases needed |
| AI-03 | TARGET_LOWEST_HP: applies isDefending multiplier 0.5 | unit | `npm run test -- src/engine/enemyAI.test.ts` | New cases needed |
| AI-04 | ATTACK_RANDOM: returns valid alive target (probabilistic — test with fixed seed or run N times) | unit | `npm run test -- src/engine/enemyAI.test.ts` | New cases needed |
| ENC-05 | HP from E1 carries to E2 init; EN resets to maxEn | unit | `npm run test -- src/engine/reducer.test.ts` | New integration test |
| WR-01 fix | ENEMY_ACTION skip of defeated enemy transitions phase correctly | unit | `npm run test -- src/engine/reducer.test.ts` | New regression test |
| WR-02 fix | NEXT_TURN transitions phase based on next queue entry | unit | `npm run test -- src/engine/reducer.test.ts` | New regression test |
| WR-04 fix | Enemy HP clamped to maxHp on positive delta | unit | `npm run test -- src/engine/reducer.test.ts` | New test |
| ENC-02 | E2 full turn cycle: 2 players + 2 enemies, correct queue ordering | integration | `npm run test -- src/engine/reducer.test.ts` | New integration test |
| UI-06 | DialogueBox renders lines; advances on click; calls onComplete | component | `npm run test -- src/components/DialogueBox.test.tsx` | New file (Wave 0 gap) |
| UI-08 | TurnOrderIndicator shows remaining queue entries | component | `npm run test -- src/components/TurnOrderIndicator.test.tsx` | New file (Wave 0 gap) |
| VISUAL-04 | Camera-shake fires when hit >= 20% maxHp | manual (browser) | — | N/A |
| VISUAL-05 | Forge Wall + System Override CSS effects visible | manual (browser) | — | N/A |

### Sampling Rate

- **Per task commit:** `npm run test` (all tests, ~5s)
- **Per wave merge:** `npm run test:coverage`
- **Phase gate:** Full suite green + `npm run build` exits 0 + manual browser playthrough of E2 and E3 before marking Phase 3 complete

### Wave 0 Gaps

- [ ] `src/engine/reducer.test.ts` — add: WR-01/WR-02/WR-04 regression tests; SKILL-02/03/05 cases; ENC-05 HP-persistence test; multi-enemy turn cycle integration test
- [ ] `src/engine/enemyAI.test.ts` — add: TARGET_LOWEST_HP targeting and dmg tests; ATTACK_RANDOM alive-target assertion
- [ ] `src/components/DialogueBox.test.tsx` — new file: line rendering, click-to-advance, onComplete callback
- [ ] `src/components/TurnOrderIndicator.test.tsx` — new file: renders slice of turnQueue from currentTurnIndex+1

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Status effects decrement end-of-round (not per action step) | STATUS EFFECTS, Pitfall 7 | If per-step, DEF_BUFF expires much faster than the 2-round player expectation |
| A2 | `statusEffects` cleared on encounter transition | ENCOUNTER CHAIN | If not cleared, DEF_BUFF from E2 could carry into E3 (minor advantage, arguably acceptable) |
| A3 | Auto-select first alive enemy for ATACAR when only 1 alive; show picker with 2+ | MULTI-ENEMY TARGET | If player prefers always-explicit selection, a picker on every attack adds friction |
| A4 | System Override `REMOVE_STATUS` removes the FIRST status effect found | SYSTEM OVERRIDE | If multiple statuses exist, player may want to choose which to remove |
| A5 | Camera shake threshold: 20% of maxHp | CAMERA SHAKE | Different feel at different thresholds; may need tuning |
| A6 | Lore voice: "TRINETRA" is feminine in Portuguese context | LORE TEXT | If masculine, "atingida" → "atingido" in bot attack text |

---

## Open Questions

1. **Status decrement granularity**
   - What we know: "2 turnos" for DEF_BUFF per PROJECT.md spec.
   - What's unclear: Does "turno" mean a full round (all combatants act once) or an action step?
   - Recommendation: Implement end-of-round decrement (Pitfall 7 mitigation). Provides the clearest player-legible behavior: "2 turns = 2 rounds."

2. **System Override: remove which status?**
   - What we know: SKILL-03 says "remove status negativo." Encounter 3 doesn't introduce negative statuses — this is mostly future-proofing.
   - What's unclear: If multiple negative statuses exist, which to remove? Auto-remove first? Let player pick?
   - Recommendation: Auto-remove the first `statusEffect` that is not `DEF_BUFF` or `DEFENDING` (i.e., remove negative effects). In Phase 3 context, there are no negative status effects yet — the ability is future-proofed but won't trigger removal in Phase 3. [ASSUMED]

3. **EncounterCompleteScreen scope**
   - What we know: ENC-06 requires an interstitial "ENCOUNTER COMPLETE" between encounters.
   - What's unclear: Does it require party HP display? A "CONTINUAR" button with space/click? Timer auto-advance?
   - Recommendation: Static screen with party HP display + "CONTINUAR" button (Space or click). No timer — player controls pacing.

4. **DISRUPTED status (from STATE.md open todo)**
   - What we know: STATE.md notes "Decide on optional DISRUPTED status effect (4th status) during Phase 3 planning."
   - Recommendation: Defer to Phase 4. Signal Null in Encounter 2 and 3 is not mandatory by any requirement, and adding DISRUPTED adds scope. Phase 3 already has DEF_BUFF and status removal; that's sufficient complexity.

---

## Standard Stack

No new libraries needed for Phase 3. All work is pure extension of existing stack.

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Next.js | 14.2.35 | App shell | Installed |
| React | ^18 | UI rendering | Installed |
| TypeScript | ^5 | Strict types | Installed |
| Tailwind CSS | ^4.2.4 | Layout + Blue Wave palette | Installed |
| Vitest | ^2.1.9 | Engine unit tests | Installed |
| @testing-library/react | ^16 | Component tests | Installed (Phase 2) |
| jsdom | ^25 | DOM for component tests | Installed (Phase 2) |

No `npm install` needed in Phase 3 Wave 0 — all dependencies are already present.

---

## State of the Art

| Phase 2 Pattern | Phase 3 Extension | Why |
|----------------|-------------------|-----|
| Hardcoded `DEADZONE` + `CASTING_PROBE_MK1` in BattleScene | Parameterized `party` + `enemies` props from GameController | Multi-encounter chain |
| Single `ACTION_RESOLVED` applying hp/en deltas | Same + status application/removal + end-of-round decrement | Status effect lifecycle |
| SKILL case routing by `actorId` (only DEADZONE) | Three actors: DEADZONE/TORC/TRINETRA routing | All three skills unique |
| ActionMenu: 4 fixed buttons, no target selection | Two-step target picker for System Override + enemy picker for ATACAR | Multi-party mechanics |
| Single EnemyPanel | Multiple EnemyPanel instances, clickable for target selection | Multi-enemy encounters |
| Screen flash only | Screen flash + camera shake (threshold-gated) + skill-specific CSS effects | Richer feedback |

---

## Sources

### Primary (HIGH confidence — verified against codebase this session)

- `src/engine/types.ts` — `StatusEffect`, `StatusApplied`, `StatusRemoved`, `ResolvedAction` types confirmed complete
- `src/engine/reducer.ts` — WR-01 at lines 241-248 verified; WR-02 at lines 259-271 verified; ACTION_RESOLVED pattern confirmed
- `src/engine/damage.ts` — `getEffectiveDef()` reads `DEF_BUFF` statusEffects confirmed at lines 37-40
- `src/engine/enemyAI.ts` — TARGET_LOWEST_HP and ATTACK_RANDOM stubs confirmed at lines 43-44
- `src/components/BattleScene.tsx` — hardcoded DEADZONE+PROBE confirmed at lines 62-63; stateRef pattern confirmed
- `src/components/CharacterHUD.tsx` — no statusEffects rendering; defendingBadge pattern available to extend
- `src/components/ActionMenu.tsx` — 4 fixed buttons confirmed; no target picker logic exists
- `src/app/page.tsx` — simple `battleKey + BattleScene`; needs GameController upgrade
- `src/data/characters.ts` — DEADZONE only; TORC/TRINETRA absent
- `src/data/enemies.ts` — CASTING_PROBE_MK1 only; Enforcer/PatrolBot/AEGIS-7 absent
- `src/styles/battle.module.css` — `.shake` keyframe exists at lines 121-131; `.shakeA`/`.shakeB` variant classes NOT yet present (need adding)
- Battle math: verified via Node.js computation against actual stat values from PROJECT.md

### Secondary (MEDIUM confidence — Phase 2 research carry-forward)

- `.planning/phases/02-encounter-1-deadzone-solo/02-RESEARCH.md` — turn loop architecture, ResolvedAction bridge pattern, Pitfall documentation
- `.planning/phases/02-encounter-1-deadzone-solo/02-REVIEW.md` — WR-01/WR-02/WR-03/WR-04 bug documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified package.json; no new installs
- Architecture (encounter chain): HIGH — BattleScene source read directly; extension points identified
- Status effects: HIGH — types already complete; damage.ts integration verified
- AI behaviors: HIGH — stubs read directly; pattern from ALWAYS_ATTACK is clear template
- Battle math: HIGH — computed via Node.js against spec values
- Pitfalls: HIGH — derived from direct code analysis + Phase 2 review findings

**Research date:** 2026-04-26
**Valid until:** Valid until any Phase 2 source file is modified. If reducer.ts, types.ts, or damage.ts changes, re-read those files before executing Phase 3 plans.
