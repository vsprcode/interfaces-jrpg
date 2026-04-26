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

  it('AI throws when no valid targets (defensive — Pitfall 9)', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [probe],
    };
    expect(() => resolveEnemyAction(probe, state)).toThrow();
  });

  it('does NOT mutate state', () => {
    const state: BattleState = { ...initialBattleState, party: [dz], enemies: [probe] };
    const snap = JSON.stringify(state);
    resolveEnemyAction(probe, state);
    expect(JSON.stringify(state)).toBe(snap);
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

  it('throws when no valid targets exist (all party defeated)', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [probe],
    };
    expect(() => AI_BEHAVIORS['ALWAYS_ATTACK'](probe, state)).toThrow();
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
