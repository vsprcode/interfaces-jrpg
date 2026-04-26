import { describe, it, expect } from 'vitest';
import { battleReducer, initialBattleState } from './reducer';
import type { BattleState, Character, Enemy } from './types';

const dz: Character = {
  kind: 'player', id: 'DEADZONE', name: 'DEADZONE',
  hp: 95, maxHp: 95, en: 25, maxEn: 25, atk: 22, def: 10, spd: 18,
  statusEffects: [], isDefeated: false, isDefending: false,
};

const probe: Enemy = {
  kind: 'enemy', id: 'CASTING_PROBE_MK1', name: 'Casting Probe MK-I',
  hp: 40, maxHp: 40, en: 0, maxEn: 0, atk: 14, def: 6, spd: 10,
  statusEffects: [], isDefeated: false, behavior: 'ALWAYS_ATTACK',
};

describe('battleReducer', () => {
  it('INIT transitions from INIT to PLAYER_INPUT and builds turn queue', () => {
    const next = battleReducer(initialBattleState, {
      type: 'INIT',
      payload: { party: [dz], enemies: [probe] },
    });
    expect(next.phase).toBe('PLAYER_INPUT');
    expect(next.turnQueue).toHaveLength(2);
    expect(next.turnQueue[0]?.combatantId).toBe('DEADZONE');
    expect(next.round).toBe(1);
  });

  // PHASE GUARD (ENGINE-05, QA-05, Pitfall 4)
  it('drops PLAYER_ACTION when phase is RESOLVING — returns SAME reference', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'RESOLVING',
    };
    const next = battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    });
    expect(next).toBe(state);
  });

  it('drops PLAYER_ACTION when phase is ENEMY_TURN', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'ENEMY_TURN',
    };
    const next = battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    });
    expect(next).toBe(state);
  });

  it('drops PLAYER_ACTION when phase is GAME_OVER', () => {
    const state: BattleState = { ...initialBattleState, phase: 'GAME_OVER' };
    expect(battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    })).toBe(state);
  });

  it('accepts PLAYER_ACTION when phase is PLAYER_INPUT (transitions to RESOLVING)', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
    };
    const next = battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    });
    expect(next.phase).toBe('RESOLVING');
    expect(next.pendingAction).not.toBeNull();
    expect(next).not.toBe(state);
  });

  // PURITY / NO MUTATION (ENGINE-06, QA-03)
  it('does NOT mutate prior state on accepted dispatch', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
    };
    const snapshot = JSON.stringify(state);
    battleReducer(state, {
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE' },
    });
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it('CHECK_END_CONDITIONS transitions to VICTORY when all enemies defeated', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz],
      enemies: [{ ...probe, isDefeated: true }],
      phase: 'RESOLVING',
    };
    expect(battleReducer(state, { type: 'CHECK_END_CONDITIONS' }).phase).toBe('VICTORY');
  });

  it('CHECK_END_CONDITIONS transitions to GAME_OVER when all party defeated', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [{ ...dz, isDefeated: true }],
      enemies: [probe],
      phase: 'RESOLVING',
    };
    expect(battleReducer(state, { type: 'CHECK_END_CONDITIONS' }).phase).toBe('GAME_OVER');
  });

  it('CHECK_END_CONDITIONS returns same state when both sides still alive', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz],
      enemies: [probe],
      phase: 'RESOLVING',
    };
    const next = battleReducer(state, { type: 'CHECK_END_CONDITIONS' });
    expect(next).toBe(state);
  });

  it('ENEMY_ACTION transitions from ENEMY_TURN to RESOLVING', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'ENEMY_TURN',
    };
    const next = battleReducer(state, { type: 'ENEMY_ACTION' });
    expect(next.phase).toBe('RESOLVING');
    expect(next).not.toBe(state);
  });

  it('ENEMY_ACTION is a no-op when phase is not ENEMY_TURN', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
    };
    expect(battleReducer(state, { type: 'ENEMY_ACTION' })).toBe(state);
  });

  it('NEXT_TURN advances currentTurnIndex within the same round', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe],
      phase: 'PLAYER_INPUT',
      turnQueue: [
        { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
        { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
      ],
      currentTurnIndex: 0,
      round: 1,
    };
    const next = battleReducer(state, { type: 'NEXT_TURN' });
    expect(next.currentTurnIndex).toBe(1);
    expect(next.round).toBe(1);
  });

  it('NEXT_TURN wraps to a new queue when the last turn is consumed', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe],
      phase: 'PLAYER_INPUT',
      turnQueue: [{ combatantId: 'DEADZONE', kind: 'player', spd: 18 }],
      currentTurnIndex: 0,
      round: 1,
    };
    const next = battleReducer(state, { type: 'NEXT_TURN' });
    expect(next.currentTurnIndex).toBe(0);
    expect(next.round).toBe(2);
    expect(next.turnQueue).toHaveLength(2); // rebuilt from party + enemies
  });

  it('ACTION_RESOLVED transitions from RESOLVING to PLAYER_INPUT and clears pendingAction', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'RESOLVING',
      pendingAction: { actorId: 'DEADZONE', description: 'test', animationType: 'ATTACK' },
    };
    const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
    expect(next.phase).toBe('PLAYER_INPUT');
    expect(next.pendingAction).toBeNull();
  });

  it('ACTION_RESOLVED is a no-op when phase is not RESOLVING', () => {
    const state: BattleState = {
      ...initialBattleState,
      phase: 'PLAYER_INPUT',
    };
    expect(battleReducer(state, { type: 'ACTION_RESOLVED' })).toBe(state);
  });
});
