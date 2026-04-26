# Phase 2: Encounter 1 — DEADZONE Solo — Research

**Researched:** 2026-04-26
**Domain:** JRPG turn-loop wiring + React battle UI components + CSS animations
**Confidence:** HIGH — grounded in codebase inspection of every Phase 1 source file, verified math, and existing research docs.

---

## Summary

Phase 2 connects an already-correct pure engine (36 tests passing, 97.85% coverage) to a playable UI. Every type, formula, and pitfall guard already exists — the work is wiring. The reducer's `PLAYER_ACTION` case is a stub that doesn't apply damage; `ENEMY_ACTION` doesn't call `resolveEnemyAction`; `ACTION_RESOLVED` doesn't advance the turn queue or check victory conditions. Phase 2 fills all these gaps and adds the five UI components that make the loop visible and playable.

The core architectural decision from Phase 1 research stands: a single `useReducer` in `BattleScene`, pure functions in `src/engine/`, dumb display components beneath it. Phase 2 does not introduce new state management patterns — it extends the existing state machine with real logic in exactly the cases that were stubbed.

The most important Phase 2 insight: the full turn loop requires a **sequenced dispatch chain**, not one big action. Each step must go through the reducer and the animation gate before the next step fires. The sequence is: PLAYER_ACTION → RESOLVING (animation plays) → ACTION_RESOLVED (apply deltas, check end conditions) → if enemy turn: ENEMY_TURN (AI fires) → RESOLVING (animation plays) → ACTION_RESOLVED (apply deltas, check end conditions) → PLAYER_INPUT (loop). All of this is orchestrated by the existing `useEffect` animation gate plus new `useEffect` hooks watching for ENEMY_TURN and CHECK_END_CONDITIONS phases.

**Primary recommendation:** Extend the reducer's existing case stubs with real logic — do not refactor the architecture. Add five focused UI components. Wire them from the top (BattleScene) down (dumb display children). Install jsdom + @testing-library/react before any component work.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENGINE-07 | ATACAR applies physical damage and advances to RESOLVING | `calculateDamage(DEADZONE, PROBE)` = 16 dmg; reducer PLAYER_ACTION stub needs target lookup + hp delta |
| ENGINE-08 | DEFENDER reduces incoming damage 50% next turn, recovers 5 EN | `isDefending: true` on Character; `damageMultiplier: 0.5` in calculateDamage; clear isDefending at turn start |
| ENGINE-09 | ITEM (Nano-Med) heals 30 HP, consumes 1 from inventory | `items.nanoMed` already in BattleState; clamp hp to maxHp |
| ENGINE-10 | Inventory `items: { nanoMed: number }` with USE_ITEM action | Already in initialBattleState; needs reducer case for USE_ITEM or route through PLAYER_ACTION with type ITEM |
| SKILL-01 | Signal Null (8 EN) ignores 30% DEF — uses `defPenetration: 0.7` | `calculateDamage(DEADZONE, PROBE, { defPenetration: 0.7 })` = 18 dmg; EN deduction via enDelta |
| SKILL-04 | HABILIDADE button disabled when EN < skill cost | `actor.en < 8` → button disabled; check at render time from BattleState |
| AI-02 | ALWAYS_ATTACK fully implemented (targets first alive party member) | Replace stub in enemyAI.ts; use `calculateDamage`; return full ResolvedAction with hpDelta |
| ENC-01 | Encounter 1 playable start to finish | DEADZONE + CASTING_PROBE_MK1 data already in src/data/; need full loop + UI |
| UI-01 | BattleScreen: 16:9, Blue Wave palette, enemy area / ally area / HUD footer | Tailwind v4 aspect-ratio-video + flex-col; Blue Wave vars in globals.css |
| UI-02 | CommandMenu: 4 buttons (ATACAR, HABILIDADE, DEFENDER, ITEM), keyboard + mouse | Renders only when phase === 'PLAYER_INPUT'; keyboard via onKeyDown on wrapper div |
| UI-03 | StatusTable: HP/EN of all combatants visible | Table or flex layout; reads from state.party + state.enemies |
| UI-04 | CharacterSprite: player sprite with states (idle, attack, hurt, defend) | SpriteFallback exists; needs state-class application based on pendingAction.animationType |
| UI-05 | EnemySprite: enemy sprite with states (idle, attack, hurt, defeat) | Same SpriteFallback; defeat state when isDefeated |
| UI-07 | BattleLog: action history, lore text, most recent at bottom | Reads state.log; auto-scroll to bottom on update via useEffect + ref |
| UI-09 | Floating damage numbers: CSS @keyframes animate up + fade | Absolutely positioned; triggered by pendingAction.hpDelta; keyed to force re-trigger |
| UI-10 | HP/EN bars animate smoothly (CSS transition on width) | `transition: width 600ms ease-out` on bar fill; width computed from current/max ratio |
| VISUAL-01 | Blue Wave palette as CSS vars, no hardcoded colors | Already in globals.css; components use `bg-electric`, `text-cyan-neon` etc. |
| VISUAL-02 | `image-rendering: pixelated` on all sprites | Already in globals.css on `img`; SpriteFallback divs need CSS: `image-rendering: pixelated` |
| VISUAL-03 | screen-flash @keyframes on crits (white→transparent 200ms) | CSS Module on BattleScene; toggle variant class to re-trigger |
| VISUAL-07 | All animations use transform/opacity (GPU compositor) | HP bar: width transition (layout, but acceptable at this scale); all others: transform/opacity |
| END-02 | GAME OVER screen when all party HP = 0 | Phase GAME_OVER → render GameOverScreen component |
| END-03 | Reset via React key prop (destroys and recreates BattleScene state) | `key={battleKey}` on BattleScene; `setBattleKey(k => k + 1)` on retry |
| END-04 | TENTAR NOVAMENTE restarts current encounter | Same key prop reset; no full game reload needed in Phase 2 (single encounter) |
| ASSETS-01 | DEADZONE sprite (Probe-facing battle position) | SpriteFallback CSS fallback ready; real PNG goes in public/sprites/ when available |
| ASSETS-02 | Casting Probe MK-I sprite | Same fallback; real PNG goes in public/sprites/ |
| ASSETS-03 | BG_corridor background (CSS gradient placeholder) | `background: linear-gradient(...)` using Blue Wave vars; real asset deferred to Phase 5 |
</phase_requirements>

---

## Project Constraints (from CLAUDE.md)

