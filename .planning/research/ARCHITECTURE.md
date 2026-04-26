# Architecture Patterns: Browser JRPG Battle Engine

**Domain:** Turn-based JRPG battle engine in React/TypeScript
**Researched:** 2026-04-25
**Confidence:** HIGH — patterns verified across game programming literature, Redux architecture articles, React official docs, and game dev community sources.

---

## Recommended Architecture

The engine is a **pure React state machine** driven by a single `useReducer` at the page level, with game logic extracted into pure functions called from inside the reducer. No external state management libraries. No game engine frameworks.

The mental model is:

```
Pure Logic Layer     →  Reducer Layer         →  Component Layer
(battleEngine.ts)       (useBattleReducer.ts)     (BattleScene.tsx + children)
calculateDamage()       dispatch(action)           reads state, renders UI
buildTurnQueue()        returns next state         calls dispatch on user input
resolveEnemyAction()    guards invalid transitions does NOT own logic
```

This separation is the single most important architectural decision. Every piece of game logic that can be a pure function (no side effects, deterministic output) must live outside React. The reducer only calls those functions and assembles the next state object. Components are dumb — they render state and fire dispatches.

---

## Battle State Machine

### States

Use a discriminated union type for the battle phase. The machine is in exactly one phase at a time.

```typescript
type BattlePhase =
  | { type: 'PLAYER_INPUT'; actorIndex: number }         // waiting for player to pick an action
  | { type: 'ENEMY_TURN'; actorIndex: number }           // enemy is deciding/acting
  | { type: 'RESOLVING'; pendingAction: ResolvedAction } // mid-animation, no input accepted
  | { type: 'OVERDRIVE_WARNING' }                        // AEGIS-7 announced charge; show warning UI
  | { type: 'OVERDRIVE_RESOLVING' }                      // executing the TERMINUS attack
  | { type: 'VICTORY' }
  | { type: 'DEFEAT' }
  | { type: 'GAME_OVER' }                                // whole run ends (all 4 encounters lost)
```

**Why these specific states matter:**

- `PLAYER_INPUT` is the only state where the action menu is rendered and clickable. Any other state: UI is locked.
- `RESOLVING` is the "please wait" gate. The reducer sets this when an action is dispatched; a `useEffect` watches for it, runs the animation timeout, then dispatches `ACTION_COMPLETE` to advance.
- `OVERDRIVE_WARNING` is a distinct state so the UI can show the warning banner for one full round before TERMINUS fires. It is separate from `RESOLVING` because no action is mid-flight — it is a persistent status the player must react to.
- `ENEMY_TURN` exists so the UI can show "ENEMY IS ACTING" and disable input, even though enemy decisions are instant (no waiting for human input).

### State Transition Graph

```
PLAYER_INPUT
  → RESOLVING         (player submits an action)
  → OVERDRIVE_WARNING (AEGIS-7 drops below 100 HP after player action resolves)

RESOLVING
  → PLAYER_INPUT      (action resolved, next actor is a player character)
  → ENEMY_TURN        (action resolved, next actor is an enemy)
  → VICTORY           (all enemies HP <= 0)
  → DEFEAT            (all party members HP <= 0)
  → OVERDRIVE_WARNING (boss HP condition met)

ENEMY_TURN
  → RESOLVING         (enemy action selected, animating)

OVERDRIVE_WARNING
  → PLAYER_INPUT      (warning delivered, player must act next turn)
  
OVERDRIVE_RESOLVING
  → DEFEAT / GAME_OVER (any player who didn't DEFEND takes 999 damage)

VICTORY
  → (handled by game flow controller, not battle reducer)

DEFEAT / GAME_OVER
  → (terminal states in battle, handled by game flow controller)
```

---

## TypeScript Data Model

These types should live in `/src/lib/battle/types.ts`. Every other module imports from here.

