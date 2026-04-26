import { describe, it, expect } from 'vitest';
import { AI_BEHAVIORS, resolveEnemyAction } from './enemyAI';
import { initialBattleState } from './reducer';
import type { Enemy, Character, BattleState, EnemyBehaviorType } from './types';

const probe: Enemy = {
  kind: 'enemy', id: 'CASTING_PROBE_MK1', name: 'Probe',
  hp: 40, maxHp: 40, en: 0, maxEn: 0, atk: 14, def: 6, spd: 10,
  statusEffects: [], isDefeated: false, behavior: 'ALWAYS_ATTACK',
};
const dz: Character = {
  kind: 'player', id: 'DEADZONE', name: 'DEADZONE',
  hp: 95, maxHp: 95, en: 25, maxEn: 25, atk: 22, def: 10, spd: 18,
  statusEffects: [], isDefeated: false, isDefending: false,
};

describe('AI_BEHAVIORS map (AI-01)', () => {
  it('has an entry for every EnemyBehaviorType', () => {
    const requiredKeys: EnemyBehaviorType[] = [
      'ALWAYS_ATTACK', 'TARGET_LOWEST_HP', 'ATTACK_RANDOM', 'OVERDRIVE_BOSS',
    ];
    for (const k of requiredKeys) {
      expect(typeof AI_BEHAVIORS[k]).toBe('function');
    }
  });

  it('every AI function returns a ResolvedAction shape', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    for (const fn of Object.values(AI_BEHAVIORS)) {
      const action = fn(probe, state);
      expect(action).toHaveProperty('actorId');
      expect(action).toHaveProperty('description');
      expect(action).toHaveProperty('animationType');
    }
  });

  it('AI returns no-op action when no valid targets (WR-03: defensive guard, no throw)', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [probe],
    };
    expect(() => resolveEnemyAction(probe, state)).not.toThrow();
    const result = resolveEnemyAction(probe, state);
    expect(result.description).toBe('(no targets)');
  });

  it('does NOT mutate state', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    const snap = JSON.stringify(state);
    resolveEnemyAction(probe, state);
    expect(JSON.stringify(state)).toBe(snap);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// WR-03: AI stubs must NOT throw when no valid targets exist
// ─────────────────────────────────────────────────────────────────────────

describe('WR-03: AI stubs return no-op action instead of throwing when no valid targets', () => {
  it('TARGET_LOWEST_HP: returns no-op action when no valid targets (does not throw)', () => {
    const enforcerA: Enemy = {
      kind: 'enemy', id: 'NETWORKER_ENFORCER_A', name: 'Networker Enforcer',
      hp: 55, maxHp: 55, en: 0, maxEn: 0, atk: 16, def: 8, spd: 11,
      statusEffects: [], isDefeated: false, behavior: 'TARGET_LOWEST_HP',
    };
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [enforcerA],
    };
    expect(() => AI_BEHAVIORS['TARGET_LOWEST_HP'](enforcerA, state)).not.toThrow();
    const result = AI_BEHAVIORS['TARGET_LOWEST_HP'](enforcerA, state);
    expect(result.description).toBe('(no targets)');
  });

  it('ATTACK_RANDOM: returns no-op action when no valid targets (does not throw)', () => {
    const patrolBot: Enemy = {
      kind: 'enemy', id: 'CASTING_PATROL_BOT_A', name: 'Casting Patrol Bot',
      hp: 45, maxHp: 45, en: 0, maxEn: 0, atk: 13, def: 7, spd: 9,
      statusEffects: [], isDefeated: false, behavior: 'ATTACK_RANDOM',
    };
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [patrolBot],
    };
    expect(() => AI_BEHAVIORS['ATTACK_RANDOM'](patrolBot, state)).not.toThrow();
    const result = AI_BEHAVIORS['ATTACK_RANDOM'](patrolBot, state);
    expect(result.description).toBe('(no targets)');
  });
});