- **State management:** `useReducer` at BattleScene (NOT Zustand). Locked.
- **Styling:** Tailwind v4 + CSS Modules for keyframes. No styled-components, no Framer Motion.
- **Font:** Press Start 2P via `next/font/google`, already wired. Use `var(--font-pixel)`.
- **Animations:** CSS `@keyframes` in CSS Modules; HP/EN bars via CSS `transition: width`. GPU compositing only (transform + opacity).
- **Testing:** Vitest 2 for engine (node env); @testing-library/react for component tests (requires jsdom install in Phase 2).
- **`'use client'`:** All battle components. Already on BattleScene.tsx.
- **QA guardrails:** Every `useEffect` with timer must `clearTimeout` in cleanup. All deferred reads via `stateRef.current`. No `Math.random` in render. Reducer phase guard returns same reference.
- **GSD Workflow:** No direct repo edits outside a GSD command.

---

## What Phase 1 Delivered (Verified Against Codebase)

This section documents exactly what exists and what the stubs are, so the planner knows the delta.

### Exists and Correct (do not rewrite)

| File | What Exists |
|------|-------------|
| `src/engine/types.ts` | Full type system: `Character`, `Enemy`, `BattleState`, `Action` union (including `CHECK_END_CONDITIONS`), `ResolvedAction` with `hpDelta`/`enDelta`/`statusApplied`, all `AnimationType` values |
| `src/engine/damage.ts` | `calculateDamage(attacker, target, modifiers)` supporting `defPenetration`, `flatAtkBonus`, `damageMultiplier`; `getEffectiveDef()` accounting for DEF_BUFF status |
| `src/engine/turnQueue.ts` | `buildTurnQueue(party, enemies)` sorts by SPD desc, filters defeated |
| `src/engine/gameStateRef.ts` | `useGameStateRef(state)` hook — useRef + useEffect mirror pattern |
| `src/engine/reducer.ts` | `battleReducer` + `initialBattleState`; INIT case works; `CHECK_END_CONDITIONS` works; `NEXT_TURN` works; phase guards on all cases |
| `src/engine/enemyAI.ts` | `AI_BEHAVIORS` Record + `resolveEnemyAction`; defensive throw on empty targets |
| `src/data/characters.ts` | `DEADZONE` with correct stats (HP 95, EN 25, ATK 22, DEF 10, SPD 18) |
| `src/data/enemies.ts` | `CASTING_PROBE_MK1` with correct stats (HP 40, ATK 14, DEF 6, SPD 10, behavior ALWAYS_ATTACK) |
| `src/components/BattleScene.tsx` | `'use client'`, `useReducer`, `useGameStateRef`, one-shot INIT via `useRef(false)`, animation gate with `clearTimeout` cleanup |
| `src/components/SpriteFallback.tsx` | CSS clip-path silhouettes, `--glow` CSS custom property, `data-kind` routing |
| `src/styles/sprite-fallback.module.css` | `.sprite`, `[data-kind="enemy"]`, `[data-kind="boss"]`, `@keyframes bossPulse` |
| `src/app/globals.css` | Blue Wave palette in `@theme`, `image-rendering: pixelated` on `img` |

### Stubs That Phase 2 Must Fill

| Location | Stub | What Phase 2 Replaces It With |
|----------|------|-------------------------------|
| `reducer.ts` PLAYER_ACTION case | Placeholder description string, animationType always ATTACK, no hp/en delta | Real dispatch routing: ATTACK → `calculateDamage`, DEFEND → set isDefending + EN recovery, ITEM → Nano-Med heal, SKILL → Signal Null with defPenetration |
| `reducer.ts` ACTION_RESOLVED case | Just clears pendingAction, phase → PLAYER_INPUT | Apply `pendingAction.hpDelta`/`enDelta` to party + enemies; mark defeated; dispatch CHECK_END_CONDITIONS logic inline or advance to ENEMY_TURN |
| `reducer.ts` ENEMY_ACTION case | Just sets phase → RESOLVING | Call `resolveEnemyAction(enemy, state)` from enemyAI.ts; set pendingAction; advance phase |
| `enemyAI.ts` ALWAYS_ATTACK | Returns placeholder ResolvedAction with no hpDelta | `party.filter(!isDefeated)[0]` as target; `calculateDamage(enemy, target)` accounting for target's `isDefending` flag |
| `BattleScene.tsx` | No ENEMY_TURN useEffect; animation gate only handles RESOLVING → PLAYER_INPUT | Add useEffect watching ENEMY_TURN to dispatch ENEMY_ACTION; add useEffect to dispatch NEXT_TURN after ACTION_RESOLVED; full turn sequencing |

---

## Architecture: Full Turn Loop

The complete dispatch sequence for Encounter 1, step by step:

```
State: PLAYER_INPUT
User clicks ATACAR
  └─ dispatch PLAYER_ACTION { type: 'ATTACK', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' }

Reducer (PLAYER_ACTION case):
  1. Phase guard: state.phase !== 'PLAYER_INPUT' → return state (no-op)
  2. Resolve action: calculateDamage(DEADZONE, PROBE) = 16 dmg
  3. Build ResolvedAction: { actorId, description (lore text), hpDelta: [{targetId, amount: -16}], animationType: 'ATTACK' }
  4. Return { ...state, phase: 'RESOLVING', pendingAction: resolvedAction, log: [...state.log, loroText] }

State: RESOLVING
Animation gate useEffect fires:
  1. CSS class added to UI (hit flash, damage number appears)
  2. setTimeout(800ms) starts
  3. After 800ms: dispatch ACTION_RESOLVED

Reducer (ACTION_RESOLVED case):
  1. Phase guard: state.phase !== 'RESOLVING' → return state (no-op)
  2. Apply pendingAction.hpDelta to enemies:
     enemies.map(e => e.id === 'CASTING_PROBE_MK1' ? { ...e, hp: Math.max(0, e.hp - 16), isDefeated: hp <= 0 } : e)
  3. Apply pendingAction.enDelta to party (if any)
  4. Clear pendingAction
  5. Check if all enemies defeated → phase: 'VICTORY' (done)
  6. Check if all party defeated → phase: 'GAME_OVER' (done)
  7. Otherwise: advance turn queue → next actor is ENEMY (PROBE SPD 10, DEADZONE SPD 18 so DEADZONE acts first)
     Wait — actually rebuild: DEADZONE SPD 18 acts first each round, then PROBE SPD 10.
     After DEADZONE's turn: currentTurnIndex → 1 (PROBE's entry in the queue)
  8. Return { ...state, phase: 'ENEMY_TURN', currentTurnIndex: nextIndex, pendingAction: null }

State: ENEMY_TURN
Enemy turn useEffect fires:
  1. setTimeout(400ms) for "enemy thinking" beat
  2. After delay: dispatch ENEMY_ACTION { enemyId: 'CASTING_PROBE_MK1' }

Reducer (ENEMY_ACTION case):
  1. Phase guard: state.phase !== 'ENEMY_TURN' → return state
  2. Find enemy by enemyId
  3. Find valid targets (party.filter(!isDefeated))
  4. If no valid targets: return { ...state, phase: 'GAME_OVER' } (safety net)
  5. Call resolveEnemyAction(enemy, stateRef.current)
     → ALWAYS_ATTACK selects first alive party member
     → calculateDamage with target's isDefending flag: damageMultiplier 0.5 if defending
  6. Return { ...state, phase: 'RESOLVING', pendingAction: enemyResolvedAction }

State: RESOLVING (enemy action)
Animation gate useEffect fires again:
  1. CSS damage animation on DEADZONE
  2. setTimeout(800ms)
  3. dispatch ACTION_RESOLVED

Reducer (ACTION_RESOLVED case, 2nd time):
  1. Apply hpDelta to party (DEADZONE loses 4 HP)
  2. Clear isDefending flag on DEADZONE (defending lasts 1 turn)
  3. Check end conditions
  4. Advance turn queue: currentTurnIndex → 0 again (new round, DEADZONE goes first)
  5. Return { ...state, phase: 'PLAYER_INPUT', ... }

State: PLAYER_INPUT ← loop restarts
```

### Key Design Decision: Where to Clear `isDefending`

`isDefending` must be cleared at the START of the character's NEXT turn, not at end of current turn. The pattern: when ACTION_RESOLVED advances the turn queue and the next player actor is about to get PLAYER_INPUT, clear any `isDefending` flags on that actor. Alternative: clear `isDefending` at the start of the PLAYER_ACTION case for that actor. Both work; the latter is simpler — clear in PLAYER_ACTION before processing any action for that actor.

```typescript
// In PLAYER_ACTION case, before processing:
const actor = state.party.find(c => c.id === action.payload.actorId);
// Clear defending from previous turn
const partyWithClearedDefend = state.party.map(c =>
  c.id === action.payload.actorId ? { ...c, isDefending: false } : c
);
```

[ASSUMED] Clearing `isDefending` at action dispatch (vs. at turn advance) — both approaches valid; planner should pick one and apply consistently.

### DEFENDING Damage Calculation

The `isDefending` flag is already on `Character` type. The ALWAYS_ATTACK AI must pass `damageMultiplier: 0.5` when target is defending:

```typescript
// In ALWAYS_ATTACK AI behavior:
const dmg = calculateDamage(enemy, target, {
  damageMultiplier: target.isDefending ? 0.5 : 1.0,
});
```

`calculateDamage` already supports `damageMultiplier` — no changes needed to damage.ts.

### Signal Null Math (Verified)

```
DEADZONE ATK: 22, PROBE DEF: 6
Signal Null: defPenetration = 0.7 → effectiveDef = floor(6 * 0.7) = 4
Damage = max(1, 22 - 4) = 18
```

vs. basic attack: `max(1, 22 - 6) = 16`. Signal Null adds 2 damage against the Probe (minor, but correct per spec).

EN cost: 8. DEADZONE starts with 25 EN. After 1 use: 17. After 2 uses: 9. After 3 uses: 1 (below 8, button disabled). DEFENDER recovers 5 EN per use.

---

## Architecture Patterns

### Reducer Extension Pattern (don't rewrite — extend)

The existing `PLAYER_ACTION` case returns a stub. Replace its body with a router:

```typescript
case 'PLAYER_ACTION': {
  if (state.phase !== 'PLAYER_INPUT') return state;

  const { type, actorId, targetId } = action.payload;
  const actor = state.party.find(c => c.id === actorId)!;

  // Clear defending from previous round (this actor is now acting)
  const partyCleared = state.party.map(c =>
    c.id === actorId ? { ...c, isDefending: false } : c
  );

  switch (type) {
    case 'ATTACK': { /* calculateDamage, build ResolvedAction */ }
    case 'SKILL':  { /* Signal Null: defPenetration 0.7, cost 8 EN */ }
    case 'DEFEND': { /* set isDefending: true, recover 5 EN, no damage */ }
    case 'ITEM':   { /* Nano-Med: +30 HP capped at maxHp, consume 1 nanoMed */ }
  }
}
```

The `ResolvedAction` bridge is the key — all damage/heal/status data flows through it into ACTION_RESOLVED, which applies deltas uniformly regardless of action type.

### ACTION_RESOLVED as the Single Delta Applier

All state mutation (hp changes, en changes, isDefeated marking) happens in ONE place: `ACTION_RESOLVED`. This is the cleanest pattern because:
1. Pure logic (calculateDamage, etc.) runs in PLAYER_ACTION/ENEMY_ACTION and produces a descriptor.
2. ACTION_RESOLVED applies the descriptor to state.
3. Separation means the animation layer can safely read `pendingAction` without worrying about stale state.

```typescript
case 'ACTION_RESOLVED': {
  if (state.phase !== 'RESOLVING') return state;
  if (!state.pendingAction) return { ...state, phase: 'PLAYER_INPUT' };

  const { hpDelta, enDelta } = state.pendingAction;

  // Apply HP deltas to both party and enemies
  let newParty = state.party;
  let newEnemies = state.enemies;

  if (hpDelta) {
    for (const delta of hpDelta) {
      newParty = newParty.map(c =>
        c.id === delta.targetId
          ? { ...c, hp: Math.max(0, Math.min(c.maxHp, c.hp + delta.amount)),
               isDefeated: c.hp + delta.amount <= 0 }
          : c
      );
      newEnemies = newEnemies.map(e =>
        e.id === delta.targetId
          ? { ...e, hp: Math.max(0, e.hp + delta.amount),
               isDefeated: e.hp + delta.amount <= 0 }
          : e
      );
    }
  }

  // Apply EN deltas
  if (enDelta) {
    for (const delta of enDelta) {
      newParty = newParty.map(c =>
        c.id === delta.targetId
          ? { ...c, en: Math.max(0, Math.min(c.maxEn, c.en + delta.amount)) }
          : c
      );
    }
  }

  // Check end conditions inline
  if (newEnemies.every(e => e.isDefeated)) return { ...state, party: newParty, enemies: newEnemies, pendingAction: null, phase: 'VICTORY' };
  if (newParty.every(c => c.isDefeated)) return { ...state, party: newParty, pendingAction: null, phase: 'GAME_OVER' };

  // Advance turn queue
  const nextIndex = state.currentTurnIndex + 1;
  if (nextIndex >= state.turnQueue.length) {
    const newQueue = buildTurnQueue(newParty, newEnemies);
    const nextEntry = newQueue[0];
    const nextPhase = nextEntry.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
    return { ...state, party: newParty, enemies: newEnemies, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1, pendingAction: null, phase: nextPhase };
  }

  const nextEntry = state.turnQueue[nextIndex];
  const nextPhase = nextEntry.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
  return { ...state, party: newParty, enemies: newEnemies, currentTurnIndex: nextIndex, pendingAction: null, phase: nextPhase };
}
```

