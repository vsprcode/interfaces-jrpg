# Feature Landscape: Turn-Based JRPG Demo

**Domain:** Browser-based turn-based JRPG — 4-encounter combat demo
**Project:** [In]terfaces — Arcologia Casting-7 demo
**Researched:** 2026-04-25

---

## Table Stakes

Features that every player implicitly expects from a turn-based JRPG. Missing any of these makes the game feel unfinished — not "bare-bones," just *broken*.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Command menu per actor per turn | The genre's defining interaction. No menu = no JRPG. | Low | ATACAR / HABILIDADE / DEFENDER / ITEM — already in scope |
| HP bars visible at all times | Players can't make decisions without knowing party state | Low | Both party and enemy HP must be readable at a glance |
| Damage numbers floating on hit | Feedback that the action *registered*. Absent numbers feel like silence. | Low | Floats up and fades; critical hits deserve a distinct number style |
| Turn-by-turn resolution with legible sequencing | Player must see whose action fires and what happens | Low | Attack → animation → result. No simultaneous resolution without explicit visual separation |
| EN/MP resource for skills shown at all times | Players can't decide to use a skill if they don't know the cost vs their current resource | Low | EN bars below HP bars is the standard spatial contract |
| Enemy death confirmation | A clear visual state — they disappear, go gray, collapse — that combat is over | Low | Without it, players re-attack corpses waiting for something to happen |
| Victory resolution and XP/reward display | Players expect to know they won and why it mattered. The "numbers go up" moment is load-bearing for engagement. | Low | For a demo without leveling, this is a recap screen with narrative text |
| Game Over state with Retry | Death must be recoverable. Without retry, players close the tab. | Low | Modern standard: retry the encounter, not the full run |
| Status effect icons on affected units | Once you inflict or receive a status, you must be able to see it persists | Medium | Small icons on the portrait/HP bar row are the convention |
| Enemy behavior differentiation | The three enemy archetypes (always attack / target lowest HP / random) must *feel* different or they're all the same enemy with more HP | Medium | Enemy AI already specified in PROJECT.md; the behavior must be legible to the player |
| Skill cost validation (disabled if insufficient EN) | The game must prevent issuing an impossible command, or players feel cheated | Low | Gray out skill if current EN < cost |
| Ability to identify what enemies will do | Players can't form strategy without some enemy intent cue | Medium | Can be a post-action narration ("ENFORCER targets the weakest agent") rather than a pre-action indicator |

---

## Battle UI Components — Anatomy

What each UI zone must contain. Based on analysis of Final Fantasy, Persona 5, and Dragon Quest UI conventions.

### Party Panel (bottom or side)

Each party member needs, simultaneously visible:
- Name / codename
- HP current / max with bar fill (color-coded: green > yellow > red threshold)
- EN current / max with bar fill (blue or electric cyan — fits the Blue Wave palette)
- Active status effect icons (up to 2–3 slots; rare to need more in a 4-battle demo)
- "DEAD" or grayscale state when at 0 HP

Persona 5's lesson: the party panel is the player's dashboard. If they have to hunt for HP, you've already broken their attention flow.

### Enemy Panel (center or top)