```typescript
// ── Core character types ──────────────────────────────────────────────────

export type CharacterId = 'DEADZONE' | 'TORC' | 'TRINETRA';
export type EnemyId =
  | 'CASTING_PROBE_MK1'
  | 'NETWORKER_ENFORCER'
  | 'CASTING_PATROL_BOT'
  | 'AEGIS_7';

export type CombatantId = CharacterId | EnemyId;

export interface CombatantBase {
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

export interface PlayerCharacter extends CombatantBase {
  kind: 'player';
  id: CharacterId;
  skill: SkillDefinition;
  isDefending: boolean; // set on DEFEND action, cleared at start of that character's next turn
}

export interface Enemy extends CombatantBase {
  kind: 'enemy';
  id: EnemyId;
  behavior: EnemyBehavior;
  isOverdriveActive?: boolean; // AEGIS-7 specific
}

export type Combatant = PlayerCharacter | Enemy;

// ── Turn queue ────────────────────────────────────────────────────────────

export interface TurnEntry {
  combatantId: CombatantId;
  kind: 'player' | 'enemy';
  spd: number; // snapshot at queue build time
}

// ── Status effects ────────────────────────────────────────────────────────

export type StatusEffectType =
  | 'DEF_BUFF'          // TORC's Forge Wall
  | 'OVERDRIVE_CHARGE'  // AEGIS-7 charging TERMINUS
  | 'DEFENDING';        // player chose DEFEND this turn

export interface StatusEffect {
  type: StatusEffectType;
  turnsRemaining: number;   // counts down per turn of the affected combatant
  magnitude?: number;       // e.g., +8 for DEF_BUFF
  appliedBy?: CombatantId;
}

// ── Actions ───────────────────────────────────────────────────────────────

export type PlayerActionType = 'ATTACK' | 'SKILL' | 'DEFEND' | 'ITEM';

export interface PlayerAction {
  type: PlayerActionType;
  actorId: CharacterId;
  targetId?: CombatantId;   // required for ATTACK, SKILL targeting enemy or ally
}

export interface ResolvedAction {
  actorId: CombatantId;
  description: string;      // narrative text: "DEADZONE uses Signal Null!"
  hpDelta?: { targetId: CombatantId; amount: number }[];
  enDelta?: { targetId: CombatantId; amount: number }[];
  statusApplied?: { targetId: CombatantId; effect: StatusEffect }[];
  statusRemoved?: { targetId: CombatantId; effectType: StatusEffectType }[];
  animationType: AnimationType;
}

export type AnimationType =
  | 'ATTACK'
  | 'SKILL_ELECTRIC'  // Signal Null
  | 'SKILL_SHIELD'    // Forge Wall
  | 'SKILL_HEAL'      // System Override
  | 'OVERDRIVE_WARNING'
  | 'OVERDRIVE_TERMINUS'
  | 'DEFEND'
  | 'ITEM';

// ── Skills ────────────────────────────────────────────────────────────────

export interface SkillDefinition {
  id: string;
  name: string;
  enCost: number;
  targetType: 'SINGLE_ENEMY' | 'ALL_ALLIES' | 'SINGLE_ALLY';
  execute: (actor: PlayerCharacter, target: Combatant | Combatant[]) => ResolvedAction;
}

// ── Enemy AI ──────────────────────────────────────────────────────────────

export type EnemyBehaviorType =
  | 'ALWAYS_ATTACK'       // Casting Probe MK-I
  | 'TARGET_LOWEST_HP'    // Networker Enforcer
  | 'ATTACK_RANDOM'       // Casting Patrol Bot
  | 'OVERDRIVE_BOSS';     // AEGIS-7

export interface EnemyBehavior {
  type: EnemyBehaviorType;
}

// ── Battle state ──────────────────────────────────────────────────────────

export interface BattleState {
  phase: BattlePhase;
  party: PlayerCharacter[];       // always 1–3 depending on encounter
  enemies: Enemy[];
  turnQueue: TurnEntry[];         // ordered: index 0 acts next
  currentTurnIndex: number;       // which entry in turnQueue is now active
  round: number;                  // increments each full cycle through turnQueue
  pendingAction: ResolvedAction | null;
  log: string[];                  // narrative log entries, last-in-first displayed
  encounter: EncounterNumber;
}

export type EncounterNumber = 1 | 2 | 3 | 4;

// ── Game flow ─────────────────────────────────────────────────────────────

export type GamePhase =
  | 'INTRO'
  | 'ENCOUNTER_1'
  | 'ENCOUNTER_2'
  | 'ENCOUNTER_3'
  | 'ENCOUNTER_4'
  | 'VICTORY_SCREEN'
  | 'GAME_OVER_SCREEN';

export interface GameState {
  gamePhase: GamePhase;
  party: PlayerCharacter[]; // carries HP/EN between encounters (no full heal between)
  battleState: BattleState | null;
}
```