### Enemy Turn useEffect Pattern

```typescript
// In BattleScene.tsx — add ALONGSIDE the existing animation gate useEffect
useEffect(() => {
  if (state.phase !== 'ENEMY_TURN') return;

  // Find the active enemy
  const currentEntry = state.turnQueue[state.currentTurnIndex];
  const enemy = state.enemies.find(e => e.id === currentEntry.combatantId);
  if (!enemy || enemy.isDefeated) {
    // Skip defeated enemy's turn — dispatch NEXT_TURN or advance
    dispatch({ type: 'NEXT_TURN' });
    return;
  }

  const timer = setTimeout(() => {
    // Read FRESH state via ref (Pitfall 2)
    const current = stateRef.current;
    if (current.phase === 'ENEMY_TURN') {
      dispatch({ type: 'ENEMY_ACTION', payload: { enemyId: enemy.id } });
    }
  }, 600); // enemy "thinking" delay

  return () => clearTimeout(timer); // Pitfall 1: cleanup
}, [state.phase, state.currentTurnIndex, stateRef]);
```

### Floating Damage Number Pattern

The animation key rotation problem (Pitfall 12): a damage number must replay on every hit, even consecutive hits. Solution: attach a monotonic counter to each damage event as a React `key`, forcing unmount + remount of the damage number element.

```typescript
// In BattleScene or wherever damage numbers are managed:
interface DamagePopup { id: number; targetId: CombatantId; amount: number; }
const [popups, setPopups] = useState<DamagePopup[]>([]);
const popupCounter = useRef(0);

// When ACTION_RESOLVED fires with hpDelta, add a popup:
useEffect(() => {
  if (!state.pendingAction?.hpDelta) return;
  const newPopups = state.pendingAction.hpDelta.map(d => ({
    id: ++popupCounter.current,
    targetId: d.targetId,
    amount: Math.abs(d.amount),
  }));
  setPopups(prev => [...prev, ...newPopups]);
}, [state.pendingAction]);
```

Each popup renders with `key={popup.id}` — a new key means React destroys and recreates the element, restarting the CSS animation from frame 0.

```css
/* In a CSS Module */
@keyframes floatDamage {
  0%   { transform: translateY(0);    opacity: 1; }
  100% { transform: translateY(-48px); opacity: 0; }
}

.damageNumber {
  animation: floatDamage 700ms ease-out forwards;
  position: absolute;
  pointer-events: none;
  font-family: var(--font-pixel);
  color: var(--color-electric);
  font-size: 16px;
}
```

The popup component removes itself via `onAnimationEnd`:

```tsx
<span
  key={popup.id}
  className={styles.damageNumber}
  onAnimationEnd={() => setPopups(prev => prev.filter(p => p.id !== popup.id))}
>
  -{popup.amount}
</span>
```

### Screen Flash Pattern (VISUAL-03)

The same key-rotation problem applies to screen flash. Use a variant toggle (`'a' | 'b'`) so the CSS class name changes on every hit:

```typescript
const [flashVariant, setFlashVariant] = useState<'a' | 'b'>('a');
// Trigger: setFlashVariant(v => v === 'a' ? 'b' : 'a');
```

Both `.flash-a` and `.flash-b` have the same `@keyframes flash` animation. The different class name forces React to diff the DOM, removing and re-adding the class, which restarts the animation.

```css
@keyframes flash {
  0%,100% { opacity: 1; }
  50%      { opacity: 0; }
}
.flash-a, .flash-b { animation: flash 200ms ease-in-out; }
```

This only applies for the screen flash overlay. HP bar animations use `transition: width` which naturally replays on every value change.

### HP/EN Bar Animation (UI-10)

HP bars use CSS transitions, not keyframes. The bar fill is a `div` with a width percentage derived from state:

```tsx
<div
  className={styles.hpBarFill}
  style={{ width: `${(char.hp / char.maxHp) * 100}%` }}
/>
```

```css
.hpBarFill {
  height: 100%;
  background: var(--color-electric);
  transition: width 600ms ease-out;
  /* Color thresholds via JS class: .hpWarning → yellow, .hpCritical → red */
}
```

The `transition` replays automatically every time `hp` changes, with no re-triggering needed. This is the correct approach for reactive visual state (continuous value) vs. discrete event animations (keyframes).

**VISUAL-07 note:** HP bar width transition is `width` not `transform`, which is a layout property. For this scope (one bar per combatant) this is acceptable — the animation is simple and won't cause jank. `transform: scaleX()` would be GPU-composited but requires `transform-origin: left` and complicates the DOM structure. Use `transition: width` for simplicity; revisit in Phase 5 if performance becomes measurable.

### BattleLog Auto-Scroll (UI-07)

```tsx
const logEndRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [state.log]);

return (
  <div className={styles.logContainer}>
    {state.log.map((entry, i) => (
      <p key={i} className={styles.logEntry}>{entry}</p>
    ))}
    <div ref={logEndRef} />
  </div>
);
```

### Keyboard Navigation (UI-02)

The CommandMenu wraps 4 buttons. Keyboard: `1`/`2`/`3`/`4` keys map to ATACAR/HABILIDADE/DEFENDER/ITEM. Arrow keys navigate focus between buttons. Tab naturally cycles through focusable buttons.

