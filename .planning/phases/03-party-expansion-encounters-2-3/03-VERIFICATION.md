---
phase: 03-party-expansion-encounters-2-3
verified: 2026-04-26T16:46:56Z
status: human_needed
score: 14/14 must-haves verified
overrides_applied: 0
human_verification:
  - test: "E1 -> DialogueBox -> E2 full playthrough"
    expected: "Defeat Probe MK-I, DialogueBox shows 'TORC: Você sobreviveu ao corredor' first line, advance 3 times, E2 starts with DEADZONE+TORC in HUD vs 2 Networker Enforcers. DEADZONE HP carries from E1. TORC EN starts at max."
    why_human: "Cannot headlessly verify React rendering, HP bar carry visual, or party composition in browser DOM without running dev server."
  - test: "Forge Wall SHIELD badge countdown in browser"
    expected: "On TORC's turn, clicking HABILIDADE fires Forge Wall. Both party HUDs show 'SHIELD 2T'. After one full round, badge decrements to 'SHIELD 1T'. After second round, badge disappears."
    why_human: "Status badge rendering and decrement timing require live game state in browser; cannot verify animation progression headlessly."
  - test: "Camera shake on heavy hit (VISUAL-04)"
    expected: "When Networker Enforcer deals >= 20% of target maxHp (>= 19 on DEADZONE maxHp=95 = 19 threshold), the battle container visibly shakes (shakeA/shakeB class toggle). No layout thrash (transform only)."
    why_human: "CSS animation timing and visual perception require human verification; class toggle is code-verified but animation quality must be confirmed in browser."
  - test: "SKILL_SHIELD and SKILL_HEAL CSS keyframe quality (VISUAL-05)"
    expected: "SKILL_SHIELD (Forge Wall): cyan box-shadow pulse visible on party zone. SKILL_HEAL (System Override): ripple animation visible on HUD area. Both complete within ~600ms and do not block input (pointer-events: none confirmed in CSS)."
    why_human: "Animation keyframe quality and visual perception require human verification. Code wiring is verified; visual effect fidelity cannot be confirmed headlessly."
  - test: "E2 -> DialogueBox -> E3 full playthrough with TRINETRA picker"
    expected: "After E2 victory, TRINETRA intro DialogueBox (3 lines) shows, then E3 starts with full trio vs 3 Patrol Bots. TRINETRA's HABILIDADE opens 2-step picker (target -> CURAR/LIMPAR STATUS). System Override dispatches correctly."
    why_human: "Multi-step UI flow and encounter chain progression require live browser interaction."
  - test: "TurnOrderIndicator SPD ordering in browser"
    expected: "TurnOrderIndicator visible above enemy zone, showing upcoming queue entries. Player entries in cyan, enemy entries in red, separated by chevron. SPD ordering matches engine (DEADZONE SPD:18 > TRINETRA SPD:15 > TORC SPD:12 > Patrol Bot SPD:9)."
    why_human: "Visual rendering and ordering correctness in browser context requires human inspection."
  - test: "Game Over retry behavior"
    expected: "When all party members are defeated, Game Over screen appears. Clicking TENTAR NOVAMENTE restarts the current encounter (not E1) with fresh party state."
    why_human: "Game Over -> retry flow requires live interaction to confirm encounterIndex persists and battleKey increments correctly."
---

# Phase 3: Party Expansion (Encounters 2 & 3) Verification Report

