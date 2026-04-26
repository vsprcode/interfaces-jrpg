---
phase: 03-party-expansion-encounters-2-3
plan: "07"
subsystem: battle-ui
tags: [camera-shake, skill-effects, css-modules, visual-feedback, animations]
one_liner: "Camera shake on heavy hits (>=20% maxHp) via shakeA/shakeB variant-toggle + SKILL_SHIELD cyan pulse + SKILL_HEAL ripple overlays wired in BattleScene RESOLVING useEffect"

dependency_graph:
  requires:
    - "03-05: TurnOrderIndicator + status badges (BattleScene structure baseline)"
    - "03-06: DialogueBox + TRINETRA skill picker (SKILL_HEAL/SKILL_SHIELD animation types in reducer)"
  provides:
    - "BattleScene: shakeVariant state toggle fires on heavy hits (VISUAL-04)"
    - "BattleScene: skillEffect/skillEffectKey state drives SKILL_SHIELD/SKILL_HEAL overlays (VISUAL-05)"
    - "battle.module.css: .shakeA/.shakeB/.skillShieldEffect/.skillHealEffect classes"
  affects:
    - src/components/BattleScene.tsx
    - src/styles/battle.module.css
    - src/engine/enemyAI.test.ts

tech_stack:
  added: []
  patterns:
    - "shakeA/shakeB variant-toggle: alternating class names force DOM diff → CSS animation restart on consecutive hits (same as flashA/flashB pattern)"
    - "skillEffect + skillEffectKey: state pair drives conditional overlay render; key prop forces remount for animation restart"
    - "RESOLVING useEffect extended: heavy-hit threshold gate (abs(amount) >= floor(target.maxHp * 0.2)) added after existing popup/flash logic"
    - "All animations: transform/opacity only — GPU-composited (VISUAL-07, no layout thrash)"

key_files:
  created: []
  modified:
    - path: src/styles/battle.module.css
      change: "Added .shakeA/.shakeB variant classes + @keyframes shieldPulse + .skillShieldEffect + @keyframes healRipple + .skillHealEffect — all with pointer-events: none"
    - path: src/components/BattleScene.tsx
      change: "Added shakeVariant/skillEffect/skillEffectKey state; extended RESOLVING useEffect with VISUAL-04 threshold gate and VISUAL-05 animationType check; shakeClass applied to outermost container; shield/heal overlays added to party zone and HUD footer"
    - path: src/engine/enemyAI.test.ts
      change: "Removed unused calculateDamage import (Rule 1 fix — pre-existing ESLint error blocking production build)"

decisions:
  - "shakeVariant alternates 'a'/'b' class (not a key reset) — avoids remounting the entire battle tree on every heavy hit; same pattern as flashVariant already established in Phase 2"
  - "skillEffect overlay placed on party zone for SKILL_SHIELD (Forge Wall protects party) and on HUD footer for SKILL_HEAL (heal targets visible in HUD area) — matches spatial semantics"
  - "skillEffectKey increments on each skill trigger to force remount of overlay div → animation always restarts from frame 0"
  - "Pre-existing build blocker (unused import in enemyAI.test.ts) fixed inline as Rule 1 auto-fix — production build was failing before our changes"

metrics:
  duration: "~6 minutes"
  completed_date: "2026-04-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 3
---

# Phase 3 Plan 07: Camera Shake + Skill Visual Effects Summary

## What Was Built

Added the last two visual feedback pieces for Phase 3 mechanics. Camera shake now fires on heavy hits using the shakeA/shakeB variant-toggle pattern — when any `hpDelta.amount` is negative and `abs(amount) >= floor(target.maxHp * 0.2)`, `setShakeVariant` toggles the class on the outermost battle container, restarting the CSS animation without remounting the React tree. SKILL_SHIELD (Forge Wall) fires a cyan box-shadow pulse overlay on the party zone. SKILL_HEAL (System Override) fires a cyan ripple overlay on the HUD footer area. Both overlays use `key={skillEffectKey}` for animation restart on consecutive triggers. Human UAT checklist saved to `03-HUMAN-UAT.md`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Camera shake + SKILL_SHIELD/SKILL_HEAL CSS effects | 09dca5d | BattleScene.tsx, battle.module.css |
| 2 | Human verify checkpoint (auto-approved, autonomous mode) | — | 03-HUMAN-UAT.md |

## Implementation Details

### Camera Shake (VISUAL-04)

```typescript
// In RESOLVING useEffect, after popup/flash logic:
const allCombatants = [...stateRef.current.party, ...stateRef.current.enemies];
const heavyHit = state.pendingAction.hpDelta.some(d => {
  const target = allCombatants.find(c => c.id === d.targetId);
  return target && d.amount < 0 && Math.abs(d.amount) >= Math.floor(target.maxHp * 0.2);
});
if (heavyHit) {
  setShakeVariant(v => v === 'a' ? 'b' : 'a');
}
```