**Design rationale:**
- `isDefending` lives directly on `PlayerCharacter` rather than as a `StatusEffect` because it is read every single OVERDRIVE resolution check. A direct boolean lookup is cleaner than filtering arrays.
- `ResolvedAction` is the bridge between pure logic and UI. The reducer produces it, stores it as `pendingAction`, the animation system consumes it, and UI reads it for log messages.
- `TurnEntry` snapshots `spd` at queue-build time so stat changes mid-round do not retroactively reorder the current round (which is the correct JRPG convention).

---

## Turn Queue: SPD-Based Ordering

### Algorithm

Use a simple sort, not an ATB gauge. For this demo's scope (at most 6 combatants), performance is irrelevant. Predictability is the priority.

```typescript
// /src/lib/battle/turnQueue.ts

export function buildTurnQueue(
  party: PlayerCharacter[],
  enemies: Enemy[]
): TurnEntry[] {
  const all: TurnEntry[] = [
    ...party
      .filter(c => !c.isDefeated)
      .map(c => ({ combatantId: c.id, kind: 'player' as const, spd: c.spd })),
    ...enemies
      .filter(e => !e.isDefeated)
      .map(e => ({ combatantId: e.id, kind: 'enemy' as const, spd: e.spd })),
  ];

  // Sort descending by SPD. Stable sort preserves declaration order for ties.
  // In ties, party members declared first go before enemies (player-favoring tie-break).
  return all.sort((a, b) => b.spd - a.spd);
}
```

### Round Management

The queue is rebuilt at the start of each new round, not each turn. This means:
1. Defeated combatants are removed from the next round's queue automatically.
2. New combatants (e.g., if enemies spawned — not needed here, but the pattern holds) are included.
3. SPD changes from status effects apply at round start, not mid-round.

```typescript
// In the reducer, after advancing currentTurnIndex:
const nextIndex = state.currentTurnIndex + 1;
if (nextIndex >= state.turnQueue.length) {
  // New round
  const newQueue = buildTurnQueue(state.party, state.enemies);
  return { ...state, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1 };
} else {
  return { ...state, currentTurnIndex: nextIndex };
}
```

### SPD Values for Reference

From PROJECT.md: DEADZONE 18, TRINETRA 15, TORC 12, Networker Enforcer 11, Casting Probe MK-I 10, Casting Patrol Bot 9, AEGIS-7 8.

First-round queue (Encounter 4, all 3 party + boss): DEADZONE → TRINETRA → TORC → AEGIS-7. No ties, no ambiguity.

---

## Damage Calculation: Pure Functions

All game math lives in `/src/lib/battle/battleEngine.ts`. These are ordinary TypeScript functions — no hooks, no React, fully testable with Jest.

```typescript
// /src/lib/battle/battleEngine.ts

export function calculatePhysicalDamage(
  attacker: CombatantBase,
  defender: CombatantBase
): number {
  // Base formula: ATK - DEF, minimum 1
  const defValue = getEffectiveDef(defender); // accounts for DEF_BUFF status
  return Math.max(1, attacker.atk - defValue);
}

export function getEffectiveDef(combatant: CombatantBase): number {
  const buffEffect = combatant.statusEffects.find(e => e.type === 'DEF_BUFF');
  return combatant.def + (buffEffect?.magnitude ?? 0);
}

export function calculateSignalNullDamage(
  attacker: PlayerCharacter, // DEADZONE
  defender: Enemy
): number {
  // Ignores 30% of enemy DEF
  const reducedDef = Math.floor(getEffectiveDef(defender) * 0.7);
  return Math.max(1, attacker.atk - reducedDef);
}

export function resolvePlayerAttack(
  actor: PlayerCharacter,
  target: Enemy
): ResolvedAction {
  const dmg = calculatePhysicalDamage(actor, target);
  return {
    actorId: actor.id,
    description: `${actor.name} attacks ${target.name} for ${dmg} damage.`,
    hpDelta: [{ targetId: target.id, amount: -dmg }],
    animationType: 'ATTACK',
  };
}
```