describe('ALWAYS_ATTACK real implementation (AI-02)', () => {
  it('selects first alive party member as target', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    const result = AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state);
    expect(result.hpDelta).toBeDefined();
    expect(result.hpDelta).toHaveLength(1);
    expect(result.hpDelta![0]!.targetId).toBe('DEADZONE');
  });

  it('applies correct damage formula (PROBE ATK:14 - DEADZONE DEF:10 = 4 dmg)', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    const result = AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state);
    expect(result.hpDelta![0]!.amount).toBe(-4);
  });

  it('applies 0.5 damageMultiplier when target.isDefending (floor(4*0.5)=2, max(1,2)=2)', () => {
    const dzDefending = { ...dz, isDefending: true };
    const state: BattleState = { ...initialBattleState, party: [dzDefending], enemies: [probe] };
    const result = AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state);
    expect(result.hpDelta![0]!.amount).toBe(-2);
  });

  it('returns lore-flavored description string containing "Casting Probe MK-I"', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    const result = AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state);
    expect(result.description).toContain('Casting Probe MK-I');
  });

  it('uses defending-specific lore text when target.isDefending', () => {
    const dzDefending = { ...dz, isDefending: true };
    const state: BattleState = { ...initialBattleState, party: [dzDefending], enemies: [probe] };
    const result = AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state);
    expect(result.description).toContain('absorve o impacto');
  });

  it('returns animationType ATTACK', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    const result = AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state);
    expect(result.animationType).toBe('ATTACK');
  });

  it('returns no-op when no valid targets exist — WR-03: no throw (all party defeated)', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [probe],
    };
    expect(() => AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state)).not.toThrow();
    const result = AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state);
    expect(result.description).toBe('(no targets)');
  });

  it('skips defeated party members and targets first alive one', () => {
    const dz2: Character = {
      kind: 'player', id: 'TORC', name: 'TORC',
      hp: 130, maxHp: 130, en: 20, maxEn: 20, atk: 18, def: 20, spd: 12,
      statusEffects: [], isDefeated: false, isDefending: false,
    };
    const dzDefeated = { ...dz, isDefeated: true };
    // Party: [DEADZONE(defeated), TORC(alive)] — should target TORC
    const state: BattleState = {
      ...initialBattleState,
      party: [dzDefeated, dz2],
      enemies: [probe],
    };
    const result = AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state);
    expect(result.hpDelta![0]!.targetId).toBe('TORC');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// TARGET_LOWEST_HP real implementation (AI-03)
// ─────────────────────────────────────────────────────────────────────────

describe('TARGET_LOWEST_HP real implementation (AI-03)', () => {
  const enforcerA: Enemy = {
    kind: 'enemy', id: 'NETWORKER_ENFORCER_A', name: 'Networker Enforcer',
    hp: 55, maxHp: 55, en: 0, maxEn: 0, atk: 16, def: 8, spd: 11,
    statusEffects: [], isDefeated: false, behavior: 'TARGET_LOWEST_HP',
  };
  const dzLowHp: Character = {
    kind: 'player', id: 'DEADZONE', name: 'DEADZONE',
    hp: 30, maxHp: 95, en: 25, maxEn: 25, atk: 22, def: 10, spd: 18,
    statusEffects: [], isDefeated: false, isDefending: false,
  };
  const torc: Character = {
    kind: 'player', id: 'TORC', name: 'TORC',
    hp: 80, maxHp: 130, en: 20, maxEn: 20, atk: 18, def: 20, spd: 12,
    statusEffects: [], isDefeated: false, isDefending: false,
  };

  it('TARGET_LOWEST_HP: selects party member with lowest HP', () => {
    // DEADZONE(hp:30) < TORC(hp:80) — should target DEADZONE
    const state: BattleState = {
      ...initialBattleState,
      party: [dzLowHp, torc],
      enemies: [enforcerA],
    };
    const result = AI_BEHAVIORS['TARGET_LOWEST_HP'](enforcerA, state);
    expect(result.hpDelta).toBeDefined();
    expect(result.hpDelta).toHaveLength(1);
    expect(result.hpDelta![0]!.targetId).toBe('DEADZONE');
  });

  it('TARGET_LOWEST_HP: applies 0.5 damage multiplier when target is defending', () => {
    const dzDefending = { ...dzLowHp, isDefending: true };
    const dzNotDefending = { ...dzLowHp, isDefending: false };

    const stateDefending: BattleState = {
      ...initialBattleState,
      party: [dzDefending, torc],
      enemies: [enforcerA],
    };
    const stateNotDefending: BattleState = {
      ...initialBattleState,
      party: [dzNotDefending, torc],
      enemies: [enforcerA],
    };

    const defendingResult = AI_BEHAVIORS['TARGET_LOWEST_HP'](enforcerA, stateDefending);
    const attackResult = AI_BEHAVIORS['TARGET_LOWEST_HP'](enforcerA, stateNotDefending);

    // Attacking result must deal more damage than defending result
    expect(Math.abs(attackResult.hpDelta![0]!.amount)).toBeGreaterThan(
      Math.abs(defendingResult.hpDelta![0]!.amount)
    );
  });

  it('TARGET_LOWEST_HP: returns no-op when all party defeated', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dzLowHp, isDefeated: true }],
      enemies: [enforcerA],
    };
    expect(() => AI_BEHAVIORS['TARGET_LOWEST_HP'](enforcerA, state)).not.toThrow();
    const result = AI_BEHAVIORS['TARGET_LOWEST_HP'](enforcerA, state);
    expect(result.description).toBe('(no targets)');
  });

  it('TARGET_LOWEST_HP: includes battle-log description mentioning target name', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dzLowHp, torc],
      enemies: [enforcerA],
    };
    const result = AI_BEHAVIORS['TARGET_LOWEST_HP'](enforcerA, state);
    // DEADZONE is the lowest-HP target
    expect(result.description).toContain('DEADZONE');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// ATTACK_RANDOM real implementation (AI-04)
