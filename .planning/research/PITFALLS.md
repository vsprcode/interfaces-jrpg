# Domain Pitfalls — Browser JRPG in React/Next.js

**Domain:** Turn-based JRPG demo, browser-first, React state machine, CSS animations
**Project:** [In]terfaces JRPG — AEGIS-7 boss encounter
**Researched:** 2026-04-25
**Confidence:** HIGH (verified against React docs, Next.js docs, MDN, community post-mortems)

---

## Critical Pitfalls

Mistakes that trigger rewrites, broken animations, or unplayable states.

---

### Pitfall 1: React Strict Mode Double-Firing Breaks Battle Timers

**What goes wrong:**
In development, React 18 Strict Mode intentionally mounts every component twice — mount, unmount, mount again — to surface cleanup bugs. Any `useEffect` that fires a battle animation `setTimeout` will fire it twice. A flash effect plays twice. A damage number appears, disappears, reappears. An enemy AI turn triggers twice in the same "turn slot," consuming two turns or producing a ghost action. This is **not a bug in your code** — it is intentional React behavior — but it will make your battle system feel completely broken during development.

This project has already been burned by the `isTyping` bug in a related DialogueRenderer component (see `feedback_strict_mode_istyping.md`), which was the exact same class of problem.

**Why it happens:**
React uses the double-mount to verify that `useEffect` cleanup functions are correct and effects are idempotent. In production builds, each component mounts only once. So tests pass in prod but development is chaos.

**Consequences:**
- Battle animation fires → fires again → `setTimeout` IDs mismatch → clearing the wrong timer
- Turn sequence advances twice → party member takes damage on a "missed" turn
- OVERDRIVE announcement fires twice → player sees duplicate UI warnings
- `isBattleActive` flag set to `true`, immediately back to `false` (cleanup), then back to `true` — can leave battle in an indeterminate phase state

**Prevention:**
Three complementary defenses:

1. **Return cleanup functions from every `useEffect` that touches timers.** Cancel all `setTimeout`/`setInterval` calls on unmount.
```typescript
useEffect(() => {
  const id = setTimeout(() => triggerFlash(), 300);
  return () => clearTimeout(id);
}, [trigger]);
```

2. **Use a ref-guarded idempotency flag for one-shot initializations.** Do not use a boolean state for this — state survives re-render but not the double-mount cycle. Use `useRef`.
```typescript
const initialized = useRef(false);
useEffect(() => {
  if (initialized.current) return;
  initialized.current = true;
  startBattleSequence();
}, []);
```

3. **Never use `useEffect` for turn logic that must not repeat.** Keep the battle state machine in a `useReducer`, and drive animations *from* state changes, not alongside them. The reducer fires once per dispatched action; effects fire twice.

**Detection:**
Run dev build. If any animation or turn event visibly fires twice at startup, this is the source. Add `console.log('EFFECT FIRED')` inside suspect effects and count.

**Phase to address:** Phase 1 (Battle Engine foundation). Fix before writing any animation effects.

---

### Pitfall 2: Stale Closures in `setTimeout` Capture Outdated Game State

**What goes wrong:**
You schedule a delayed action — enemy AI fires after 1200ms, OVERDRIVE damage resolves after 800ms — but the `setTimeout` callback captures state from the render cycle when it was created, not the render cycle when it fires. The callback reads `hp: 95` even though the player has since taken damage and is at `hp: 12`. The enemy AI makes a decision based on ghost data.

This is the stale closure problem, and it is endemic to any React code that mixes `setTimeout` with state reads inside closures.

**Why it happens:**
JavaScript closures capture the variable binding at creation time. React state variables are constants per render. When a new render happens, a new constant is created, but the already-queued `setTimeout` still holds the old one.

**Consequences:**
- Enemy AI targets "the party member with lowest HP" using HP values from 3 turns ago
- OVERDRIVE conditional check (`if hp < 100, trigger OVERDRIVE`) evaluates stale HP → boss never triggers OVERDRIVE, or triggers it twice
- Game Over check fires with pre-damage HP → player survives a fatal hit incorrectly

**Prevention:**
Read state inside `setTimeout` callbacks via refs, not via closed-over state variables.

```typescript
const gameStateRef = useRef(gameState);
useEffect(() => {
  gameStateRef.current = gameState;
}, [gameState]);

// Inside any setTimeout callback:
const handleEnemyTurn = () => {
  setTimeout(() => {
    const current = gameStateRef.current; // always fresh
    const target = current.party.reduce((a, b) => a.hp < b.hp ? a : b);
    dispatch({ type: 'ENEMY_ATTACK', target: target.id });
  }, 1200);
};
```