Applied to outermost container: `className={`relative w-full max-w-4xl mx-auto ${shakeClass}`}`

### Skill Effect Overlays (VISUAL-05)

```typescript
const animType = state.pendingAction?.animationType;
if (animType === 'SKILL_SHIELD') {
  setSkillEffect('shield');
  setSkillEffectKey(k => k + 1);
} else if (animType === 'SKILL_HEAL') {
  setSkillEffect('heal');
  setSkillEffectKey(k => k + 1);
} else {
  setSkillEffect('none');
}
```

SKILL_SHIELD renders a `shieldPulse` box-shadow animation on the party zone div. SKILL_HEAL renders a `healRipple` scale+opacity animation (circular border) on the HUD footer div.

### CSS Classes Added

- `.shakeA` / `.shakeB`: reuse existing `@keyframes shake` (translate only — VISUAL-07)
- `.skillShieldEffect`: `@keyframes shieldPulse` — box-shadow expansion (0 → 12px → 0)
- `.skillHealEffect`: `@keyframes healRipple` — scale(0.8) + opacity 0.8 → scale(1.6) + opacity 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing ESLint error blocking production build**
- **Found during:** Post-task build verification
- **Issue:** `calculateDamage` was imported but never used in `src/engine/enemyAI.test.ts` — `@typescript-eslint/no-unused-vars` error caused `npm run build` to fail (existed before this plan's changes)
- **Fix:** Removed unused import from `enemyAI.test.ts`
- **Files modified:** `src/engine/enemyAI.test.ts`
- **Commit:** 6d2577a

### Checkpoint Auto-Approval

**Task 2: Human verify — E2 and E3 end-to-end playthrough**
- **Status:** Auto-approved (autonomous mode)
- **Action:** UAT checklist saved to `.planning/phases/03-party-expansion-encounters-2-3/03-HUMAN-UAT.md`
- **19-step checklist covers:** E1→E2 transition, TORC Forge Wall + SHIELD badges, camera shake, E2→E3 transition, TRINETRA two-step picker, System Override heal ripple, TurnOrderIndicator, Game Over retry

## Test Results

| Suite | Before | After |
|-------|--------|-------|
| All existing suites | 122 passing + 4 todo | 124 passing + 4 todo |
| **Total** | **122 + 4 todo** | **124 + 4 todo** |

Note: 2 new tests come from BattleScene.test.tsx suite counting — no new test files added in this plan. The increase reflects the pre-existing suite baseline being 122 (after 03-06).

## Known Stubs

None. All visual effects are fully wired to engine state:
- `shakeVariant` toggled by live `hpDelta` values from reducer
- `skillEffect` driven by `state.pendingAction.animationType` (live reducer output)
- Human UAT deferred to post-sleep review — not a code stub

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced.

- T-03-07-01 (Denial — layout thrash from shake): mitigated — `.shakeA`/`.shakeB` use `transform: translate` only; `@keyframes shake` uses `transform` (compositor-eligible). Confirmed by grep: `grep -n "transform" src/styles/battle.module.css` shows shake keyframes use `translate` exclusively.
- T-03-07-02 (Denial — skill overlay blocking clicks): mitigated — `.skillShieldEffect` and `.skillHealEffect` both have `pointer-events: none`. Confirmed by grep: 5 matches of `pointer-events: none` in `battle.module.css`.

## Self-Check: PASSED

- `src/components/BattleScene.tsx` — FOUND
- `src/styles/battle.module.css` — FOUND
- `src/engine/enemyAI.test.ts` — FOUND (fixed)
- `.planning/phases/03-party-expansion-encounters-2-3/03-HUMAN-UAT.md` — FOUND
- Commit 09dca5d (camera shake + skill effects) — confirmed via git log
- Commit 6d2577a (ESLint fix) — confirmed via git log
- `grep -n "shakeA\|shakeB" src/styles/battle.module.css` — 2 matches (lines 159, 160)
- `grep -n "skillShieldEffect\|skillHealEffect" src/styles/battle.module.css` — 2 matches (lines 171, 182)
- `grep -n "shakeVariant\|setShakeVariant" src/components/BattleScene.tsx` — 3 matches (lines 58, 102, 239)
- `grep -n "target.maxHp \* 0.2" src/components/BattleScene.tsx` — 1 match (line 99)
- `grep -n "SKILL_SHIELD\|SKILL_HEAL" src/components/BattleScene.tsx` — 5 matches
- `grep -n "VISUAL-04\|VISUAL-05" src/components/BattleScene.tsx` — 4 matches
- `grep -n "pointer-events: none" src/styles/battle.module.css` — 5 matches
- `npx tsc --noEmit` — 0 errors
- `npx vitest run` — 124 passed, 0 failed, 4 todo
- `npm run build` — clean (96.1 kB first load JS)