// ─────────────────────────────────────────────────────────────────────────

describe('ATTACK_RANDOM real implementation (AI-04)', () => {
  const patrolBot: Enemy = {
    kind: 'enemy', id: 'CASTING_PATROL_BOT_A', name: 'Casting Patrol Bot',
    hp: 45, maxHp: 45, en: 0, maxEn: 0, atk: 13, def: 7, spd: 9,
    statusEffects: [], isDefeated: false, behavior: 'ATTACK_RANDOM',
  };
  const dzFull: Character = {
    kind: 'player', id: 'DEADZONE', name: 'DEADZONE',
    hp: 95, maxHp: 95, en: 25, maxEn: 25, atk: 22, def: 10, spd: 18,
    statusEffects: [], isDefeated: false, isDefending: false,
  };
  const torc: Character = {
    kind: 'player', id: 'TORC', name: 'TORC',
    hp: 130, maxHp: 130, en: 20, maxEn: 20, atk: 18, def: 20, spd: 12,
    statusEffects: [], isDefeated: false, isDefending: false,
  };
  const trinetra: Character = {
    kind: 'player', id: 'TRINETRA', name: 'TRINETRA',
    hp: 85, maxHp: 85, en: 35, maxEn: 35, atk: 15, def: 12, spd: 15,
    statusEffects: [], isDefeated: false, isDefending: false,
  };

  it('ATTACK_RANDOM: returns a valid alive party member as target', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dzFull, torc, trinetra],
      enemies: [patrolBot],
    };
    const validIds = new Set(['DEADZONE', 'TORC', 'TRINETRA']);
    for (let i = 0; i < 10; i++) {
      const result = AI_BEHAVIORS['ATTACK_RANDOM'](patrolBot, state);
      expect(result.hpDelta).toBeDefined();
      expect(result.hpDelta).toHaveLength(1);
      expect(validIds.has(result.hpDelta![0]!.targetId as string)).toBe(true);
    }
  });

  it('ATTACK_RANDOM: never targets defeated party members', () => {
    const dzDefeated = { ...dzFull, isDefeated: true };
    const state: BattleState = {
      ...initialBattleState,
      party: [dzDefeated, torc, trinetra],
      enemies: [patrolBot],
    };
    for (let i = 0; i < 20; i++) {
      const result = AI_BEHAVIORS['ATTACK_RANDOM'](patrolBot, state);
      expect(result.hpDelta![0]!.targetId).not.toBe('DEADZONE');
    }
  });

  it('ATTACK_RANDOM: applies 0.5 damage multiplier when target is defending', () => {
    // Use DEADZONE (DEF:10) as the only alive target to remove randomness.
    // Patrol Bot ATK:13 vs DEADZONE DEF:10 → base dmg = 3
    // Not defending: max(1, floor(3 * 1.0)) = 3
    // Defending:     max(1, floor(3 * 0.5)) = max(1, 1) = 1
    // 3 > 1 — difference is observable.
    const dzDefending = { ...dzFull, isDefending: true };
    const dzNotDefending = { ...dzFull, isDefending: false };

    const stateDefending: BattleState = {
      ...initialBattleState,
      party: [dzDefending],
      enemies: [patrolBot],
    };
    const stateNotDefending: BattleState = {
      ...initialBattleState,
      party: [dzNotDefending],
      enemies: [patrolBot],
    };

    const defendingResult = AI_BEHAVIORS['ATTACK_RANDOM'](patrolBot, stateDefending);
    const attackResult = AI_BEHAVIORS['ATTACK_RANDOM'](patrolBot, stateNotDefending);

    // Non-defending should deal more damage than defending
    expect(Math.abs(attackResult.hpDelta![0]!.amount)).toBeGreaterThan(
      Math.abs(defendingResult.hpDelta![0]!.amount)
    );
  });

  it('ATTACK_RANDOM: returns no-op when all party defeated', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dzFull, isDefeated: true }],
      enemies: [patrolBot],
    };
    expect(() => AI_BEHAVIORS['ATTACK_RANDOM'](patrolBot, state)).not.toThrow();
    const result = AI_BEHAVIORS['ATTACK_RANDOM'](patrolBot, state);
    expect(result.description).toBe('(no targets)');
  });
});