```tsx
useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (state.phase !== 'PLAYER_INPUT') return;
    if (e.key === '1') handleAttack();
    if (e.key === '2') handleSkill();
    if (e.key === '3') handleDefend();
    if (e.key === '4') handleItem();
  };
  window.addEventListener('keydown', handleKey);
  return () => window.removeEventListener('keydown', handleKey); // Pitfall 1 cleanup
}, [state.phase]); // re-bind when phase changes
```

### Layout: 16:9 Battle Screen (UI-01)

```tsx
<div className="w-full max-w-4xl mx-auto" style={{ aspectRatio: '16/9' }}>
  <div className="flex flex-col h-full">
    <div className="flex-1">{/* Enemy area */}</div>
    <div className="flex-1">{/* Party area */}</div>
    <div className="h-32">{/* HUD / CommandMenu */}</div>
  </div>
</div>
```

Background corridor CSS gradient placeholder (ASSETS-03):

```css
.battleBackground {
  background: linear-gradient(
    180deg,
    var(--color-shadow-cold) 0%,
    #0d1a2e 60%,
    var(--color-bg-dark) 100%
  );
}
```

### GameOver and Victory Screens (END-02, END-03, END-04)

```tsx
// In page.tsx (GameController):
const [battleKey, setBattleKey] = useState(0);

// BattleScene takes an onVictory and onGameOver prop:
<BattleScene
  key={battleKey}
  onVictory={() => { /* Phase 2: show simple victory screen */ }}
  onGameOver={() => setBattleKey(k => k + 1)} // key increment = full tree remount
/>
```

For Phase 2, "TENTAR NOVAMENTE" increments `battleKey`. Since Phase 2 is Encounter 1 only, there is no "previous encounter" to preserve — the reset is the whole game. Phase 3 will introduce HP persistence between encounters, which modifies the game controller pattern.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation re-trigger | Custom animation manager | React `key` prop rotation + CSS `forwards` fill mode | Correct DOM lifecycle usage; zero extra code |
| Keyboard shortcuts | Custom focus manager | `window.addEventListener('keydown')` in useEffect with cleanup | Simple, zero deps, already pattern-established |
| HP bar animation | requestAnimationFrame loop | CSS `transition: width` | GPU compositor handles timing; no JS needed |
| State reset on retry | Manual field-by-field reset | React `key` prop increment on parent | Guaranteed complete reset; no forgotten nested flags (Pitfall 10) |
| Damage number positioning | Third-party tooltip/overlay | CSS `position: absolute` in a relative wrapper per combatant | Trivial; zero deps |

---

## Common Pitfalls (Phase 2 Specific)

### Pitfall A: ACTION_RESOLVED Fires Before Animation Completes

**What goes wrong:** The animation gate dispatches `ACTION_RESOLVED` after `setTimeout(800ms)`. But if the component re-renders between the setTimeout scheduling and its fire, the stale closure reads the old phase. The guard `if (current.phase === 'RESOLVING')` in the timer callback handles this — but only if `stateRef.current` is used (not the closed-over `state`). The Phase 1 BattleScene already uses `stateRef.current` — do not remove this pattern.

**Prevention:** Already encoded in Phase 1. The guard is `stateRef.current.phase === 'RESOLVING'`, not `state.phase === 'RESOLVING'`.

### Pitfall B: isDefeated vs. hp <= 0 Divergence

**What goes wrong:** `isDefeated` is set in ACTION_RESOLVED when `hp + delta.amount <= 0`. If any other code path sets `hp = 0` without setting `isDefeated`, the enemy/character will still appear alive in the turn queue. The AI will try to target or the turn queue won't skip them.

**Prevention:** Only one place sets both `hp` and `isDefeated` together: ACTION_RESOLVED's delta application. Never set `hp` directly anywhere else. After applying deltas, the pattern is:

```typescript
const newHp = Math.max(0, c.hp + delta.amount);
return { ...c, hp: newHp, isDefeated: newHp <= 0 };
```

### Pitfall C: NEXT_TURN Without Rebuilding Queue When Defeated Enemy Is Next

**What goes wrong:** PROBE is at HP 5. DEADZONE attacks for 16 damage. ACTION_RESOLVED marks PROBE as `isDefeated: true` and transitions to VICTORY. But if instead ACTION_RESOLVED advances the turn index and the next entry is the now-dead PROBE, ENEMY_TURN fires for a dead enemy.

**Prevention:** In ACTION_RESOLVED, check end conditions BEFORE advancing the turn queue. The sequence must be: apply deltas → check victory/game_over → advance queue. This is the correct order. Do not advance turn queue before checking end conditions.

### Pitfall D: DEFENDER Action Consuming EN Erroneously

**What goes wrong:** DEFENDER is a pure defensive stance, not a skill. It should never require EN or fail due to low EN. If the DEFENDER case mistakenly shares the skill EN validation path, a player with EN = 0 cannot defend, which breaks fairness.

**Prevention:** DEFEND case in PLAYER_ACTION has no EN check. It only: (1) sets `isDefending: true` on actor, (2) adds `+5 EN` recovery (capped at maxEn), (3) sets animationType to 'DEFEND'. The HABILIDADE button separately validates EN before dispatching SKILL.

### Pitfall E: Nano-Med Healing Beyond maxHp

**What goes wrong:** `items.nanoMed` restores 30 HP. If DEADZONE is at 80/95 HP and uses Nano-Med, HP would become 110 — above maxHp.

**Prevention:** In ACTION_RESOLVED, HP delta application must clamp: `Math.min(c.maxHp, c.hp + delta.amount)`. This is already in the recommended implementation above.

### Pitfall F: Strict Mode Double-Fire of ENEMY_TURN useEffect

**What goes wrong:** The new ENEMY_TURN useEffect (which dispatches ENEMY_ACTION after a delay) fires twice in development under React 18 Strict Mode. The Probe takes two actions in one "turn," applying damage twice, or the turn sequence advances twice.

**Prevention:** The `clearTimeout` cleanup in the `return () => clearTimeout(timer)` line handles this. On Strict Mode's second mount, the first timer is cancelled before it fires. Only the second timer (from the second mount) runs. This is the same pattern as the existing animation gate. Do not deviate from it.

### Pitfall G: Log Entries Using Log Index as React Key

**What goes wrong:** Battle log renders `state.log.map((entry, i) => <p key={i}...)`. When a new entry is prepended or the log is truncated, React uses index keys and reuses DOM nodes, causing stale text to flicker briefly.

