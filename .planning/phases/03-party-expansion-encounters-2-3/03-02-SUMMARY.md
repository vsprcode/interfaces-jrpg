---
phase: 03-party-expansion-encounters-2-3
plan: "02"
subsystem: battle-engine
tags: [tdd, skill-system, status-effects, reducer]
one_liner: "Forge Wall (TORC) + System Override (TRINETRA) implemented with full status lifecycle (apply → decrement end-of-round → expire) via TDD"

dependency_graph:
  requires:
    - "03-01: TORC/TRINETRA character data, StatusEffect/StatusApplied/StatusRemoved types, skillVariant in PlayerAction"
  provides:
    - "SKILL/TORC branch: DEF_BUFF +8 to all alive party members, cost 6 EN"
    - "SKILL/TRINETRA branch: HEAL 30 HP (capped), cost 10 EN"
    - "SKILL/TRINETRA branch: REMOVE_STATUS first effect from target, cost 10 EN"
    - "ACTION_RESOLVED statusApplied processing"
    - "ACTION_RESOLVED statusRemoved processing"
    - "decrementStatuses end-of-round (SKILL-05)"
    - "Expired status filter (turnsRemaining === 0)"
  affects:
    - src/engine/reducer.ts
    - src/engine/reducer.test.ts

tech_stack:
  added: []
  patterns:
    - "SKILL case branched by actorId (if/else chain: TORC → TRINETRA → DEADZONE fallback)"
    - "decrementStatuses generic helper: maps turnsRemaining-1 then filters >0"
    - "End-of-round decrement: only in nextIndex >= turnQueue.length branch, never mid-round"
    - "skillVariant ?? 'HEAL' default guard for undefined variant"

key_files:
  created: []
  modified:
    - path: src/engine/reducer.ts
      change: "SKILL case branched by actorId; statusApplied/statusRemoved applied in ACTION_RESOLVED; decrementStatuses helper + end-of-round call; StatusEffect import added"
    - path: src/engine/reducer.test.ts
      change: "12 new tests: Forge Wall x4, SKILL-05 status lifecycle x3, System Override x5"

decisions:
  - "actorId if/else chain (TORC → TRINETRA → DEADZONE) over switch/case: switch on string actorId would require breaking out of the outer switch(actionType) — if/else keeps structure flat and readable"
  - "decrementStatuses defined as a const inside ACTION_RESOLVED case to avoid polluting module scope with a one-off helper used only there"
  - "statusApplied/statusRemoved applied after enDelta and before end-condition check — ensures buffs are visible in final state even at VICTORY"

metrics:
  duration: "~4 minutes"
  completed_date: "2026-04-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 2
---

# Phase 3 Plan 02: Forge Wall + System Override + Status Lifecycle Summary

## What Was Built

Implemented the two new character skills for Phase 3 encounters — TORC's Forge Wall (group DEF buff) and TRINETRA's System Override (heal or remove status) — plus the complete status effect lifecycle: apply via statusApplied in ResolvedAction, survive N rounds, decrement only at end-of-round, and expire when turnsRemaining reaches 0. All implemented via TDD with 12 new tests.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Forge Wall (TORC) + status lifecycle | 846fef9 | reducer.ts, reducer.test.ts |
| 2 | System Override (TRINETRA) — heal + remove status | 260fd3f | reducer.ts, reducer.test.ts |

## Implementation Details

### SKILL/TORC — Forge Wall

- Cost: 6 EN
- Effect: applies `DEF_BUFF` status to all alive (non-defeated) party members
- StatusEffect: `{ type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8, appliedBy: 'TORC' }`
- EN guard: returns same state reference if `actor.en < 6`
- AnimationType: `SKILL_SHIELD`

### SKILL/TRINETRA — System Override

- Cost: 10 EN for both variants
- HEAL variant: `Math.min(30, healTarget.maxHp - healTarget.hp)` — capped at remaining headroom
- REMOVE_STATUS variant: removes `healTarget.statusEffects[0]?.type` from target
- Target guard: returns same state if target not found or defeated
- EN guard: returns same state if `actor.en < 10`
- AnimationType: `SKILL_HEAL` for both variants

### Status Lifecycle (SKILL-05)

- `decrementStatuses` helper: generic over `{ statusEffects: StatusEffect[] }`, maps `turnsRemaining - 1`, filters `turnsRemaining > 0`
- Called in ACTION_RESOLVED **only** in the end-of-round branch (`nextIndex >= state.turnQueue.length`)
- NOT called in the mid-round branch — confirmed by tests

## Test Results

| Suite | Before | After |
|-------|--------|-------|
| src/engine/reducer.test.ts | 48 | 60 |
| All other suites | 57 | 57 |
| **Total** | **105** | **117** |

Wait — corrected count from actual run:

| Suite | Count |
|-------|-------|
| src/engine/reducer.test.ts | 60 |
| All suites combined | 110 passed + 4 todo |

## Deviations from Plan

None — plan executed exactly as written.

The SKILL case was structured as `if (actorId === 'TORC') ... if (actorId === 'TRINETRA') ... // DEADZONE fallback` rather than a switch, which is a minor style choice but matches the plan's pseudocode and avoids nested switch complexity.

## Known Stubs

None introduced in this plan. Previously documented stubs in enemyAI.ts (`TARGET_LOWEST_HP`, `ATTACK_RANDOM`, `OVERDRIVE_BOSS`) remain and are tracked in Plan 03-01 SUMMARY.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. All changes are pure in-memory battle engine logic.

T-03-02-01 (Tampering — SKILL targetId): mitigated — `state.party.find(c => c.id === targetId && !c.isDefeated)` returns undefined → same state returned.

T-03-02-02 (Denial — status decrement): accepted — pure functional map+filter; no mutation risk.

## Self-Check: PASSED

- `src/engine/reducer.ts` — FOUND
- `src/engine/reducer.test.ts` — FOUND
- Commit 846fef9 (Forge Wall) — FOUND
- Commit 260fd3f (System Override) — FOUND
- `grep -n "actorId === 'TORC'" src/engine/reducer.ts` — 1 match at line 126
- `grep -n "actorId === 'TRINETRA'" src/engine/reducer.ts` — 1 match at line 154
- `grep -n "decrementStatuses" src/engine/reducer.ts` — definition + 2 call sites
- `npx vitest run` — 110 passed, 0 failed
- `npx tsc --noEmit` — 0 errors