// ─────────────────────────────────────────────────────────────────────────
// OVERDRIVE_BOSS AI implementation (Phase 4 Plan 04-02 — Tests A-F)
// ─────────────────────────────────────────────────────────────────────────

describe('OVERDRIVE_BOSS AI implementation (OVERDRIVE-01/04/06/08)', () => {
  // Shared AEGIS_7 fixture (imported from data — canonical stats)
  // We construct minimal state objects via object spread for each test.
  const aegis: Enemy = {
    kind: 'enemy', id: 'AEGIS_7', name: 'AEGIS-7',
    hp: 200, maxHp: 200, en: 0, maxEn: 0, atk: 28, def: 15, spd: 8,
    statusEffects: [], isDefeated: false, behavior: 'OVERDRIVE_BOSS',
    isOverdriveActive: false,
  };

  const aliveChar: Character = {
    kind: 'player', id: 'DEADZONE', name: 'DEADZONE',
    hp: 95, maxHp: 95, en: 25, maxEn: 25, atk: 22, def: 10, spd: 18,
    statusEffects: [], isDefeated: false, isDefending: false,
  };

  // Test A: hp<100, ENEMY_TURN, overdrivePending=false → OVERDRIVE_WARNING announcement (OVERDRIVE-01)
  it('Test A: AEGIS_7 hp=99 in ENEMY_TURN with overdrivePending=false → animationType OVERDRIVE_WARNING, no hpDelta', () => {
    const aegisLowHp = { ...aegis, hp: 99 };
    const state: BattleState = {
      ...initialBattleState,
      phase: 'ENEMY_TURN',
      party: [aliveChar],
      enemies: [aegisLowHp],
      overdrivePending: false,
    };
    const result = AI_BEHAVIORS['OVERDRIVE_BOSS'](aegisLowHp, state);
    expect(result.animationType).toBe('OVERDRIVE_WARNING');
    expect(result.hpDelta).toBeUndefined();
  });

  // Test B: hp<100, ENEMY_TURN, overdrivePending=true → normal ATTACK (no second warning) (OVERDRIVE-08)
  it('Test B: AEGIS_7 hp=99 in ENEMY_TURN with overdrivePending=true → animationType ATTACK with hpDelta (no second OVERDRIVE_WARNING)', () => {
    const aegisLowHp = { ...aegis, hp: 99 };
    const state: BattleState = {
      ...initialBattleState,
      phase: 'ENEMY_TURN',
      party: [aliveChar],
      enemies: [aegisLowHp],
      overdrivePending: true,
    };
    const result = AI_BEHAVIORS['OVERDRIVE_BOSS'](aegisLowHp, state);
    expect(result.animationType).toBe('ATTACK');
    expect(result.hpDelta).toBeDefined();
    expect(result.hpDelta!.length).toBeGreaterThan(0);
  });

  // Test C: OVERDRIVE_RESOLVING, alive non-defending target → OVERDRIVE_TERMINUS with -999 (OVERDRIVE-04)
  it('Test C: AEGIS_7 hp=99 in OVERDRIVE_RESOLVING, party=[alive non-defender] → animationType OVERDRIVE_TERMINUS, hpDelta includes -999', () => {
    const aegisLowHp = { ...aegis, hp: 99 };
    const nonDefender: Character = { ...aliveChar, isDefending: false };
    const state: BattleState = {
      ...initialBattleState,
      phase: 'OVERDRIVE_RESOLVING',
      party: [nonDefender],
      enemies: [aegisLowHp],
      overdrivePending: true,
    };
    const result = AI_BEHAVIORS['OVERDRIVE_BOSS'](aegisLowHp, state);
    expect(result.animationType).toBe('OVERDRIVE_TERMINUS');
    expect(result.hpDelta).toBeDefined();
    expect(result.hpDelta!.length).toBe(1);
    expect(result.hpDelta![0]!.amount).toBe(-999);
    expect(result.hpDelta![0]!.targetId).toBe('DEADZONE');
  });

  // Test D: OVERDRIVE_RESOLVING, one defending + one not → hpDelta only for non-defender (OVERDRIVE-04 + OVERDRIVE-06)
  it('Test D: AEGIS_7 in OVERDRIVE_RESOLVING, party=[{isDefending:true},{isDefending:false}] → hpDelta only includes the non-defending member', () => {
    const aegisLowHp = { ...aegis, hp: 99 };
    const defender: Character = {
      kind: 'player', id: 'TORC', name: 'TORC',
      hp: 130, maxHp: 130, en: 20, maxEn: 20, atk: 18, def: 20, spd: 12,
      statusEffects: [], isDefeated: false, isDefending: true,
    };
    const nonDefender: Character = { ...aliveChar, isDefending: false };
    const state: BattleState = {
      ...initialBattleState,
      phase: 'OVERDRIVE_RESOLVING',
      party: [defender, nonDefender],
      enemies: [aegisLowHp],
      overdrivePending: true,
    };
    const result = AI_BEHAVIORS['OVERDRIVE_BOSS'](aegisLowHp, state);
    expect(result.animationType).toBe('OVERDRIVE_TERMINUS');
    expect(result.hpDelta).toBeDefined();
    // Only DEADZONE (non-defender) should appear in hpDelta
    expect(result.hpDelta!.length).toBe(1);
    expect(result.hpDelta![0]!.targetId).toBe('DEADZONE');
    // TORC (defender) must NOT be in hpDelta
    const torcInDelta = result.hpDelta!.some(d => d.targetId === 'TORC');
    expect(torcInDelta).toBe(false);
  });

  // Test E: OVERDRIVE_RESOLVING, all defeated → terminusTargets empty, hpDelta [] (OVERDRIVE-06)
  it('Test E: AEGIS_7 in OVERDRIVE_RESOLVING, party=[{isDefeated:true}] → terminusTargets empty, hpDelta is empty array', () => {
    const aegisLowHp = { ...aegis, hp: 99 };
    const defeatedChar: Character = { ...aliveChar, isDefeated: true };
    const state: BattleState = {
      ...initialBattleState,
      phase: 'OVERDRIVE_RESOLVING',
      party: [defeatedChar],
      enemies: [aegisLowHp],
      overdrivePending: true,
    };
    const result = AI_BEHAVIORS['OVERDRIVE_BOSS'](aegisLowHp, state);
    expect(result.animationType).toBe('OVERDRIVE_TERMINUS');
    expect(result.hpDelta).toBeDefined();
    expect(result.hpDelta!.length).toBe(0);
  });

  // Test F: hp=150, ENEMY_TURN → normal ATTACK (above 100 HP threshold, no OVERDRIVE)
  it('Test F: AEGIS_7 hp=150 in ENEMY_TURN → animationType ATTACK (above 100 HP threshold)', () => {
    const aegisHighHp = { ...aegis, hp: 150 };
    const state: BattleState = {
      ...initialBattleState,
      phase: 'ENEMY_TURN',
      party: [aliveChar],
      enemies: [aegisHighHp],
      overdrivePending: false,
    };
    const result = AI_BEHAVIORS['OVERDRIVE_BOSS'](aegisHighHp, state);
    expect(result.animationType).toBe('ATTACK');
  });
});
