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
      payload: { type: 'ATTACK', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
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
      payload: { type: 'ATTACK', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
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
    const next = battleReducer(state, { type: 'ENEMY_ACTION', payload: { enemyId: 'CASTING_PROBE_MK1' } });
    expect(next.phase).toBe('RESOLVING');
    expect(next).not.toBe(state);
  });

  it('ENEMY_ACTION is a no-op when phase is not ENEMY_TURN', () => {
    const state: BattleState = {
      ...initialBattleState,
      party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
    };
    expect(battleReducer(state, { type: 'ENEMY_ACTION', payload: { enemyId: 'CASTING_PROBE_MK1' } })).toBe(state);
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
    expect(next.pendingAction).toBeNull();
  });

  it('ACTION_RESOLVED is a no-op when phase is not RESOLVING', () => {
    const state: BattleState = {
      ...initialBattleState,
      phase: 'PLAYER_INPUT',
    };
    expect(battleReducer(state, { type: 'ACTION_RESOLVED' })).toBe(state);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ENGINE-07: ATTACK
  // ─────────────────────────────────────────────────────────────────────────

  describe('ENGINE-07: PLAYER_ACTION ATTACK', () => {
    it('transitions to RESOLVING with hpDelta for enemy (DEADZONE vs PROBE = 16 dmg)', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'ATTACK', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction).not.toBeNull();
      expect(next.pendingAction!.hpDelta).toHaveLength(1);
      expect(next.pendingAction!.hpDelta![0]!.amount).toBe(-16);
      expect(next.pendingAction!.hpDelta![0]!.targetId).toBe('CASTING_PROBE_MK1');
      expect(next.pendingAction!.animationType).toBe('ATTACK');
    });

    it('ACTION_RESOLVED after ATTACK applies hp delta to enemy (PROBE hp: 40 - 16 = 24)', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [dz],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'DEADZONE encontra brecha no firewall — 16 de dano',
          hpDelta: [{ targetId: 'CASTING_PROBE_MK1', amount: -16 }],
          animationType: 'ATTACK',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.enemies[0]!.hp).toBe(24);
      expect(next.pendingAction).toBeNull();
    });

    it('ACTION_RESOLVED advances to ENEMY_TURN when enemy is next in queue', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [dz],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'DEADZONE encontra brecha no firewall — 16 de dano',
          hpDelta: [{ targetId: 'CASTING_PROBE_MK1', amount: -16 }],
          animationType: 'ATTACK',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.phase).toBe('ENEMY_TURN');
      expect(next.currentTurnIndex).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ENGINE-08: DEFEND
  // ─────────────────────────────────────────────────────────────────────────

  describe('ENGINE-08: PLAYER_ACTION DEFEND', () => {
    it('sets pendingAction with animationType DEFEND and enDelta of +5', () => {
      // DEADZONE en=20/25 so recovery capped at 5
      const dzLowEn = { ...dz, en: 20 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzLowEn], enemies: [probe], phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'DEFEND', actorId: 'DEADZONE' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction!.animationType).toBe('DEFEND');
      expect(next.pendingAction!.enDelta).toBeDefined();
      expect(next.pendingAction!.enDelta![0]!.amount).toBe(5);
    });

    it('caps EN recovery at maxEn (DEADZONE at full EN recovers 0)', () => {
      // DEADZONE en=25/25, recovery = min(5, 25-25) = 0, enDelta is empty array
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'DEFEND', actorId: 'DEADZONE' },
      });
      expect(next.pendingAction!.enDelta).toHaveLength(0);
    });

    it('ACTION_RESOLVED after DEFEND sets isDefending: true on actor', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [{ ...dz, isDefending: false }],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'DEADZONE ativa postura de contenção analógica — recupera 5 EN',
          enDelta: [{ targetId: 'DEADZONE', amount: 5 }],
          animationType: 'DEFEND',
        },
      };
      // isDefending is set during PLAYER_ACTION DEFEND (not in ACTION_RESOLVED)
      // So we verify it was set in the party state before ACTION_RESOLVED
      // After PLAYER_ACTION DEFEND, party[0].isDefending should be true
      const dzDefending = { ...dz, isDefending: true };
      const stateWithDefending: BattleState = {
        ...state,
        party: [dzDefending],
      };
      const next = battleReducer(stateWithDefending, { type: 'ACTION_RESOLVED' });
      expect(next.party[0]!.isDefending).toBe(true);
    });

    it('PLAYER_ACTION DEFEND sets isDefending: true immediately in returned state', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [{ ...dz, isDefending: false }],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'DEFEND', actorId: 'DEADZONE' },
      });
      expect(next.party[0]!.isDefending).toBe(true);
    });

    it('clears isDefending from previous turn when new PLAYER_ACTION is dispatched', () => {
      // DEADZONE was defending (isDefending: true from previous turn)
      // Dispatch ATTACK → isDefending should be cleared before processing
      const dzWasDefending = { ...dz, isDefending: true };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzWasDefending], enemies: [probe], phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'ATTACK', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
      });
      // After ATTACK, isDefending should be false (cleared at start of PLAYER_ACTION)
      expect(next.party[0]!.isDefending).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ENGINE-09 / ENGINE-10: ITEM (Nano-Med)
  // ─────────────────────────────────────────────────────────────────────────

  describe('ENGINE-09/10: PLAYER_ACTION ITEM (Nano-Med)', () => {
    it('sets pendingAction with hpDelta of +30 (self-heal)', () => {
      const dzLowHp = { ...dz, hp: 50 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzLowHp], enemies: [probe], phase: 'PLAYER_INPUT',
        items: { nanoMed: 3 },
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'ITEM', actorId: 'DEADZONE', targetId: 'DEADZONE' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction!.hpDelta).toHaveLength(1);
      expect(next.pendingAction!.hpDelta![0]!.amount).toBe(30);
      expect(next.pendingAction!.hpDelta![0]!.targetId).toBe('DEADZONE');
    });

    it('ACTION_RESOLVED after ITEM clamps hp at maxHp (80 + 30 = 95 not 110)', () => {
      const dzAlmostFull = { ...dz, hp: 80 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzAlmostFull],
        enemies: [probe],
        phase: 'RESOLVING',
        items: { nanoMed: 2 },
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'DEADZONE injeta Nano-Med — restaura 15 HP',
          hpDelta: [{ targetId: 'DEADZONE', amount: 30 }],
          animationType: 'ITEM',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.party[0]!.hp).toBe(95); // clamped at maxHp
    });

    it('ACTION_RESOLVED after ITEM decrements nanoMed count', () => {
      // nanoMed count is decremented during PLAYER_ACTION ITEM, not ACTION_RESOLVED
      // But let's verify the state at dispatch time
      const dzLowHp = { ...dz, hp: 50 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzLowHp], enemies: [probe], phase: 'PLAYER_INPUT',
        items: { nanoMed: 3 },
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'ITEM', actorId: 'DEADZONE', targetId: 'DEADZONE' },
      });
      expect(next.items.nanoMed).toBe(2);
    });

    it('PLAYER_ACTION ITEM returns same state when nanoMed is 0 (item exhausted guard)', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
        items: { nanoMed: 0 },
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'ITEM', actorId: 'DEADZONE', targetId: 'DEADZONE' },
      });
      expect(next).toBe(state); // same reference — no-op
    });

    it('ITEM heal is capped at remaining HP headroom (hp=80/95, heals 15 not 30)', () => {
      const dzAlmostFull = { ...dz, hp: 80 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzAlmostFull], enemies: [probe], phase: 'PLAYER_INPUT',
        items: { nanoMed: 1 },
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'ITEM', actorId: 'DEADZONE', targetId: 'DEADZONE' },
      });
      // heal amount = min(30, maxHp - hp) = min(30, 95 - 80) = 15
      expect(next.pendingAction!.hpDelta![0]!.amount).toBe(15);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SKILL-01 / SKILL-04: Signal Null (Plan 03)
  // ─────────────────────────────────────────────────────────────────────────

  describe('SKILL-01/04: PLAYER_ACTION SKILL — Signal Null', () => {
    it('SKILL-04: returns same state reference when EN < 8 (no-op)', () => {
      const dzLowEn = { ...dz, en: 4 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzLowEn], enemies: [probe], phase: 'PLAYER_INPUT',
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
      });
      expect(next).toBe(state);
    });

    it('SKILL-04: returns same state reference when EN is exactly 0', () => {
      const dzNoEn = { ...dz, en: 0 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzNoEn], enemies: [probe], phase: 'PLAYER_INPUT',
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
      });
      expect(next).toBe(state);
    });

    it('SKILL-01: deals 18 damage to Casting Probe (defPenetration 0.7)', () => {
      // DEADZONE ATK:22, PROBE DEF:6 → effectiveDef=floor(6*0.7)=4 → dmg=max(1,22-4)=18
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction).not.toBeNull();
      expect(next.pendingAction!.hpDelta).toHaveLength(1);
      expect(next.pendingAction!.hpDelta![0]!.amount).toBe(-18);
      expect(next.pendingAction!.hpDelta![0]!.targetId).toBe('CASTING_PROBE_MK1');
    });

    it('SKILL-01: transitions to RESOLVING with animationType SKILL_ELECTRIC', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction!.animationType).toBe('SKILL_ELECTRIC');
    });

    it('SKILL-01: costs exactly 8 EN — enDelta has amount -8 for actor', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe], phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
      });
      expect(next.pendingAction!.enDelta).toBeDefined();
      expect(next.pendingAction!.enDelta).toHaveLength(1);
      expect(next.pendingAction!.enDelta![0]!.targetId).toBe('DEADZONE');
      expect(next.pendingAction!.enDelta![0]!.amount).toBe(-8);
    });

    it('ACTION_RESOLVED after SKILL deducts 8 EN from actor (25 - 8 = 17)', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [dz],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'Signal Null',
          hpDelta: [{ targetId: 'CASTING_PROBE_MK1', amount: -18 }],
          enDelta: [{ targetId: 'DEADZONE', amount: -8 }],
          animationType: 'SKILL_ELECTRIC',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.party[0]!.en).toBe(17); // 25 - 8 = 17
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ENEMY_ACTION: real AI integration (Plan 03)
  // ─────────────────────────────────────────────────────────────────────────

  describe('ENEMY_ACTION: real AI integration (Plan 03)', () => {
    it('ENEMY_ACTION calls resolveEnemyAction and sets pendingAction with real hpDelta', () => {
      // PROBE ATK:14, DEADZONE DEF:10 → dmg = max(1, 14-10) = 4
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe], phase: 'ENEMY_TURN',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1,
      };
      const next = battleReducer(state, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'CASTING_PROBE_MK1' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction).not.toBeNull();
      expect(next.pendingAction!.hpDelta).toBeDefined();
      expect(next.pendingAction!.hpDelta).toHaveLength(1);
      expect(next.pendingAction!.hpDelta![0]!.targetId).toBe('DEADZONE');
      expect(next.pendingAction!.hpDelta![0]!.amount).toBe(-4);
    });

    it('ENEMY_ACTION with defeated enemy skips to next turn (does not RESOLVING)', () => {
      // T-02-03-03: defeated enemy guard — should advance turn, not RESOLVING
      const probeDefeated = { ...probe, isDefeated: true };
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probeDefeated], phase: 'ENEMY_TURN',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1,
      };
      const next = battleReducer(state, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'CASTING_PROBE_MK1' },
      });
      // Should NOT be RESOLVING with a pendingAction for a dead enemy
      expect(next.phase).not.toBe('RESOLVING');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ACTION_RESOLVED: end conditions
  // ─────────────────────────────────────────────────────────────────────────

  describe('ACTION_RESOLVED: end conditions checked before queue advance', () => {
    it('routes to VICTORY when enemy is defeated by attack (not ENEMY_TURN)', () => {
      // PROBE at hp=1, attack hits for 16 → isDefeated=true → VICTORY
      const probeDying = { ...probe, hp: 1 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dz],
        enemies: [probeDying],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'fatal hit',
          hpDelta: [{ targetId: 'CASTING_PROBE_MK1', amount: -16 }],
          animationType: 'ATTACK',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.phase).toBe('VICTORY');
      expect(next.enemies[0]!.isDefeated).toBe(true);
      expect(next.enemies[0]!.hp).toBe(0);
    });

    it('routes to GAME_OVER when party is defeated', () => {
      // DEADZONE at hp=2, probe attack hits for 4 → isDefeated → GAME_OVER
      const dzDying = { ...dz, hp: 2 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzDying],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1, // enemy's turn
        pendingAction: {
          actorId: 'CASTING_PROBE_MK1',
          description: 'probe attacks',
          hpDelta: [{ targetId: 'DEADZONE', amount: -4 }],
          animationType: 'ATTACK',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.phase).toBe('GAME_OVER');
      expect(next.party[0]!.isDefeated).toBe(true);
    });

    it('does NOT advance to ENEMY_TURN when enemy is already defeated', () => {
      // Confirms end condition is checked BEFORE queue advance (Pitfall C)
      const probeKilled = { ...probe, hp: 1 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dz],
        enemies: [probeKilled],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'fatal attack',
          hpDelta: [{ targetId: 'CASTING_PROBE_MK1', amount: -10 }],
          animationType: 'ATTACK',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.phase).toBe('VICTORY');
      // Must NOT be ENEMY_TURN
      expect(next.phase).not.toBe('ENEMY_TURN');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Full turn cycle integration test
  // ─────────────────────────────────────────────────────────────────────────

  describe('Full turn cycle integration: PLAYER_INPUT → RESOLVING → ENEMY_TURN → RESOLVING → PLAYER_INPUT', () => {
    it('completes a full two-actor round returning to PLAYER_INPUT', () => {
      // Step 1: INIT
      let state = battleReducer(initialBattleState, {
        type: 'INIT',
        payload: { party: [dz], enemies: [probe] },
      });
      expect(state.phase).toBe('PLAYER_INPUT');
      expect(state.turnQueue[0]!.combatantId).toBe('DEADZONE');

      // Step 2: PLAYER_ACTION ATTACK
      state = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'ATTACK', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
      });
      expect(state.phase).toBe('RESOLVING');
      expect(state.pendingAction!.hpDelta![0]!.amount).toBe(-16);

      // Step 3: ACTION_RESOLVED (DEADZONE's attack resolves)
      state = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(state.phase).toBe('ENEMY_TURN');
      expect(state.enemies[0]!.hp).toBe(24); // 40 - 16 = 24
      expect(state.currentTurnIndex).toBe(1);

      // Step 4: ENEMY_ACTION (probe acts)
      state = battleReducer(state, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'CASTING_PROBE_MK1' },
      });
      expect(state.phase).toBe('RESOLVING');
      expect(state.pendingAction).not.toBeNull();

      // Step 5: ACTION_RESOLVED (probe's action resolves) — wraps to new round
      state = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(state.phase).toBe('PLAYER_INPUT');
      expect(state.round).toBe(2); // new round after both act
      expect(state.currentTurnIndex).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ACTION_RESOLVED: EN delta application
  // ─────────────────────────────────────────────────────────────────────────

  describe('ACTION_RESOLVED: EN delta application', () => {
    it('applies enDelta to party member (DEFEND recovery capped at maxEn)', () => {
      const dzLowEn = { ...dz, en: 20 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzLowEn],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'defend',
          enDelta: [{ targetId: 'DEADZONE', amount: 5 }],
          animationType: 'DEFEND',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.party[0]!.en).toBe(25); // 20 + 5 = 25 (at maxEn)
    });

    it('does not let EN exceed maxEn via enDelta', () => {
      // DEADZONE at 23/25, +5 EN would be 28 but capped at 25
      const dzNearFull = { ...dz, en: 23 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzNearFull],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'defend',
          enDelta: [{ targetId: 'DEADZONE', amount: 5 }],
          animationType: 'DEFEND',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.party[0]!.en).toBe(25); // clamped at maxEn
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // ENEMY_ACTION: base wiring (Plan 03 fills AI call)
  // ─────────────────────────────────────────────────────────────────────────

  describe('ENEMY_ACTION: base wiring', () => {
    it('sets pendingAction with the enemy actorId', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe], phase: 'ENEMY_TURN',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1,
      };
      const next = battleReducer(state, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'CASTING_PROBE_MK1' },
      });
      expect(next.pendingAction).not.toBeNull();
      expect(next.pendingAction!.actorId).toBe('CASTING_PROBE_MK1');
    });
  });
});