**Phase Goal:** Extend the game to 3 playable encounters — TORC and TRINETRA join DEADZONE, new enemy behaviors, encounter chain with HP persistence, status effects, and cinematic dialogue bridges.
**Verified:** 2026-04-26T16:46:56Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After E1 victory, DialogueBox introduces TORC, E2 begins with DEADZONE+TORC vs 2 Networker Enforcers; HP carries from E1, EN resets | VERIFIED (code) / human_needed (browser) | `GameController.tsx`: E1 victory → `ENCOUNTER_2_DIALOGUE` → E2 with `carryParty` (HP carried); `en: c.maxEn` resets on transition; DialogueBox `E2_DIALOGUE` has 3 TORC lines; `ENCOUNTER_CONFIGS[1]` has 2 Networker Enforcers |
| 2 | Player casts Forge Wall, SHIELD badge shows 2T countdown, decrements and expires; Networker Enforcers target lowest-HP ally in battle log | VERIFIED (code) / human_needed (browser) | `reducer.ts`: TORC SKILL branch applies DEF_BUFF +8 to all alive party; `decrementStatuses` in end-of-round branch; `CharacterHUD.tsx`: `statusBadge` with `STATUS_ICON_MAP.DEF_BUFF = 'SHIELD'`; `enemyAI.ts`: TARGET_LOWEST_HP sorts by `a.hp - b.hp` ascending |
| 3 | After E2 victory, TRINETRA joins for E3 vs 3 Patrol Bots; System Override heal OR remove status works; Patrol Bots pick random live targets | VERIFIED (code) / human_needed (browser) | `GameController.tsx`: E2 victory → `ENCOUNTER_3_DIALOGUE` → E3 with TRINETRA added; `ENCOUNTER_CONFIGS[2]` has 3 Patrol Bots; `reducer.ts`: TRINETRA SKILL branch handles HEAL/REMOVE_STATUS; `enemyAI.ts`: ATTACK_RANDOM uses Math.random(); `ActionMenu.tsx`: SkillSelectStep two-step picker wired |
| 4 | TurnOrderIndicator displays upcoming SPD queue; camera shake fires on heavy hits without layout thrashing | VERIFIED (code) / human_needed (browser) | `TurnOrderIndicator.tsx` exists and wired in `BattleScene.tsx` with `state.turnQueue`/`state.currentTurnIndex`; `BattleScene.tsx`: `setShakeVariant` toggle when `abs(hpDelta.amount) >= floor(target.maxHp * 0.2)`; `.shakeA/.shakeB` use transform only (no layout thrash) |