**Rule:** The reducer calls these functions and applies the resulting `ResolvedAction` to state. The reducer never contains arithmetic. Functions never mutate state — they return value objects.

---

## Enemy AI: Strategy Pattern via Function Map

Avoid classes. Use a function map keyed by `EnemyBehaviorType`. This is the idiomatic TypeScript equivalent of the Strategy pattern — clean, extensible, zero inheritance.

```typescript
// /src/lib/battle/enemyAI.ts

type AIFn = (enemy: Enemy, party: PlayerCharacter[]) => ResolvedAction;

const AI_BEHAVIORS: Record<EnemyBehaviorType, AIFn> = {
  ALWAYS_ATTACK: (enemy, party) => {
    const target = party.filter(c => !c.isDefeated)[0]; // first alive member
    const dmg = calculatePhysicalDamage(enemy, target);
    return {
      actorId: enemy.id,
      description: `${enemy.name} attacks ${target.name}!`,
      hpDelta: [{ targetId: target.id, amount: -dmg }],
      animationType: 'ATTACK',
    };
  },

  TARGET_LOWEST_HP: (enemy, party) => {
    const alive = party.filter(c => !c.isDefeated);
    const target = alive.reduce((lowest, c) =>
      c.hp < lowest.hp ? c : lowest
    );
    const dmg = calculatePhysicalDamage(enemy, target);
    return {
      actorId: enemy.id,
      description: `${enemy.name} targets ${target.name} (lowest HP)!`,
      hpDelta: [{ targetId: target.id, amount: -dmg }],
      animationType: 'ATTACK',
    };
  },

  ATTACK_RANDOM: (enemy, party) => {
    const alive = party.filter(c => !c.isDefeated);
    const target = alive[Math.floor(Math.random() * alive.length)];
    const dmg = calculatePhysicalDamage(enemy, target);
    return {
      actorId: enemy.id,
      description: `${enemy.name} lashes out at ${target.name}!`,
      hpDelta: [{ targetId: target.id, amount: -dmg }],
      animationType: 'ATTACK',
    };
  },

  OVERDRIVE_BOSS: (enemy, party) => {
    // AEGIS-7 uses this behavior; it dispatches different actions
    // depending on whether OVERDRIVE_CHARGE status is active
    return resolveAEGIS7Turn(enemy as Enemy & { id: 'AEGIS_7' }, party);
  },
};

export function resolveEnemyAction(enemy: Enemy, party: PlayerCharacter[]): ResolvedAction {
  return AI_BEHAVIORS[enemy.behavior.type](enemy, party);
}
```

Adding a new enemy type means adding one entry to `AI_BEHAVIORS`. No switch statements to extend, no class hierarchies.

---

## OVERDRIVE Mechanic: State-Driven Warning + Execution

OVERDRIVE is architecturally a two-phase state change, not a single action.

### Phase 1: Trigger Detection (end of player action that drops AEGIS-7 below 100 HP)

Inside the reducer's `RESOLVE_ACTION` handler:

```typescript
// After applying hpDelta...
const aegis = updatedEnemies.find(e => e.id === 'AEGIS_7');
if (aegis && aegis.hp < 100 && !aegis.isOverdriveActive) {
  // Mark OVERDRIVE as active on the enemy
  const markedEnemies = markOverdriveActive(updatedEnemies);
  return {
    ...state,
    enemies: markedEnemies,
    phase: { type: 'OVERDRIVE_WARNING' },
    log: [...state.log, 'AEGIS-7: CARREGANDO ATAQUE TERMINUS...'],
  };
}
```