**Prevention:** Log entries are always appended (newest last). Index keys are acceptable for append-only lists. However, if the log is ever reset (new encounter), index 0 now refers to a different entry — causing a brief flash. Use a stable key: either a monotonic counter embedded in the log entries, or accept the minor flash on reset since it coincides with a full component remount anyway (key prop reset).

---

## Code Examples (Verified Against Codebase)

### Signal Null in PLAYER_ACTION

```typescript
// Source: damage.ts already supports defPenetration
case 'PLAYER_ACTION': {
  if (state.phase !== 'PLAYER_INPUT') return state;
  const { type, actorId, targetId } = action.payload;
  const actor = state.party.find(c => c.id === actorId)!;

  if (type === 'SKILL') {
    // Validate EN (SKILL-04)
    const EN_COST = 8;
    if (actor.en < EN_COST) return state; // silently no-op (UI should prevent this)

    const target = state.enemies.find(e => e.id === targetId)!;
    const dmg = calculateDamage(actor, target, { defPenetration: 0.7 });

    const resolvedAction: ResolvedAction = {
      actorId: actor.id,
      description: `DEADZONE transmite SIGNAL NULL — protocolo de ruído digital ativado — ${dmg} de dano (DEF ignorada em 30%)`,
      hpDelta: [{ targetId: target.id, amount: -dmg }],
      enDelta: [{ targetId: actor.id, amount: -EN_COST }],
      animationType: 'SKILL_ELECTRIC',
    };

    return {
      ...state,
      party: state.party.map(c => c.id === actorId ? { ...c, isDefending: false } : c),
      phase: 'RESOLVING',
      pendingAction: resolvedAction,
      log: [...state.log, resolvedAction.description],
    };
  }
  // ... other cases
}
```

### ALWAYS_ATTACK Implementation

```typescript
// Source: enemyAI.ts AI_BEHAVIORS map
ALWAYS_ATTACK: (enemy, state) => {
  const validTargets = state.party.filter(c => !c.isDefeated);
  if (validTargets.length === 0) {
    throw new Error('ALWAYS_ATTACK: no valid targets — GAME_OVER should have fired first');
  }
  const target = validTargets[0]; // first alive party member (deterministic)
  const dmg = calculateDamage(enemy, target, {
    damageMultiplier: target.isDefending ? 0.5 : 1.0,
  });
  return {
    actorId: enemy.id,
    description: `Casting Probe MK-I varre o corredor — sonda de ataque detecta DEADZONE — ${dmg} de dano`,
    hpDelta: [{ targetId: target.id, amount: -dmg }],
    animationType: 'ATTACK',
  };
},
```

### BattleScene Props Pattern

```typescript
// BattleScene.tsx — add props for game controller communication
interface BattleSceneProps {
  party: Character[];
  enemies: Enemy[];
  items: { nanoMed: number };
  onVictory: () => void;
  onGameOver: () => void;
}

export function BattleScene({ party, enemies, items, onVictory, onGameOver }: BattleSceneProps) {
  // ...
  // When state.phase === 'VICTORY', call onVictory()
  // When state.phase === 'GAME_OVER', render GameOverScreen (not call onGameOver — it stays within BattleScene)
}
```

---

## Standard Stack

### Already Installed (no new installs needed for engine work)

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 14.2.35 | App shell, routing |
| React | ^18 | UI rendering |
| TypeScript | ^5 | Strict types |
| Tailwind CSS | ^4.2.4 | Layout + Blue Wave palette |
| Vitest | ^2.1.9 | Engine unit tests |

### Must Install (Phase 2 prerequisite)

| Library | Version | Purpose | Why Now |
|---------|---------|---------|---------|
| @testing-library/react | ^16 | Component tests (ActionMenu, BattleLog) | Phase 1 deferred to Phase 2; gameStateRef.ts has 0% coverage without jsdom |
| @testing-library/user-event | ^14 | Simulate mouse + keyboard in component tests | Companion to RTL for UI interactions |
| jsdom | ^25 | DOM environment for Vitest | Required by @testing-library/react |

**Installation:**

```bash
npm install -D @testing-library/react@^16 @testing-library/user-event@^14 jsdom@^25
```

**Vitest config change:** Add a second environment configuration. Engine tests stay `node`; component tests get `jsdom`. In Vitest 2, use `environmentMatchGlobs`:

```typescript
// vitest.config.ts
test: {
  environment: 'node', // default for engine files
  environmentMatchGlobs: [
    ['src/components/**/*.test.tsx', 'jsdom'],
    ['src/engine/gameStateRef.test.ts', 'jsdom'],
  ],
  globals: true,
  include: ['src/**/*.test.{ts,tsx}'],
  // ...
}
```

[VERIFIED: vitest.config.ts read from codebase] Current config uses `environment: 'node'` and `include: ['src/engine/**/*.test.ts']` — both must change.

---

## Lore Text Reference

Phase 2 requires lore-flavored battle log text (per NARR-05 groundwork and FEATURES.md §5). Consistent voice:

| Action | Log Text Template |
|--------|-------------------|
| DEADZONE ATACAR | `"DEADZONE encontra brecha no firewall — {dmg} de dano"` |
| DEADZONE Signal Null | `"DEADZONE transmite SIGNAL NULL — protocolo de ruído digital ativado — {dmg} de dano (DEF ignorada em 30%)"` |
| DEADZONE DEFENDER | `"DEADZONE ativa postura de contenção analógica — recupera 5 EN"` |
| DEADZONE ITEM (Nano-Med) | `"DEADZONE injeta Nano-Med — restaura {hp} HP"` |
| PROBE attacks | `"Casting Probe MK-I varre o corredor — sonda de ataque detecta DEADZONE — {dmg} de dano"` |
| PROBE attacks defending DEADZONE | `"Casting Probe MK-I varre o corredor — DEADZONE absorve o impacto — {dmg} de dano"` |
| VICTORY | `"Probe MK-I neutralizada. Corredor 7-A desobstruído."` |
| GAME OVER | `"DEADZONE eliminada. A resistência analógica recua."` |

---

## State of the Art