**Score:** 4/4 roadmap truths verified in code; all 4 require human browser confirmation

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/types.ts` | Extended EnemyId union with 6 instance IDs; PlayerAction.skillVariant | VERIFIED | 7 EnemyIds confirmed: CASTING_PROBE_MK1 + 6 new; `skillVariant?: 'HEAL' \| 'REMOVE_STATUS'` present |
| `src/data/characters.ts` | TORC and TRINETRA exports with correct stats | VERIFIED | TORC (HP:130, EN:20, ATK:18, DEF:20, SPD:12) and TRINETRA (HP:85, EN:35, ATK:15, DEF:12, SPD:15) exported |
| `src/data/enemies.ts` | 6 enemy instances with unique IDs and correct behavior types | VERIFIED | NETWORKER_ENFORCER_A/B (TARGET_LOWEST_HP), CASTING_PATROL_BOT_A/B/C (ATTACK_RANDOM) all exported |
| `src/data/encounters.ts` | ENCOUNTER_CONFIGS with 3 encounter definitions | VERIFIED | File exists; 3 configs: E1 (corridor/DEADZONE/Probe), E2 (loading_dock/DEADZONE+TORC/2 Enforcers), E3 (server_room/trio/3 Bots) |
| `src/engine/reducer.ts` | WR-01/02/04 fixes; TORC/TRINETRA SKILL branches; decrementStatuses | VERIFIED | 6 `nextPhase.*kind` matches for WR-01/02; `actorId === 'TORC'` and `actorId === 'TRINETRA'` branches; `decrementStatuses` defined and called only in end-of-round branch |
| `src/engine/enemyAI.ts` | TARGET_LOWEST_HP and ATTACK_RANDOM real implementations; no throws | VERIFIED | `sort((a, b) => a.hp - b.hp)[0]` for TARGET_LOWEST_HP; Math.random() for ATTACK_RANDOM; no `throw` statements |
| `src/components/GameController.tsx` | Encounter state machine E1->E2->E3; HP carry; DialogueBox routing | VERIFIED | `encounterIndex` state; `ENCOUNTER_CONFIGS` used; `en: c.maxEn`, `statusEffects: []` on transition; `ENCOUNTER_2_DIALOGUE` and `ENCOUNTER_3_DIALOGUE` controller phases |
| `src/components/EncounterCompleteScreen.tsx` | Interstitial with party HP and CONTINUAR button | VERIFIED | File exists; `CONTINUAR` button present; party HP map render |
| `src/components/BattleScene.tsx` | Parameterized with party/enemies/encounterIndex/onVictory; background variants; shake/skill effects | VERIFIED | `BattleSceneProps` with all required fields; `onVictory(stateRef.current.party)` in VICTORY effect; `shakeVariant` state toggle; `skillEffect` state for SKILL_SHIELD/SKILL_HEAL |
| `src/app/page.tsx` | Renders GameController | VERIFIED | `import { GameController }` and `<GameController />` present |
| `src/components/CharacterHUD.tsx` | Status badge row below EN bar | VERIFIED | `statusRow` and `statusBadge` CSS classes; `STATUS_ICON_MAP` definition and usage; conditional render when `statusEffects.length > 0` |
| `src/components/TurnOrderIndicator.tsx` | Upcoming turn queue display | VERIFIED | File exists; `upcoming = turnQueue.slice(currentTurnIndex + 1)`; returns null when empty |
| `src/components/DialogueBox.tsx` | Line-by-line overlay with click/Space advance | VERIFIED | File exists; `onComplete` called at last line; keyboard cleanup on unmount |
| `src/components/ActionMenu.tsx` | SkillSelectStep two-step flow for TRINETRA | VERIFIED | `SkillSelectStep` type defined; `pick_target` and `pick_effect` steps; `onSkillWithTarget` prop wired; phase-change reset |
| `src/styles/battle.module.css` | shakeA/shakeB; skillShieldEffect/skillHealEffect; statusBadge; bg_loading_dock/bg_server_room | VERIFIED | All 4 CSS animation classes present; `statusBadge` with DEF_BUFF data-type variant; 2 background gradient classes; all overlays have `pointer-events: none` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `reducer.ts SKILL/TORC` | `ACTION_RESOLVED statusApplied` | `statusApplied` array in ResolvedAction | WIRED | `statusApplied` in TORC branch → processed in ACTION_RESOLVED loop |
| `reducer.ts ACTION_RESOLVED` | `decrementStatuses` | end-of-round branch only | WIRED | `decrementStatuses` called only in `nextIndex >= state.turnQueue.length` branch |
| `enemyAI.ts TARGET_LOWEST_HP` | `calculateDamage` | `damageMultiplier: target.isDefending ? 0.5 : 1.0` | WIRED | Pattern confirmed at line 29 of enemyAI.ts |
| `BattleScene.tsx RESOLVING effect` | `battle.module.css .shakeA/.shakeB` | `setShakeVariant` toggle | WIRED | `setShakeVariant(v => v === 'a' ? 'b' : 'a')` when `abs(amount) >= floor(maxHp * 0.2)` |
| `BattleScene.tsx` | `GameController.tsx` | `onVictory(stateRef.current.party)` | WIRED | VICTORY useEffect calls `onVictory(stateRef.current.party)` — stale closure guard confirmed |
| `GameController.tsx` | `encounters.ts` | `ENCOUNTER_CONFIGS[encounterIndex]` | WIRED | `ENCOUNTER_CONFIGS` imported and indexed by `encounterIndex` state |
| `ActionMenu.tsx TRINETRA click` | `reducer.ts SKILL/TRINETRA` | `dispatch PLAYER_ACTION skillVariant` | WIRED | `onSkillWithTarget` in BattleScene dispatches with `skillVariant` to reducer |
| `GameController.tsx` | `DialogueBox.tsx` | `ENCOUNTER_2_DIALOGUE / ENCOUNTER_3_DIALOGUE` | WIRED | ControllerPhase routes to DialogueBox for both dialogue phases |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `CharacterHUD.tsx` statusBadge | `character.statusEffects` | reducer `ACTION_RESOLVED` statusApplied processing | Yes — engine applies statusApplied from TORC SKILL; decrement via decrementStatuses | FLOWING |
| `TurnOrderIndicator.tsx` | `turnQueue`, `currentTurnIndex` | `state.turnQueue` from reducer `buildTurnQueue` | Yes — built from live party/enemies on each round | FLOWING |
| `GameController.tsx` carryParty | `finalParty` from `BattleScene.onVictory` | `stateRef.current.party` (live reducer state) | Yes — real HP values from reducer; EN reset applied | FLOWING |
| `EncounterCompleteScreen.tsx` party prop | `completedParty` from `handleVictory` | `finalParty` from BattleScene onVictory | Yes — actual party state with real HP values | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite green | `npx vitest run` | 124 passed, 4 todo, 0 failed | PASS |
| TypeScript compiles clean | `npx tsc --noEmit` | 0 errors (no output) | PASS |
| TARGET_LOWEST_HP test coverage | `grep -c "TARGET_LOWEST_HP" enemyAI.test.ts` | 4+ test cases present | PASS |
| ATTACK_RANDOM test coverage | `grep -c "ATTACK_RANDOM" enemyAI.test.ts` | 4+ test cases present | PASS |
| WR-01/02/04 regression tests | `grep -c "WR-01\|WR-02\|WR-04" reducer.test.ts` | All 3 regression test groups present | PASS |
| No throws in enemyAI.ts | `grep "throw" enemyAI.ts` | 0 matches | PASS |
| DialogueBox tests | `npx vitest run DialogueBox.test.tsx` | 4 tests pass (render, advance, onComplete, empty) | PASS |
| TurnOrderIndicator tests | `npx vitest run TurnOrderIndicator.test.tsx` | 2 tests pass | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SKILL-02 | 03-02 | Forge Wall (TORC, 6 EN) DEF_BUFF +8 for 2 turns to all party | SATISFIED | `reducer.ts` TORC branch; 60 reducer tests include Forge Wall tests; DEF_BUFF status applied confirmed |
| SKILL-03 | 03-02, 03-06 | System Override (TRINETRA, 10 EN) heal 30 HP or remove status; target selection | SATISFIED | `reducer.ts` TRINETRA branch with HEAL/REMOVE_STATUS variants; `ActionMenu.tsx` SkillSelectStep picker |
| SKILL-05 | 03-02 | Status effects decrement end-of-round, expire at 0 | SATISFIED | `decrementStatuses` in end-of-round branch only; SKILL-05 tests in reducer.test.ts confirm mid-round non-decrement |
| AI-03 | 03-03 | TARGET_LOWEST_HP — attacks alive ally with lowest HP | SATISFIED | `sort((a, b) => a.hp - b.hp)[0]` implementation; 4 TDD tests confirm behavior |
| AI-04 | 03-03 | ATTACK_RANDOM — random alive target | SATISFIED | `Math.random()` index selection; 4 TDD tests confirm behavior |
| ENC-02 | 03-01, 03-04 | Encounter 2 — DEADZONE + TORC vs 2 Networker Enforcers | SATISFIED | `ENCOUNTER_CONFIGS[1]`: party [DEADZONE, TORC], enemies [NETWORKER_ENFORCER_A, NETWORKER_ENFORCER_B] |
| ENC-03 | 03-01, 03-04 | Encounter 3 — Trio vs 3 Casting Patrol Bots | SATISFIED | `ENCOUNTER_CONFIGS[2]`: party [DEADZONE, TORC, TRINETRA], enemies [CASTING_PATROL_BOT_A/B/C] |
| ENC-05 | 03-04 | HP persists between encounters; EN resets to max | SATISFIED | `GameController.tsx` `handleVictory`: `en: c.maxEn`, HP unchanged in `nextParty` mapping |
| ENC-06 | 03-04 | EncounterCompleteScreen between encounters | SATISFIED | `EncounterCompleteScreen.tsx` with party HP display and `CONTINUAR` button; rendered by GameController |
| UI-06 | 03-06 | DialogueBox cinematic component | SATISFIED | `DialogueBox.tsx` with line-by-line rendering, click/Space advance, onComplete callback; 4 component tests pass |
| UI-08 | 03-05 | TurnOrderIndicator — upcoming turns by SPD | SATISFIED | `TurnOrderIndicator.tsx` slices `turnQueue` from `currentTurnIndex+1`; wired in BattleScene; 2 component tests pass |
| VISUAL-04 | 03-07 | Camera shake on heavy hits (shakeA/shakeB toggle, no remount) | SATISFIED (code) / human_needed | `shakeVariant` toggle when `abs(amount) >= floor(maxHp * 0.2)`; `.shakeA/.shakeB` in CSS using transform only |
| VISUAL-05 | 03-07 | CSS particle effects for Forge Wall (shield pulse) and System Override (heal ripple) | SATISFIED (code) / human_needed | `.skillShieldEffect` (shieldPulse) and `.skillHealEffect` (healRipple) in battle.module.css; overlays conditionally rendered in BattleScene |
| ASSETS-01 (TORC+TRINETRA) | 03-01 | TORC and TRINETRA character data and exports | SATISFIED | `characters.ts`: both exported with correct stats |
| ASSETS-02 (Networker+Patrol) | 03-01 | Networker Enforcer A/B and Patrol Bot A/B/C data | SATISFIED | `enemies.ts`: all 5 instances exported with correct behavior types |
| ASSETS-03 (loading_dock+server_room) | 03-04 | Background variants for E2 and E3 | SATISFIED | `battle.module.css`: `.bg_loading_dock` (amber/rust) and `.bg_server_room` (green/teal); BattleScene applies via `encounterIndex` |
| ASSETS-06 (icons) | 03-05 | Status effect icons/badges in CharacterHUD | SATISFIED | `STATUS_ICON_MAP`: DEF_BUFF=SHIELD, OVERDRIVE_CHARGE=TERMINUS, DEFENDING=GUARD; CSS `statusBadge` with data-type variants |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `src/engine/enemyAI.ts` | `OVERDRIVE_BOSS` still uses `stubAction` | Info | Phase 4 scope; does not affect any Phase 3 encounter (AEGIS-7 not in E1-E3) |
| `src/components/BattleScene.tsx` | `handleSkill` has TORC/DEADZONE branches but TRINETRA no-op comment removed (now handled via `onSkillWithTarget` in ActionMenu) | Info | Not a stub — TRINETRA skill is fully wired via ActionMenu SkillSelectStep |

No blockers or warnings found. The OVERDRIVE_BOSS stub is documented and intentionally scoped to Phase 4.

### Human Verification Required

#### 1. E1 -> DialogueBox -> E2 Full Playthrough

**Test:** Run `npm run dev`, open http://localhost:3000. Defeat Casting Probe MK-I in E1.
**Expected:** DialogueBox appears with "TORC: Você sobreviveu ao corredor" as first line. Advance 3 times. E2 starts with DEADZONE+TORC in party HUD vs 2 Networker Enforcers. DEADZONE HP matches what it was at end of E1. TORC EN is at max (20).
**Why human:** React component rendering, HP carry visual fidelity, and party HUD composition cannot be verified without a running browser.

#### 2. Forge Wall SHIELD Badge Countdown

**Test:** In E2, wait for TORC's turn. Click HABILIDADE.
**Expected:** Both party members show "SHIELD 2T" badge below their EN bar in cyan. After one complete round (all combatants act), badge reads "SHIELD 1T". After a second complete round, badge disappears entirely.
**Why human:** Status badge render, CSS styling, and decrement timing (end-of-round precision) require live game observation.

#### 3. Camera Shake on Heavy Hit (VISUAL-04)

**Test:** In any encounter, take a hit where the damage is >= 20% of the target's maxHp (e.g., >= 19 damage on DEADZONE who has maxHp=95).
**Expected:** The battle container visually shakes (short translate animation, ~300ms) without any layout thrash or component remount. Should be subtle but perceptible.
**Why human:** CSS animation quality and visual perception require human evaluation. The code wiring (class toggle + threshold gate) is verified; animation fidelity is not.

#### 4. SKILL_SHIELD and SKILL_HEAL CSS Effects (VISUAL-05)

**Test:** In E2, cast Forge Wall (TORC HABILIDADE). In E3, cast System Override (TRINETRA HABILIDADE -> pick target -> CURAR).
**Expected:** Forge Wall: cyan glow/pulse visible on the party zone area (~600ms). System Override: cyan ripple expands on the HUD area (~500ms). Neither animation blocks user input.
**Why human:** CSS keyframe animation quality cannot be verified headlessly. Pointer-events: none is code-confirmed, but visual fidelity needs human judgment.

#### 5. TRINETRA Two-Step Skill Picker

**Test:** In E3, wait for TRINETRA's turn. Click HABILIDADE.
**Expected:** Target picker appears showing all alive party members with their HP. Click DEADZONE. CURAR and LIMPAR STATUS buttons appear. Click CURAR. TRINETRA EN decreases by 10; DEADZONE HP increases (capped at 30, capped at maxHp). System Override dispatched correctly.
**Why human:** Multi-step UI flow with conditional renders requires live browser interaction to confirm.

#### 6. TurnOrderIndicator Visual Rendering

**Test:** Observe the TurnOrderIndicator above the enemy zone during any encounter.
**Expected:** "NEXT:" label followed by upcoming combatant names in order: player names in cyan, enemy names in red, separated by › chevrons. SPD ordering matches: DEADZONE (SPD:18) > TRINETRA (SPD:15) > TORC (SPD:12) > Patrol Bots (SPD:9).
**Why human:** SPD ordering visual and color coding require browser inspection.

#### 7. Game Over Retry Behavior

**Test:** Allow all party members to be defeated (or use browser devtools to force HP to 0).
**Expected:** Game Over screen appears. Clicking TENTAR NOVAMENTE restarts the current encounter (not E1). If defeated in E2, E2 restarts with the carry-over party from E1.
**Why human:** State machine transitions and retry behavior require live interaction.

### Gaps Summary

No gaps found. All 14 must-have artifacts exist, are substantive, and are wired correctly. The 7 human verification items are standard browser-interaction tests for animations, visual feedback, and multi-step UI flows — they cannot be confirmed headlessly but the underlying code is correct.

The phase is blocked on human UAT (03-HUMAN-UAT.md checklist) which was auto-approved in autonomous mode and deferred to human review. The 19-step checklist in `03-HUMAN-UAT.md` covers all 7 human verification items above.

---

_Verified: 2026-04-26T16:46:56Z_
_Verifier: Claude (gsd-verifier)_