### Phase 2: TERMINUS Execution (AEGIS-7's turn while OVERDRIVE_CHARGE is active)

In `resolveAEGIS7Turn`:

```typescript
function resolveAEGIS7Turn(enemy: Enemy, party: PlayerCharacter[]): ResolvedAction {
  if (!enemy.isOverdriveActive) {
    // Normal attack pre-overdrive
    return normalAEGIS7Attack(enemy, party);
  }

  // TERMINUS: 999 damage to any character not defending
  const notDefending = party.filter(c => !c.isDefeated && !c.isDefending);
  const defending = party.filter(c => !c.isDefeated && c.isDefending);

  const hpDeltas = [
    ...notDefending.map(c => ({ targetId: c.id as CombatantId, amount: -999 })),
    ...defending.map(c => ({ targetId: c.id as CombatantId, amount: 0 })),
  ];

  const description = notDefending.length > 0
    ? `AEGIS-7 fires TERMINUS! ${notDefending.map(c => c.name).join(', ')} take lethal damage!`
    : 'AEGIS-7 fires TERMINUS! The party defended in time!';

  return {
    actorId: enemy.id,
    description,
    hpDelta: hpDeltas,
    animationType: 'OVERDRIVE_TERMINUS',
  };
}
```

### What the UI Does with OVERDRIVE_WARNING State

When `phase.type === 'OVERDRIVE_WARNING'`, the action menu still renders but the log shows a persistent warning banner. After player submits their action (all characters must be DEFEND — the game does not enforce this mechanically; the consequence IS the enforcement), the phase transitions to `PLAYER_INPUT` as normal. AEGIS-7's turn will then run TERMINUS.

This is the correct JRPG design: warn the player, give them a turn to react, let the consequence speak for itself. No special "you must do this" enforcement gate — that would remove the dramatic tension.

---

## Animation Sequence: The RESOLVING Gate

This is the most React-specific piece of the architecture. The pattern uses `useEffect` watching the `pendingAction` field.

```typescript
// In BattleScene.tsx (the top-level battle component)

const [state, dispatch] = useReducer(battleReducer, initialState);

useEffect(() => {
  if (state.phase.type !== 'RESOLVING' || !state.pendingAction) return;

  const animationDuration = getAnimationDuration(state.pendingAction.animationType);

  const timer = setTimeout(() => {
    dispatch({ type: 'ACTION_COMPLETE' });
  }, animationDuration);

  return () => clearTimeout(timer);
}, [state.phase, state.pendingAction]);
```

```typescript
// Animation durations in ms
function getAnimationDuration(type: AnimationType): number {
  const durations: Record<AnimationType, number> = {
    ATTACK: 800,
    SKILL_ELECTRIC: 1200,
    SKILL_SHIELD: 1000,
    SKILL_HEAL: 1000,
    OVERDRIVE_WARNING: 2000,
    OVERDRIVE_TERMINUS: 2500,
    DEFEND: 600,
    ITEM: 700,
  };
  return durations[type];
}
```

`ACTION_COMPLETE` in the reducer: applies `pendingAction`'s deltas to state, clears `pendingAction`, rebuilds/advances the turn queue, and sets the next phase (PLAYER_INPUT or ENEMY_TURN).

**Why this over async/await inside the reducer:** Reducers must be synchronous. Timers are side effects. `useEffect` is the correct React hook for side effects that depend on state. The `return () => clearTimeout(timer)` cleanup prevents the double-fire bug that killed the Strict Mode isTyping issue in another part of this codebase.

---

## Game Flow Controller

The game flow controller lives above the battle engine. It owns `GameState` and decides which encounter to load next.