| Old Pattern | Phase 2 Pattern | Reason |
|-------------|-----------------|--------|
| Stub PLAYER_ACTION (returns placeholder) | Real action routing in PLAYER_ACTION switch | Phase 2 goal: playable loop |
| ACTION_RESOLVED resets phase only | ACTION_RESOLVED applies all deltas + checks end conditions + advances queue | Correct JRPG turn machine |
| AI stub (no targeting, no damage) | ALWAYS_ATTACK with real calculateDamage call | AI-02 requirement |
| Animation gate handles only RESOLVING | Two useEffects: RESOLVING (existing) + ENEMY_TURN (new) | Full turn loop |
| BattleScene with no props | BattleScene with onVictory/onGameOver props | Game controller integration |

---

## Environment Availability

Step 2.6 audit: Phase 2 is code + config only. No new external services, databases, or OS tools needed beyond Node.js (already confirmed running from Phase 1 build success).

| Dependency | Required By | Available | Notes |
|------------|------------|-----------|-------|
| Node.js >= 20 | Next.js 14 + Vitest | Confirmed (Phase 1 build passed) | No action needed |
| @testing-library/react | Component tests | NOT INSTALLED | Must install in Wave 0 |
| jsdom | Component tests | NOT INSTALLED | Must install in Wave 0 |
| @testing-library/user-event | Keyboard nav tests | NOT INSTALLED | Must install in Wave 0 |

**Missing dependencies with fallback:**
- If RTL install fails: component tests can be deferred and verified manually. Engine tests (already jsdom-free) remain green. Not ideal but not blocking.

**Missing dependencies with no fallback:**
- gameStateRef.ts needs jsdom to test. Phase 2 must install jsdom to close the 0% coverage gap deferred from Phase 1.

---

## Validation Architecture

