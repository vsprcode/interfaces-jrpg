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