```typescript
// /src/app/page.tsx (or a GameController component)

const [gameState, setGameState] = useState<GameState>({
  gamePhase: 'INTRO',
  party: buildInitialParty(), // starts with only DEADZONE
  battleState: null,
});

function handleEncounterVictory(encounter: EncounterNumber, survivingParty: PlayerCharacter[]) {
  switch (encounter) {
    case 1:
      // Add TORC to party
      setGameState({
        gamePhase: 'ENCOUNTER_2',
        party: [...survivingParty, buildCharacter('TORC')],
        battleState: buildBattleState('ENCOUNTER_2', [...survivingParty, buildCharacter('TORC')]),
      });
      break;
    case 2:
      // Add TRINETRA to party
      setGameState({ ... });
      break;
    case 3:
      setGameState({ gamePhase: 'ENCOUNTER_4', ... });
      break;
    case 4:
      setGameState({ gamePhase: 'VICTORY_SCREEN', ... });
      break;
  }
}

function handleGameOver() {
  setGameState({ gamePhase: 'GAME_OVER_SCREEN', ... });
}
```

**HP carries between encounters.** Characters do not full-heal. Items (Nano-Med) are the only restoration during the run. This is a deliberate difficulty mechanic matching the [In]terfaces tone of attrition and limited resources.

**EN does not carry between encounters.** EN resets to full at encounter start. This prevents EN starvation making late encounters unplayable, while HP carry creates meaningful consequence for taking damage early.

---

## Component Boundaries

```
GameController (page.tsx)
│  Owns: GameState (gamePhase, party across encounters)
│  Renders: one of →
│
├── IntroScreen
│     No game logic. Pure narrative + "START" button.
│
├── BattleScene  ← the main unit
│     Owns: BattleState via useReducer
│     Renders:
│     │
│     ├── BattleLog
│     │     Props: log: string[]
│     │     Scrolling combat narrative. Dumb display component.
│     │
│     ├── EnemyField
│     │     Props: enemies: Enemy[]
│     │     Renders enemy sprites/names/HP bars. No interaction.
│     │
│     ├── PartyStatus
│     │     Props: party: PlayerCharacter[]
│     │     HP bars, EN bars, status icons, "DEFENDING" indicator.
│     │     No interaction.
│     │
│     ├── ActionMenu
│     │     Props: actor: PlayerCharacter, onAction: (action: PlayerAction) => void
│     │     Rendered ONLY when phase === 'PLAYER_INPUT'
│     │     Contains: [ATACAR] [HABILIDADE] [DEFENDER] [ITEM]
│     │     Sub-renders TargetSelector when ATTACK or SKILL chosen
│     │
│     ├── TargetSelector
│     │     Props: targets: Combatant[], onSelect: (id: CombatantId) => void
│     │     Rendered by ActionMenu, not by BattleScene directly
│     │
│     ├── OverdriveWarning
│     │     Props: isVisible: boolean
│     │     Full-screen overlay banner: "TERMINUS LOADING"
│     │     Rendered when phase === 'OVERDRIVE_WARNING'
│     │
│     └── BattleAnimationLayer
│           Props: pendingAction: ResolvedAction | null
│           CSS class-based animation triggers (flash, shake, glow)
│           Does not contain game logic
│
├── VictoryScreen
│     Props: encounter: EncounterNumber, onContinue: () => void
│
└── GameOverScreen
      Props: onRestart: () => void
```

**Communication rules:**
- `BattleScene` dispatches to its own reducer. GameController never touches `BattleState` internals.
- When battle ends (VICTORY or DEFEAT), `BattleScene` calls a prop callback: `onVictory(party)` or `onGameOver()`.
- `ActionMenu` never calls the reducer directly. It calls `onAction(action)` and `BattleScene` dispatches.
- No component below `BattleScene` owns game state. Status bars are derived display, not interactive state.

---

## Suggested Build Order

Each step must exist before the next compiles meaningfully.

**Step 1: Types and pure logic (no React)**
- `/src/lib/battle/types.ts` — all interfaces and type unions
- `/src/lib/battle/battleEngine.ts` — damage functions, action resolvers
- `/src/lib/battle/turnQueue.ts` — `buildTurnQueue()`
- `/src/lib/battle/enemyAI.ts` — `resolveEnemyAction()`
- `/src/lib/battle/encounters.ts` — enemy and party factory functions per encounter