`nyquist_validation: true` in config.json — this section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `vitest.config.ts` (must be updated in Wave 0 to add jsdom env for components) |
| Quick run command | `npm run test` (all tests, ~5s) |
| Full suite command | `npm run test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENGINE-07 | ATACAR dispatches PLAYER_ACTION; ACTION_RESOLVED applies hp delta | unit | `npm run test -- src/engine/reducer.test.ts` | Partial (reducer.test.ts exists; new cases needed) |
| ENGINE-08 | DEFENDER sets isDefending, recovers 5 EN; incoming damage * 0.5 | unit | `npm run test -- src/engine/reducer.test.ts` | Partial (new cases needed) |
| ENGINE-09 | USE_ITEM heals 30 HP, clamps to maxHp, decrements nanoMed | unit | `npm run test -- src/engine/reducer.test.ts` | Partial (new cases needed) |
| ENGINE-10 | items.nanoMed in BattleState; ITEM case decrements count | unit | `npm run test -- src/engine/reducer.test.ts` | Partial |
| SKILL-01 | Signal Null: calculateDamage with defPenetration 0.7 = 18 dmg vs Probe | unit | `npm run test -- src/engine/damage.test.ts` | Partial (damage.test.ts exists; new case for defPenetration needed) |
| SKILL-04 | PLAYER_ACTION SKILL with en < 8 returns same state reference | unit | `npm run test -- src/engine/reducer.test.ts` | New test needed |
| AI-02 | ALWAYS_ATTACK targets first alive party member; applies correct damage | unit | `npm run test -- src/engine/enemyAI.test.ts` | Partial (new cases needed) |
| ENC-01 | Full turn cycle: PLAYER_INPUT → RESOLVING → ACTION_RESOLVED → ENEMY_TURN → RESOLVING → ACTION_RESOLVED → PLAYER_INPUT | integration | `npm run test -- src/engine/reducer.test.ts` | New integration test |
| UI-01 | BattleScreen renders 16:9 layout | component | `npm run test -- src/components/BattleScene.test.tsx` | New file (Wave 0 gap) |
| UI-02 | ActionMenu renders 4 buttons; HABILIDADE disabled when EN < 8 | component | `npm run test -- src/components/ActionMenu.test.tsx` | New file (Wave 0 gap) |
| UI-03 | StatusTable shows HP/EN values from state | component | `npm run test -- src/components/BattleScene.test.tsx` | New file (Wave 0 gap) |
| UI-04 | CharacterSprite renders with correct state class on action | component | `npm run test -- src/components/BattleScene.test.tsx` | New file (Wave 0 gap) |
| UI-05 | EnemySprite shows defeat state when isDefeated | component | `npm run test -- src/components/BattleScene.test.tsx` | New file (Wave 0 gap) |
| UI-07 | BattleLog renders all log entries; scrolls to bottom | component | `npm run test -- src/components/BattleLog.test.tsx` | New file (Wave 0 gap) |
| UI-09 | DamagePopup renders with CSS animation; auto-removes on animationEnd | component | `npm run test -- src/components/BattleScene.test.tsx` | New file (Wave 0 gap) |
| UI-10 | HP bar width updates when hp changes | component | `npm run test -- src/components/BattleScene.test.tsx` | New file (Wave 0 gap) |
| VISUAL-01 | Blue Wave CSS vars applied (no hardcoded colors) | manual | `grep -rn "#00BFFF\|#0047AB" src/components/ -- exclude globals.css` | N/A (code review) |
| VISUAL-02 | image-rendering: pixelated on sprites | manual | `grep -n "pixelated" src/styles/ src/components/` | Verify globals.css already has it |
| VISUAL-03 | screen-flash triggers and completes | manual (browser) | — | N/A |
| VISUAL-07 | No width/height/top/left animations on battle elements | manual | Code review in PR | N/A |
| END-02 | state.phase === 'GAME_OVER' renders GameOverScreen | component | `npm run test -- src/components/BattleScene.test.tsx` | New test |
| END-03 | key prop increment destroys and recreates BattleScene | component | `npm run test -- src/components/BattleScene.test.tsx` | New test |
| END-04 | TENTAR NOVAMENTE button calls key increment handler | component | `npm run test -- src/components/GameOverScreen.test.tsx` | New file (Wave 0 gap) |
| ASSETS-01 | DEADZONE sprite renders (fallback or real PNG) | manual | Visual inspection at localhost:3000 | N/A |
| ASSETS-02 | Probe MK-I sprite renders (fallback or real PNG) | manual | Visual inspection at localhost:3000 | N/A |
| ASSETS-03 | BG_corridor renders (CSS gradient placeholder) | manual | Visual inspection at localhost:3000 | N/A |

### Sampling Rate

- **Per task commit:** `npm run test` (all tests, ~5s)
- **Per wave merge:** `npm run test:coverage` (full coverage report)
- **Phase gate:** Full suite green + `npm run build` exits 0 + manual browser playthrough before marking Phase 2 complete

### Wave 0 Gaps

- [ ] `npm install -D @testing-library/react@^16 @testing-library/user-event@^14 jsdom@^25`
- [ ] Update `vitest.config.ts` — add `environmentMatchGlobs` for jsdom on component tests; expand `include` to `src/**/*.test.{ts,tsx}`
- [ ] `src/engine/gameStateRef.test.ts` — covers the 0% gap deferred from Phase 1 (remove from coverage.exclude once tests exist)
- [ ] `src/engine/reducer.test.ts` — extend with: ENGINE-07 through ENGINE-10, SKILL-01/04, SKILL EN guard, full turn cycle integration test
- [ ] `src/engine/enemyAI.test.ts` — extend with: ALWAYS_ATTACK real targeting + damage, isDefending multiplier
- [ ] `src/components/BattleScene.test.tsx` — smoke: renders layout, phases, end states
- [ ] `src/components/ActionMenu.test.tsx` — button states, keyboard shortcuts, EN gate
- [ ] `src/components/BattleLog.test.tsx` — log entries render, auto-scroll fires
- [ ] `src/components/GameOverScreen.test.tsx` — retry button triggers key increment

---

## Open Questions

1. **ITEM target selection**
   - What we know: Nano-Med heals 30 HP to "an ally" per REQUIREMENTS.md (ENGINE-09). In Encounter 1, DEADZONE is the only party member.
   - What's unclear: Does the ITEM action require a target selector (anticipating multi-party use in Phase 3) or auto-target self in Phase 2?
   - Recommendation: Auto-target self in Phase 2 (actorId === targetId). Phase 3 refactors to a target selector. The `ResolvedAction` type already supports `hpDelta` with a targetId, so the Phase 3 change is a UI-only addition.

2. **Where DEFENDER's EN recovery appears**
   - What we know: ENGINE-08 says DEFENDER recovers 5 EN. The ResolvedAction type has `enDelta`.
   - What's unclear: Should +5 EN appear as a separate floating number, or is it silent?
   - Recommendation: Silent EN recovery (update bar only, no floating popup). Floating numbers are for HP damage — mixing EN recovery into the same popup system clutters the UI. [ASSUMED]

3. **Game Over screen scope for Phase 2**
   - What we know: END-02/03/04 require GAME OVER + TENTAR NOVAMENTE. Phase 2 is Encounter 1 only.
   - What's unclear: END-04 says "reinicia o encontro atual (não a demo inteira)." In Phase 2 there is only one encounter, so both are equivalent.
   - Recommendation: Implement `key` prop reset in Phase 2. Phase 3 will add encounter tracking — the reset pattern remains identical.

4. **Victory screen scope for Phase 2**
   - What we know: Phase 2 roadmap says "triggers victory transition." No explicit Victory screen requirement for Phase 2 (END-01 is Phase 4, END-05 is Phase 4).
   - What's unclear: Phase 2 needs SOME victory state. The VICTORY BattlePhase exists in the reducer.
   - Recommendation: A minimal victory display ("PROBE NEUTRALIZADA — Corredor 7-A limpo.") with a disabled battle UI is sufficient for Phase 2. Full Victory screen is Phase 4+.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Clearing `isDefending` at PLAYER_ACTION dispatch (not at turn advance) | Architecture: Turn Loop | Could leave defending flag stale for 1 extra turn if player skips action somehow |
| A2 | EN recovery from DEFENDER is silent (no floating popup) | Open Questions #2 | Minor UX inconsistency if designer prefers visible EN recovery |
| A3 | Nano-Med auto-targets self in Phase 2 | Open Questions #1 | No impact in Phase 2; refactored in Phase 3 regardless |
| A4 | Minimal victory display (text + disabled UI) sufficient for Phase 2 | Open Questions #4 | Phase roadmap says "triggers victory transition" — may want more polish |

---

## Sources

### Primary (HIGH confidence — verified against codebase this session)

- `src/engine/types.ts` — full type system audit; all interfaces confirmed
- `src/engine/reducer.ts` — stub content confirmed; ACTION_RESOLVED, ENEMY_ACTION, PLAYER_ACTION are stubs
- `src/engine/enemyAI.ts` — ALWAYS_ATTACK is a stub returning placeholder; stubAction defensive throw exists
- `src/engine/damage.ts` — `calculateDamage` supports `defPenetration`, `damageMultiplier`; verified against spec
- `src/data/characters.ts` — DEADZONE stats: HP 95, EN 25, ATK 22, DEF 10, SPD 18
- `src/data/enemies.ts` — PROBE stats: HP 40, ATK 14, DEF 6, SPD 10
- `src/components/BattleScene.tsx` — animation gate pattern, stateRef.current pattern confirmed
- `vitest.config.ts` — `environment: 'node'`, `include: src/engine/**/*.test.ts` — must change in Phase 2
- `package.json` — no RTL/jsdom installed; confirmed
- `.planning/phases/01-foundation-pure-engine/01-08-SUMMARY.md` — Phase 1 capstone: 36 tests, 97.85% coverage, all stubs documented
- Math verification via Node.js: DEADZONE vs PROBE damage values confirmed

### Secondary (MEDIUM confidence — cross-referenced with Phase 1 research)

- `.planning/research/ARCHITECTURE.md` — turn loop sequence, component boundaries, RESOLVING gate pattern
- `.planning/research/PITFALLS.md` — Pitfall 12 (animation re-trigger), Pitfall 10 (state reset), Pitfall 1/2 (Strict Mode + stale closure)
- `.planning/research/FEATURES.md` — lore text guidance, "log is a narrative layer" principle

### Tertiary (LOW confidence — carry-over from training knowledge)

- Vitest 2 `environmentMatchGlobs` syntax — [ASSUMED] based on Vitest 2 docs knowledge; verify against official docs during Wave 0

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all packages confirmed in package.json; no new installs for engine work
- Architecture: HIGH — all types, stubs, and gaps verified directly from source files
- Pitfalls: HIGH — Phase 1 guardrails verified in code; Phase 2-specific pitfalls derived from codebase analysis
- Battle math: HIGH — verified via Node.js computation against actual Character/Enemy stat values
- Test strategy: HIGH — vitest.config.ts read directly; gap list derived from coverage data in 01-08-SUMMARY.md

**Research date:** 2026-04-26
**Valid until:** This research is codebase-derived and valid until any Phase 1 source file is modified. If reducer.ts, types.ts, or damage.ts changes, re-read those files before executing Phase 2 plans.