- Enemy name
- HP bar only (no EN — enemies in this scope don't use tracked EN)
- Status effect icons
- For AEGIS-7: a second indicator bar for the OVERDRIVE threshold ("OVERDRIVE READY at < 100 HP") is essential preparation, not optional polish

### Command Menu

- 4 options: ATACAR / HABILIDADE / DEFENDER / ITEM
- Active player's name visible above menu
- HABILIDADE sub-menu: skill name, EN cost, brief description
- Grayed-out state for HABILIDADE when EN < cost

Persona 5 finding: mapping actions to distinct visual positions (not just a scrollable list) makes selection feel faster and more intentional. For a keyboard-driven game, arrow keys + Enter is the minimum; 1/2/3/4 shortcuts are a differentiator.

### Battle Log

- Last 2–3 actions in a scrollable or fading text area
- Format: `[DEADZONE] uses Signal Null — 34 damage (DEF ignored)`
- Critical for accessibility: some players don't process animations; they read the log

---

## Animation and Feedback Requirements

**Essential (without these, combat feels inert):**

| Effect | What It Does | Implementation |
|--------|--------------|----------------|
| Hit flash | Character sprite briefly inverts or flashes white on taking damage | CSS: `animation: hitFlash 200ms; filter: brightness(5)` — one keyframe |
| Damage number popup | Floats up from the target and fades | CSS: `translateY(-40px)` + `opacity: 0` over ~600ms |
| Camera shake on heavy hits | Screen shakes on boss attacks or crits | CSS: `@keyframes shake` — horizontal ±4–6px over 300ms |
| HP bar drain animation | HP doesn't snap to new value, it drains | CSS `transition: width 400ms ease-out` on the bar fill |
| DEFENDER stance visual | Party member needs a visible "guarding" indicator — a shield icon, border color, or "DEFENDING" label | Single CSS class toggle |
| OVERDRIVE warning flash | When AEGIS-7 announces TERMINUS, the screen/boss needs an alarm-level visual state | Full-screen red border pulse or backdrop tint |
| Turn highlight | The currently-acting character should be visually distinguished | Border glow on active portrait |

**Nice-to-Have (meaningful but not blocking):**

| Effect | What It Adds | Cost |
|--------|--------------|------|
| Idle animation on character portraits | Characters feel alive, not static images | Medium — CSS breathing scale loop |
| Skill-specific particle effects | Signal Null should look electric; Forge Wall should look structural | Medium per skill — CSS box-shadow + radial-gradient bursts |
| Screen tint on status application | When a debuff lands, a brief color wash (red for damage states) communicates the register | Low |
| Victory animation on party members | A small bounce or flash on winners before the victory screen | Low |
| Boss phase transition cutscene text | "AEGIS-7: OVERDRIVE INITIALIZED" as a banner overlay before the mechanic activates | Low-Medium |

**Do Not Build (scope kills):**

- Sprite sheet walking / attack animations — this is not Pokémon; CSS portraits with state classes are sufficient
- Parallax battle backgrounds — one static layer per encounter is correct
- Sound effects (unless trivially via Web Audio API tone generators) — audio requires asset pipeline; no audio is better than broken audio

---

## Status Effects System

**For this demo scope, only implement effects that are already demanded by the character kit or enemy design.** More effects = more state to manage, more edge cases, more QA time.

### Recommended: Implement These Three

| Status | Who Uses It | What It Does | Why Include |
|--------|-------------|--------------|-------------|
| SHIELD (TORC's Forge Wall) | Party | DEF +8 for the group, 2-turn duration | Already in the skill spec; must track turn countdown |
| HEAL/CLEANSE (TRINETRA's System Override) | Party target | Restores 30 HP OR removes negative status | Already in spec; the OR condition adds strategic depth without complexity |
| OVERDRIVE (AEGIS-7) | Enemy boss | Announces TERMINUS incoming; if party doesn't DEFEND next turn, 999 damage | The entire boss mechanic — non-negotiable |

### Optional: One Offensive Status

If AEGIS-7 or an enemy in encounters 2–3 needs more texture, add exactly one:

- **DISRUPTED** (custom name fitting the [In]terfaces lore) — equivalent to Poison; deals 5 HP per turn for 3 turns. Signal Null applying DISRUPTED on a critical hit would make DEADZONE's role more interesting. Only add if development time allows.

### Do Not Implement

| Status | Why Not |
|--------|---------|
| Confusion / Charm | Loss of player control in a demo creates frustration, not depth |
| Sleep / Paralysis (skip turn) | Skip-turn effects break AI timing logic; high implementation risk for low payoff |
| Blind (accuracy reduction) | Requires miss calculation; this battle system has no to-hit roll in the spec, so adding one for a status effect is scope creep |
| Silence (prevent skill use) | Only matters if enemies use skills that need countering — not in the current enemy roster |

The guiding principle: each status effect must interact with *at least* one party skill already in scope. Orphaned status effects (effects that no character can apply or remove) add complexity with no strategic return.

---

## The OVERDRIVE Mechanic

This is the most technically and narratively important feature in the demo. It must be designed right.

### The Pattern: Announce > React > Resolve

The "defend or die" structure is a well-established JRPG pattern (Final Fantasy's "preparing a powerful attack," Persona's technical vulnerabilities, Undertale's SAVE mechanic). What makes them work is **clarity before punishment.**

**Three-phase execution:**

**Phase 1 — Trigger (when AEGIS-7 HP drops below 100):**
- The action that deals the killing blow to cross the threshold should complete normally
- Then: a dedicated OVERDRIVE announcement fires before the next turn begins
- UI treatment: A full-width banner text ("AEGIS-7: CARREGANDO ATAQUE TERMINUS") on a red-tinted overlay
- The battle log must record: "AEGIS-7 iniciando protocolo TERMINUS — todos os agentes devem DEFENDER"
- This is NOT a subtle cue. It must be unmissable.

**Phase 2 — The Choice Turn:**
- All three party members must choose DEFENDER independently
- The DEFENDER option should be visually highlighted or given a warning annotation during this turn only: `[DEFENDER] — OBRIGATÓRIO`
- If any member chooses a non-DEFENDER action, their portrait should change state (dimmed, warning icon) before the turn resolves — giving the player one last visual confirmation

**Phase 3 — TERMINUS Resolution:**
- AEGIS-7 fires the attack
- Any non-defending party member receives 999 damage — instant knockout
- If all three defended: the attack is absorbed with a "DEFLECTED" text on each defender
- If any party member is dead before OVERDRIVE fires (already at 0 HP), they are already dead — do not apply 999 to a corpse (this causes a logical edge case)

### Fairness Protocol

From the telegraphing research: the mechanic is fair when **the player understands what they needed to do before they fail, not only after.** For a demo, where players have no prior knowledge:

1. The announcement must name the required response explicitly ("DEFENDER")
2. The consequence must be previewed, not discovered post-mortem ("dano letal se não defender")
3. On a Game Over from OVERDRIVE, the retry screen should note what happened: "TERMINUS destruiu agentes não protegidos — tente DEFENDER no próximo turno"

This prevents the "first encounter is a mandatory death" problem common in unfair boss gimmick designs.

### OVERDRIVE Boss Phase State

After OVERDRIVE fires (whether deflected or lethal), AEGIS-7 should enter a new attack pattern or at minimum return to normal attacks. The phase transition is the boss mechanic's *conclusion*, not its beginning. If OVERDRIVE just repeats every 3 turns indefinitely, it loses its weight.

Recommendation: OVERDRIVE fires once at the HP threshold. After it resolves, AEGIS-7 returns to normal attacks but at +5 ATK (signaling "wounded and dangerous"). This gives the fight a clear dramatic arc.

---

## Victory and Defeat Screens

### Victory Screen

What makes it satisfying, from player psychology and JRPG convention:

1. **A clear signal that it's over** — A victory jingle equivalent (if audio is out of scope, a gold text banner "MISSÃO CUMPRIDA" against a dark background with screen flash serves the same function)
2. **Named acknowledgment of what happened** — Don't just show a "VICTORY" title. Show who survived, who was critical. "DEADZONE: sobreviveu / TORC: sobreviveu / TRINETRA: crítico (12 HP)" gives the moment texture
3. **Brief narrative continuation** — In a worldbuilding demo, every victory screen is an opportunity to deliver one line of lore. "O corredor 7-A está livre. O sinal analógico se expande." — costs nothing, adds everything
4. **One clear action** — "CONTINUAR" button. No menu, no stats screen, no loot table. For a demo, forward momentum is the only reward.

What to avoid: Long XP tallying animations (there's no leveling), loot rolls, or any screen that makes the player wait more than 3 seconds before they can press a button.

### Defeat / Game Over Screen

1. **Name the cause** — "TERMINUS destruiu agentes não protegidos" / "Agentes eliminados — missão fracassada"
2. **Two options only** — TENTAR NOVAMENTE (retry same encounter) and MENU PRINCIPAL
3. **Retry must restart from the top of the encounter, not from the game start** — No exceptions. Modern JRPG standard. Players who lose at AEGIS-7 should not replay encounters 1–3.
4. **Emotional tone fits the universe** — The [In]terfaces tone is not heroic "TRY AGAIN." Consider: "A resistência continua. Tente novamente?" — same function, different register.

For OVERDRIVE-specific deaths, the Game Over screen can carry a specific message explaining the mechanic, making the first failure instructional.

---

## What Differentiates Memorable Demos

Based on research into what JRPG demos were praised for (2023–2025 indie and major releases):

**1. The first encounter teaches; it does not challenge.**
DEADZONE solo in Encounter 1 is ideal design. It is a controlled tutorial in disguise. The player learns the command menu, EN cost, and damage calculation with zero pressure. Do not add enemy pressure to Encounter 1 — its job is onboarding, not combat.

**2. Each encounter introduces exactly one new variable.**
Encounter 1: solo + basic attack loop. Encounter 2: +TORC, introducing group buffs and multi-enemy positioning. Encounter 3: +TRINETRA, introducing healing and status removal. Encounter 4: boss mechanic. The demo has a perfect escalation ladder built into its premise — do not break it by front-loading features.

**3. The aesthetic is a character, not decoration.**
The Blue Wave palette (electric cyan, deep space blacks, neon glows) and "Press Start 2P" font are not skin — they communicate the [In]terfaces universe before a single line of dialogue. Every UI element should reinforce the feeling of a cold, institutional system being fought from within. The battle UI should look like it *belongs to Casting Syndicate* — clinical, grid-based, surveillance-panel-styled — while the player's actions disrupt it.

**4. Character skill names carry lore.**
Signal Null, Forge Wall, System Override — these names do narrative work. The skill descriptions should deepen them: "Signal Null: transmissão de ruído puro — anula assinatura digital do alvo." A player who reads that understands DEADZONE's character before any cutscene.

**5. Combat log is a narrative layer.**
Every action line in the battle log is an opportunity: `"AEGIS-7 trava ENFORCER PATROL em [TORC] — prioridade de ameaça detectada"`. This takes 5 extra characters in the log template and doubles the worldbuilding density of every encounter.

---

## Anti-Features

Features to deliberately not build for this demo. Each has a reason.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Leveling / XP progression | Creates expectation of grind; a 4-battle demo cannot deliver a meaningful progression arc | Replace with narrative rewards between encounters — lore text, character dialogue |
| Inventory management / item drops | Item looting requires UI, state management, and player decisions with no payoff in 4 battles | One consumable: Nano-Med, limited quantity, no loot | 
| Random encounter rate or randomized encounter order | Randomness undermines the demo's role as a worldbuilding showcase; encounters have specific identities | Linear sequence only |
| Multiple difficulty settings | A demo scope doesn't have the testing budget to balance two difficulty curves; one well-tuned curve is better than two unbalanced ones | Single difficulty; ensure AEGIS-7 is challenging but fair |
| Equipment / gear system | Gear requires inventory, stats interaction, and UI complexity; none of it pays off in 4 battles | Character stats are static, differentiated by class role |
| Elemental weakness/resistance grid | Adds a layer of memorization that a demo can't teach adequately | Signal Null's DEF-ignore is effectively a pseudo-element advantage without requiring a type chart |
| Multiple routes / branching encounters | A demo that showcases worldbuilding benefits from a fixed, directed narrative — branching dilutes authorial control | Linear progression; player agency lives in tactical choices within battles, not in encounter selection |
| Full-screen animated skill cinematics | Sprites + CSS can suggest power without 5-second cinematics. Cinematics break combat pacing. | 300ms screen flash + particle burst + log text is sufficient. Reserve the pause for OVERDRIVE only. |
| Skip/auto-battle functionality | Auto-battle suggests the combat isn't worth playing. For a demo, combat IS the product. | Fast, well-paced combat makes auto-battle unnecessary |
| Save / load system | Linear demo, no save needed; adds implementation risk for zero reward | Browser session persistence only; resume not needed |

---

## Feature Dependencies

```
HP/EN bars
  └── required by: Command menu validation (EN < cost → gray out)
  └── required by: Victory/defeat condition (HP = 0)

DEFENDER action
  └── required by: OVERDRIVE mechanic (must exist before AEGIS-7 can demand it)
  └── required by: TORC's role (Forge Wall buys time; DEFENDER absorbs the killing blow)

OVERDRIVE state machine
  └── depends on: AEGIS-7 HP threshold detection
  └── depends on: DEFENDER action existing
  └── depends on: Party-wide forced choice on that specific turn
  └── outputs to: Game Over screen (if failed) or phase 2 of AEGIS-7

Status effect tracking
  └── SHIELD (Forge Wall): requires turn countdown (2 turns)
  └── CLEANSE (System Override): requires status slot that can be empty
  └── OVERDRIVE: requires a boolean state on AEGIS-7, not a character status

Victory screen
  └── depends on: all enemies at HP = 0
  └── outputs to: next encounter intro or DEMO COMPLETED screen

Game Over screen
  └── depends on: all party members at HP = 0
  └── must include: retry (restart encounter) and main menu
```

---

## MVP Feature Set

Priority order — build in this sequence:

1. **Command menu + turn resolution loop** — the core game loop; nothing else works without it
2. **HP/EN display + damage calculation** — combat is meaningless without legible numbers
3. **Victory and defeat conditions + screens** — the loop needs start and end states before any content is added
4. **Encounter 1 (DEADZONE solo)** — first content pass validates the whole loop
5. **DEFENDER action** — required for all boss logic; build it before Encounter 4 content
6. **OVERDRIVE mechanic** — the demo's set piece; must be correct and fair
7. **Status effects: SHIELD (Forge Wall), CLEANSE (System Override)** — character differentiation
8. **Damage popup + hit flash animations** — first layer of game feel; without this, Encounter 1 feels like a spreadsheet
9. **Camera shake + OVERDRIVE warning visual** — second layer of game feel; boss fight tension
10. **Battle log with lore-flavored text** — narrative layer; can be generic strings first, then refined

Defer until all encounters playable:
- Idle animations on portraits
- Skill particle effects (beyond hit flash)
- Per-encounter intro cinematics (can be placeholder text on first pass)

---

## Sources

- [Sinister Design: 12 Ways to Improve Turn-Based RPG Combat](https://sinisterdesign.net/12-ways-to-improve-turn-based-rpg-combat-systems/) — clarity, determinism, tactical tools principles
- [Gamedeveloper: Enemy Attacks and Telegraphing](https://www.gamedeveloper.com/design/enemy-attacks-and-telegraphing) — telegraphing fairness principles
- [Gamedeveloper: Zeboyd Games Approach to JRPG Design](https://www.gamedeveloper.com/design/the-zeboyd-games-approach-to-jrpg-design) — density, anti-grind, pacing philosophy
- [Boss Design Reference](https://gerardclotet.github.io/Boss-Design/) — phase transitions, tension, agency vs. feeling cheated
- [Persona 5 UI/UX Analysis](https://ridwankhan.com/the-ui-and-ux-of-persona-5-183180eb7cce) — command menu, turn indicator, animation speed
- [Persona 5 Menus: Personality and Readability](https://medium.com/@fruitcupkun/persona-5-menus-with-personality-and-readability-d6db2e0b253e) — visual design principles
- [Atlus on Persona 5 UI Design Secrets](https://www.siliconera.com/atlus-reveals-design-secrets-behind-persona-5s-distinctive-ui/) — thematic UI integration
- [Standard Status Effects — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/StandardStatusEffects) — status effect taxonomy and player expectations
- [NeoGAF: Best Battle Presentation in Turn-Based RPG](https://www.neogaf.com/threads/best-battle-presentation-in-a-turn-based-rpg.1078037/) — community consensus on standout examples
- [Best JRPG Demos To Try Before You Buy — The Gamer](https://www.thegamer.com/best-jrpg-demos/) — what successful demos offer
- [ResetEra: Victory Results Screens](https://www.resetera.com/threads/victory-results-screens-in-rpgs-are-annoying-please-let-players-completely-disable-them-to-speed-things-up-devs.556687/) — player friction points around result screens
- [JRPGs That Reinvented Turn-Based Combat — Game Rant](https://gamerant.com/jrpgs-reinvented-turn-based-combat/) — Grandia turn order, Octopath innovations