At this point, the entire battle engine is testable without running a browser.

**Step 2: Reducer**
- `/src/lib/battle/battleReducer.ts` — `BattleAction` union type, reducer function, initial state factories
- Test: manually trace through a few action dispatches in a test file

**Step 3: BattleScene shell**
- `BattleScene.tsx` with `useReducer`, the animation `useEffect`, and placeholder child divs
- Verify: phase transitions work, RESOLVING → ACTION_COMPLETE → next phase

**Step 4: UI components (bottom-up)**
- `PartyStatus` — simplest, no interaction
- `EnemyField` — no interaction
- `BattleLog` — no interaction
- `ActionMenu` + `TargetSelector` — first interactive piece
- `OverdriveWarning` — CSS overlay

**Step 5: Full battle loop (Encounter 1)**
- Wire all components into BattleScene
- Test complete Encounter 1 (DEADZONE solo vs Casting Probe MK-I)
- Verify: player input → resolving → enemy turn → resolving → repeat → victory

**Step 6: Enemy AI differentiation**
- Add Networker Enforcer (TARGET_LOWEST_HP) — Encounter 2
- Add TORC to party
- Add Casting Patrol Bot (ATTACK_RANDOM) — Encounter 3
- Add TRINETRA to party

**Step 7: AEGIS-7 and OVERDRIVE**
- This is the most complex step; it requires Steps 1–6 fully working
- Implement `OVERDRIVE_WARNING` phase and `OVERDRIVE_TERMINUS` resolution
- Test: bring AEGIS-7 below 100 HP → warning → party defends → TERMINUS fires → nobody dies
- Test: bring AEGIS-7 below 100 HP → skip defend → TERMINUS → GAME OVER

**Step 8: Game flow controller**
- Encounter transitions
- HP carry logic between encounters
- EN reset between encounters
- Intro, Victory, Game Over screens

**Step 9: Aesthetics**
- CSS animations (flash, shake, glow) in `BattleAnimationLayer`
- Press Start 2P font, Blue Wave palette
- Overdrive warning banner styling

---

## Key Architectural Decisions Summarized

| Decision | Rationale |
|----------|-----------|
| Single `useReducer` for all battle state | Predictable, debuggable, no prop drilling; matches state machine pattern |
| Pure functions in `/lib/battle/` | Testable in isolation; reducers stay readable; zero React dependency in logic layer |
| `RESOLVING` phase as animation gate | Prevents double-dispatch, race conditions, and input during animations |
| `isDefending` on character, not StatusEffect | Direct boolean check is simpler for OVERDRIVE resolution path |
| Function map for enemy AI | Extensible without switch statements; each behavior is a self-contained function |
| `TurnEntry` snapshots SPD | Mid-round stat changes don't retroactively reorder queue |
| `ResolvedAction` as the logic/UI bridge | All animation, log text, and delta application flows through one typed object |
| HP carries between encounters, EN resets | Creates resource attrition without making EN exhaustion a run-ender |
| GameController above BattleScene | Clean separation: encounter routing vs battle logic |

---

## Sources

- Game Programming Patterns — State chapter: https://gameprogrammingpatterns.com/state.html
- Architecting a turn-based game engine with Redux: https://trashmoon.com/blog/2019/architecting-a-turn-based-game-engine-with-redux/
- useReducer as a Finite State Machine (Kyle Shevlin): https://kyleshevlin.com/how-to-use-usereducer-as-a-finite-state-machine/
- Tactics RPG Turn Order (The Liquid Fire): https://theliquidfire.com/2015/09/07/tactics-rpg-turn-order/
- Intelligence in Turn-Based RPG Combat (Game Developer): https://www.gamedeveloper.com/programming/intelligence-in-turn-based-rpg-combat
- React official docs — useReducer: https://react.dev/reference/react/useReducer
- React official docs — Extracting State Logic into a Reducer: https://react.dev/learn/extracting-state-logic-into-a-reducer