Alternatively: dispatch an action immediately and resolve the AI logic inside the reducer, where state is always current at dispatch time.

**Detection:**
Log the HP value inside the `setTimeout` callback and compare it to what React DevTools shows as current state at that timestamp. If they differ, you have a stale closure.

**Phase to address:** Phase 1 (Battle Engine). Design the enemy AI turn handler with this in mind from the start. Retrofitting is painful.

---

### Pitfall 3: Shallow Spread Mutations in Nested Party State

**What goes wrong:**
The party is an array of character objects. Each character has nested stats. You spread the array and update one character — but the spread is shallow. Other characters still share reference with the previous render's objects. React bails on re-render for some UI sections because the reference didn't change. Or worse: you accidentally mutate a character in a draft that React still holds a reference to, and two different renders show different HP values for the same character.

**Why it happens:**
```typescript
// BUG: only the array is copied; characters[1] is still the same object reference
const newParty = [...state.party];
newParty[1].hp -= 20; // mutates the original object
```
The array reference changed, so some things re-render. But `newParty[1] === state.party[1]` is still `true`, so components that check character identity by reference will not re-render.

**Consequences for this project:**
- DEADZONE's HP updates visually but TORC's UI does not refresh after AoE damage
- Status effects (e.g., Forge Wall's DEF bonus tracked inside character state) survive transitions they shouldn't because the nested object was never truly replaced
- Game Over check operates on a mutated-in-place version, not the immutable snapshot the reducer should have produced

**Prevention:**
Always spread all the way down:
```typescript
// Correct: copy the array AND the specific character object
const newParty = state.party.map((char, i) =>
  i === targetIndex ? { ...char, hp: char.hp - damage } : char
);
```
Or use `immer` for complex multi-level updates. Given this project uses `useReducer` with no external libs, enforce a lint rule or code review checklist: every reducer case that modifies a character must spread that character explicitly.

**Detection:**
Add `Object.is(prevChar, nextChar)` checks in a dev-mode wrapper around character renders. If a character's HP changed but `Object.is` returns `true`, a mutation happened.

**Phase to address:** Phase 1 (Battle Engine). Write a test reducer case in isolation before wiring to UI. Catch this before the animation layer obscures where state changes originate.

---

### Pitfall 4: Turn Sequence Race Condition from Async Actions + State Batching

**What goes wrong:**
Player hits ATACAR. The attack animation fires. Partway through the animation, the player mashes the action button again. Two `dispatch` calls land inside the same React batching window. Both see the same `currentTurn: 'player'` state. Both resolve as valid player actions. The enemy takes double damage on one "turn." Or the turn counter advances twice and the game skips an enemy turn.

React 18 automatic batching made this worse in an invisible way: state updates inside async callbacks (promises, `setTimeout`, native event handlers) are now batched, meaning multiple dispatches inside a short window can produce a single reconcile with only the last write surviving — or fire multiple actions before the "turn locked" flag has a chance to propagate.

**Consequences:**
- Player executes two skills in one turn, depleting AEGIS-7 before OVERDRIVE triggers
- Enemy gets skipped turn → boss pattern breaks
- OVERDRIVE fires but the "defend lock" window is already over because turn advanced twice

**Prevention:**
Lock the turn in state before any async work. The reducer must reject out-of-sequence dispatches.

```typescript
case 'PLAYER_ACTION':
  if (state.phase !== 'AWAITING_INPUT') return state; // guard
  return { ...state, phase: 'RESOLVING', ...applyAction(state, action.payload) };
```

`phase` is the turn machine's gate. Valid values: `AWAITING_INPUT` → `RESOLVING` → `ENEMY_TURN` → `AWAITING_INPUT`. Any action dispatched during `RESOLVING` or `ENEMY_TURN` is silently dropped by the reducer. The UI should disable all action buttons when `phase !== 'AWAITING_INPUT'`.

**Detection:**
Add `console.assert(state.phase === 'AWAITING_INPUT')` at the top of the player action handler. Any assertion failures in testing are race condition evidence.

**Phase to address:** Phase 1. The phase machine must exist before building any UI interactions.

---

### Pitfall 5: Next.js SSR Hydration Mismatch from Client-Only Game State

**What goes wrong:**
The game initializes with random values (enemy HP jitter, randomized attack rolls, shuffled encounter order). The server renders one value; the client hydrates with a different one. React throws a hydration mismatch error in development and silently corrupts the DOM in production — you get UI showing server-rendered enemy HP numbers while the actual game state has different values.

**Why it happens:**
`Math.random()` and `Date.now()` called at module-initialization time or during the first render produce different values on server and client. Next.js App Router runs React Server Components by default. Any component that initializes game state without an explicit `'use client'` boundary will attempt server rendering.

**Consequences:**
- Enemy HP displayed as the server-computed value; actual game logic uses the client-computed value. Battle ends on the wrong number.
- Press Start 2P font hash injected by server and client differs → hydration warning floods the console

**Prevention:**
Two rules, both mandatory:

1. Mark the entire game shell with `'use client'` at the top of the file. This is a single-player browser game with no SEO requirement. There is no benefit to server rendering game components. Opt out explicitly.

2. Seed all random values inside `useEffect` (or a `useReducer` `INIT` action dispatched from `useEffect`), never during render.
```typescript
// BAD: evaluated during server render
const [enemyHp] = useState(Math.floor(Math.random() * 20) + 40);

// GOOD: seeded after hydration completes
const [enemyHp, setEnemyHp] = useState(0);
useEffect(() => {
  setEnemyHp(Math.floor(Math.random() * 20) + 40);
}, []);
```
Alternatively, use `dynamic(() => import('./BattleEngine'), { ssr: false })` to exclude the entire battle component from SSR.

**Detection:**
Check the browser console for `Warning: Text content did not match` or `Warning: Prop 'X' did not match`. Any such warning in a game component is this pitfall.

**Phase to address:** Phase 1. Add `'use client'` to battle components on day one.

---

### Pitfall 6: "Press Start 2P" Not Loaded Before First Paint

**What goes wrong:**
The game renders before the pixel font downloads. For 200–800ms on first load, every battle UI label, HP number, and action menu appears in a fallback sans-serif font. The pixel aesthetic collapses. Worse: the fallback font has different character widths, so the layout shifts — menu items reflow, HP bars misalign — and after the font loads, everything jumps. This is FOUT (Flash of Unstyled Text) combined with CLS (Cumulative Layout Shift).

**Why it happens:**
Without explicit optimization, `next/font/google` still fetches at runtime on the first server request. The font file is not inlined. If the CDN is slow or the user is on mobile, the window widens.

**Prevention:**
Use `next/font/google` with `display: 'block'` (not `'swap'`). `'swap'` explicitly allows the fallback font to show while loading — the wrong choice for a pixel game where font = aesthetic. `'block'` briefly hides text during font load (FOIT) rather than swapping. For a game, invisible text for 200ms is better than broken aesthetic.

```typescript
// app/layout.tsx or fonts.ts
import { Press_Start_2P } from 'next/font/google';

export const pixelFont = Press_Start_2P({
  weight: '400', // only weight available
  subsets: ['latin'],
  display: 'block', // not 'swap' — prevents FOUT
  variable: '--font-pixel',
  preload: true,
});
```

Additionally: do not render the game UI until the font is confirmed loaded. Use a loading gate or a `<Suspense>` boundary that shows only after the font CSS variable is available.

**Detection:**
Open the Network tab. Throttle to "Slow 3G." Watch the first 2 seconds. If battle UI appears in a non-pixel font even briefly, this is the pitfall.

**Phase to address:** Phase 1, alongside layout setup. Catch before any visual polish work.

---

## Moderate Pitfalls

Problems that degrade quality or require targeted fixes but do not break the game.

---

### Pitfall 7: Multiple Simultaneous CSS Animations Conflicting on the Same Element

**What goes wrong:**
AEGIS-7 fires an attack. The screen flashes (`flash` keyframe on the root container), the character sprite shakes (`tremor` keyframe on the character element), and a particle effect fires (`particles` keyframe on an overlay). All three target the same `transform` or `filter` property on overlapping elements. The browser's compositor tries to apply both a `translateX` from `tremor` and a `scale` from `flash` to the same element. Only the last animation assignment wins; the earlier ones are discarded. One of the three effects silently never plays.

**Why it happens:**
The CSS `animation` shorthand property replaces all animations when reassigned. `animation-composition` (a newer spec) can layer them, but requires explicit opt-in and is not supported in all targets. The more common bug is two React state changes happening close together, each setting a different animation class — the second `className` assignment overwrites the first before the first animation frame renders.

**Prevention:**
- Separate animation concerns onto separate DOM layers. Flash goes on a full-screen overlay `div`. Tremor goes on the character sprite wrapper. Particles go on their own absolutely-positioned canvas or `div`. Different properties on different elements never conflict.
- Use CSS `animation-composition: accumulate` on elements that legitimately need stacked transforms.
- Gate sequential animations with a state machine phase or a promise chain, not simultaneous class additions.
- Stick to `transform` and `opacity` for all animations. Never animate `width`, `height`, `top`, `left`, `background-color` — these trigger layout or paint, not just compositing, and will cause jank during complex battle sequences.

**Detection:**
Open DevTools > Animations panel. Start a battle sequence with multiple simultaneous effects. If an animation appears in the panel for 0ms or not at all, it was overwritten.

**Phase to address:** Phase 2 (Visual Polish / Animation Layer). Design the DOM layer structure in Phase 1 to accommodate this.

---

### Pitfall 8: OVERDRIVE Edge Cases — Incomplete State Guards

**What goes wrong:**
AEGIS-7's OVERDRIVE mechanic requires careful multi-state tracking. The following edge cases will each cause a broken game state if not explicitly handled:

1. **Player defends, but the defending character dies from a different source before OVERDRIVE resolves.** The `isDefending` flag is set, but `hp <= 0`. Should defending still protect a "dead" character? The current design says "any character who does not DEFEND gets 999 damage." A dead character cannot defend. Result: Game Over fires even though the player pressed DEFEND correctly.

2. **All party members are dead before OVERDRIVE fires.** Game Over should have triggered from the previous action. If the battle loop doesn't check for all-dead *after each individual action* (not only after the full turn sequence), OVERDRIVE can fire against a party that's already defeated. The game enters a broken state: OVERDRIVE screen appears after Game Over condition was already met.

3. **OVERDRIVE announced, then player presses DEFENDER on a party member with 0 EN.** DEFENDER is a defensive stance, not an EN-consuming skill — but if the UI groups it with skills or the reducer incorrectly checks EN for DEFENDER, the action silently fails and the character takes 999 damage unexpectedly.

4. **OVERDRIVE fires on the same turn HP drops below 100 (same turn transition).** If the check is `if (hp < 100) triggerOverdrive()` *after* applying damage in the same reducer case, OVERDRIVE announcement and damage resolution can collapse into one turn. The player never sees the warning.

**Prevention:**
- Check for all-party-dead after *every* single action dispatch, not at end of turn.
- OVERDRIVE must be a distinct battle phase: `OVERDRIVE_WARNING` (player input turn with mandatory DEFENDER) → `OVERDRIVE_RESOLVE` (damage applied). These are separate reducer states.
- DEFENDER action must explicitly be gated only on `phase === 'AWAITING_INPUT'`, with zero EN cost, and must not require a living character (a character at 1 HP can still choose DEFENDER).
- Dead characters (`hp <= 0`) are exempt from OVERDRIVE damage — they are already defeated. Only alive characters who fail to defend take 999.

**Detection:**
Write manual test scenarios before connecting UI:
- Deal exactly 101 damage to AEGIS-7 → verify `OVERDRIVE_WARNING` phase activates
- Kill one party member, then receive OVERDRIVE → verify dead member does not re-die
- Have all party members at 0 HP → verify Game Over fires before OVERDRIVE prompt

**Phase to address:** Phase 2 (Boss Encounter). Must be designed in writing before implementation.

---

### Pitfall 9: Enemy AI Infinite Loop or Hanging Turn

**What goes wrong:**
The enemy AI tries to target "the party member with lowest HP." If all party members are dead (`hp <= 0`), the `Array.reduce` or `Array.find` that selects the target returns `undefined`. The AI tries to attack `undefined.id`. JavaScript throws. The turn never resolves. The game freezes silently — no error message, no Game Over screen, just a locked UI. The player has no indication the game has crashed.

A second variant: the AI is implemented as a while-loop searching for a valid target. If no valid target exists (e.g., all characters have `isStunned: true`), the loop runs forever and locks the JavaScript thread.

**Prevention:**
- Always validate enemy targets before computing AI action. If `validTargets.length === 0`, dispatch `GAME_OVER` immediately.
- Never use `while` loops in game logic. Use a `useReducer` dispatch cycle — each "iteration" is a dispatched action. The render cycle provides natural throttling.
- Add a defensive fallback: if `AI_TURN` is dispatched and no valid target can be computed, force-transition to `BATTLE_ERROR` or `GAME_OVER` phase rather than silently hanging.

```typescript
case 'ENEMY_TURN': {
  const validTargets = state.party.filter(c => c.hp > 0);
  if (validTargets.length === 0) {
    return { ...state, phase: 'GAME_OVER' };
  }
  const target = selectTarget(state.enemy, validTargets);
  // ...
}
```

**Detection:**
Force-kill the entire party through dev console. If the game does not reach Game Over screen within 2 seconds, the AI loop is hanging.

**Phase to address:** Phase 1 (Battle Engine). Defensive target validation from day one.

---

### Pitfall 10: Game Over State Not Fully Resetting — Ghost State on Restart

**What goes wrong:**
Player hits Game Over. The "RETRY" button resets `hp` values back to initial stats. But:
- `isDefending` flags are still `true` on party members who were defending when they died
- Status effects (Forge Wall DEF bonus) have `turnsRemaining: 1` from the last battle
- AEGIS-7's `overdrivePending` flag is still `true`
- Turn counter is still on turn 14 instead of turn 1
- Phase is `GAME_OVER` and the retry just resets HP, not phase

The player starts the new game in an instantly-broken state: OVERDRIVE fires on turn 1, the DEF bonus is active from the start, and characters with `isDefending: true` can't perform any offensive action.

**Prevention:**
The reset is not "reset HP to initial values." The reset is "discard all state and reinitialize from scratch."

Use React's `key` prop pattern for complete subtree resets — the most reliable method:
```typescript
const [battleKey, setBattleKey] = useState(0);

// On Game Over retry:
const handleRetry = () => setBattleKey(k => k + 1);

return <BattleEngine key={battleKey} />;
```
Incrementing `key` forces React to destroy and recreate the entire `BattleEngine` tree. All state, all refs, all timers — gone. No explicit "reset all fields" logic needed, no risk of forgetting a nested flag.

Alternatively, ensure the `useReducer` has an `INIT` action that returns exactly the same initial state object as the reducer's initial argument, and dispatch `INIT` on retry. But the `key` pattern is more bulletproof.

**Detection:**
Complete a full playthrough until Game Over. Retry. On turn 1 of the new game, check: Is OVERDRIVE pending? Are any status effects active? Is any character flagged as defending? If yes, the reset is partial.

**Phase to address:** Phase 2 (Game Over / Win screens). But design the state shape in Phase 1 to support clean resets.

---

## Minor Pitfalls

Low severity but will surface during polish.

---

### Pitfall 11: `will-change` Overuse Consuming GPU Memory

**What goes wrong:**
Every battle element gets `will-change: transform` applied to pre-promote it to its own GPU compositing layer. With character sprites, HP bars, enemy sprite, background, overlay, and particle effects all on separate layers, the GPU memory overhead becomes measurable. On lower-end hardware or when browser tabs are competing for GPU resources, this can cause frame drops — the opposite of the intended effect.

**Prevention:**
Apply `will-change: transform` only to elements that are *currently animating*, not all potentially-animatable elements. Add the class via JavaScript immediately before the animation starts; remove it after. Do not put `will-change` in static Tailwind classes that are always present.

**Phase to address:** Phase 3 (Performance pass). Not a blocking concern early on.

---

### Pitfall 12: Tailwind `animate-` Classes Not Triggering Re-animation

**What goes wrong:**
You use a Tailwind animation class (e.g., `animate-bounce` or a custom `animate-flash`) to trigger a one-shot effect. The class is added via state change. It plays once. On the next attack, you set the same state to trigger it again — but because the class name is identical, React does not remove and re-add the class. The DOM never sees a class change, so the animation does not replay.

**Prevention:**
Use a technique called "animation key rotation" — toggle a boolean in state that swaps between two equivalent animation class names, or append a timestamp to a CSS custom property to force the browser to reset the animation timeline. The cleanest approach:

```typescript
// Toggle between two class names that trigger the same animation
const [flashVariant, setFlashVariant] = useState<'a' | 'b'>('a');

const triggerFlash = () => setFlashVariant(v => v === 'a' ? 'b' : 'a');

// CSS: both .flash-a and .flash-b apply the same @keyframes flash animation
```
Each toggle is a different class name → React diffs it → the DOM updates → the animation restarts.

**Phase to address:** Phase 2 (Animation Layer). Will surface the first time you try to trigger the same attack animation twice in a row.

---

### Pitfall 13: `requestAnimationFrame` vs CSS Animations — Wrong Tool for the Job

**What goes wrong:**
You start building battle animations with `requestAnimationFrame` loops in JavaScript, reasoning that it gives you more control. In reality, for this project's animation needs (screen flash, character shake, particle burst), `requestAnimationFrame` adds complexity with no benefit. CSS keyframe animations are already composited on the GPU, fire at 60fps by default, and do not involve React's render cycle. `requestAnimationFrame` in React requires cleanup, stale closure guards, and manual interpolation math.

The inverse mistake is also possible: using CSS transitions for state-driven logic (e.g., `transition: opacity` on the HP bar) that needs to respond to discrete state changes. Transitions do not replay when the value bounces between the same start and end points.

**Prevention:**
Rule of thumb for this project:
- **Visual effects with a defined duration** (flash, shake, particle burst): CSS `@keyframes` animations, triggered by class addition.
- **Continuous or reactive visual state** (HP bar width, EN bar fill): CSS `transition` on a value driven by React state.
- **Turn-sequenced orchestration** (wait 300ms, then show damage number, then wait 500ms, then trigger enemy turn): `setTimeout` chains, cleaned up with `useRef` to store timer IDs.
- **Never use `requestAnimationFrame`** for this project unless profiling shows a specific CSS animation is causing jank (it won't for this scope).

**Phase to address:** Phase 1 (Architecture decision). State this rule in a comment in the animation utility module.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Battle Engine scaffold | Strict Mode double-mount (Pitfall 1) | Add cleanup to all effects on day one |
| Battle Engine scaffold | SSR hydration on game state (Pitfall 5) | Add `'use client'` to all game components immediately |
| Turn system implementation | Stale closures in AI timer (Pitfall 2) | Use `gameStateRef` pattern from the start |
| Turn system implementation | Turn sequence race conditions (Pitfall 4) | Build the phase gate before any UI |
| Party state updates | Shallow spread mutation (Pitfall 3) | Review every reducer case that modifies a character |
| Layout setup | Press Start 2P FOUT (Pitfall 6) | Set up `next/font` with `display: 'block'` before any visual work |
| Animation layer | Class-toggle re-animation failure (Pitfall 12) | Use variant-toggle pattern from first animation |
| Animation layer | Simultaneous animation conflicts (Pitfall 7) | Separate concerns onto distinct DOM layers |
| Boss encounter design | OVERDRIVE edge cases (Pitfall 8) | Write edge case specs before implementation |
| Boss encounter design | All-dead before OVERDRIVE (Pitfalls 8 + 9) | Check for party wipe after every single action |
| Game Over screen | Partial state reset on retry (Pitfall 10) | Use React `key` prop to force full tree remount |
| Performance pass | `will-change` overuse (Pitfall 11) | Apply only during active animation, remove after |

---

## Sources

- React StrictMode docs: https://react.dev/reference/react/StrictMode
- Next.js hydration error docs: https://nextjs.org/docs/messages/react-hydration-error
- Next.js font optimization: https://nextjs.org/docs/app/getting-started/fonts
- MDN CSS animation performance: https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/CSS_JavaScript_animation_performance
- React immutable update patterns: https://react.dev/learn/updating-objects-in-state
- Redux immutable update patterns: https://redux.js.org/usage/structuring-reducers/immutable-update-patterns
- Stale closures in React hooks: https://dmitripavlutin.com/react-hooks-stale-closures/
- Race conditions in React useState (2026): https://leo88.medium.com/usestate-race-conditions-gotchas-in-react-and-how-to-fix-them-48f0cddb9702
- React infinite loop patterns: https://blog.logrocket.com/solve-react-useeffect-hook-infinite-loop-patterns/
- Building browser game with React — what doesn't work: https://dev.to/nyaomaru/building-a-browser-game-with-react-what-doesnt-work-well-run-away-from-work-1khf
- State machine in React: https://mastery.games/post/state-machines-in-react/
- GPU animation in CSS: https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/
- useReducer reset patterns: https://mtm.dev/reset-usereducer-state
- React Strict Mode double useEffect GitHub issue: https://github.com/facebook/react/issues/24502
- Project memory: Strict Mode isTyping bug (feedback_strict_mode_istyping.md)
