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

  // ─────────────────────────────────────────────────────────────────────────
  // WR-01: ENEMY_ACTION skip of defeated enemy must set correct next phase
  // ─────────────────────────────────────────────────────────────────────────

  describe('WR-01: ENEMY_ACTION skip of defeated enemy transitions to correct phase', () => {
    it('WR-01: ENEMY_ACTION skip of defeated enemy transitions to PLAYER_INPUT when next queue entry is player', () => {
      // Queue: [player(idx0), enemy_a(idx1), player(idx2), enemy_b(idx3)]
      // currentTurnIndex=1, enemy_a is defeated → skip → next is idx2 (player) → PLAYER_INPUT
      const enforcerA: Enemy = {
        kind: 'enemy', id: 'NETWORKER_ENFORCER_A', name: 'Networker Enforcer A',
        hp: 55, maxHp: 55, en: 0, maxEn: 0, atk: 16, def: 8, spd: 11,
        statusEffects: [], isDefeated: true, behavior: 'TARGET_LOWEST_HP',
      };
      const enforcerB: Enemy = {
        kind: 'enemy', id: 'NETWORKER_ENFORCER_B', name: 'Networker Enforcer B',
        hp: 55, maxHp: 55, en: 0, maxEn: 0, atk: 16, def: 8, spd: 11,
        statusEffects: [], isDefeated: false, behavior: 'TARGET_LOWEST_HP',
      };
      const state: BattleState = {
        ...initialBattleState,
        party: [dz],
        enemies: [enforcerA, enforcerB],
        phase: 'ENEMY_TURN',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'NETWORKER_ENFORCER_A', kind: 'enemy', spd: 11 },
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'NETWORKER_ENFORCER_B', kind: 'enemy', spd: 11 },
        ],
        currentTurnIndex: 1,
        round: 1,
      };
      const next = battleReducer(state, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'NETWORKER_ENFORCER_A' },
      });
      expect(next.phase).toBe('PLAYER_INPUT');
      expect(next.currentTurnIndex).toBe(2);
    });

    it('WR-01: ENEMY_ACTION skip at end-of-round transitions to PLAYER_INPUT if first next-round entry is player', () => {
      // Queue has 2 entries; currentTurnIndex=1 (last), enemy at idx1 is defeated
      // → end of round → rebuild queue → first entry is player → PLAYER_INPUT
      const probeDefeated = { ...probe, isDefeated: true };
      const state: BattleState = {
        ...initialBattleState,
        party: [dz],
        enemies: [probeDefeated],
        phase: 'ENEMY_TURN',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1,
        round: 1,
      };
      const next = battleReducer(state, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'CASTING_PROBE_MK1' },
      });
      expect(next.phase).toBe('PLAYER_INPUT');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // WR-02: NEXT_TURN must set correct next phase based on queue entry kind
  // ─────────────────────────────────────────────────────────────────────────

  describe('WR-02: NEXT_TURN sets phase from queue entry kind', () => {
    it('WR-02: NEXT_TURN with next entry = player produces PLAYER_INPUT', () => {
      // Queue: [enemy(idx0), player(idx1)]; currentTurnIndex=0 → next is idx1 (player) → PLAYER_INPUT
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe],
        phase: 'ENEMY_TURN',
        turnQueue: [
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
        ],
        currentTurnIndex: 0,
        round: 1,
      };
      const next = battleReducer(state, { type: 'NEXT_TURN' });
      expect(next.phase).toBe('PLAYER_INPUT');
      expect(next.currentTurnIndex).toBe(1);
    });

    it('WR-02: NEXT_TURN at end-of-round rebuilds queue and sets PLAYER_INPUT if first entry is player', () => {
      // Queue has 1 entry (enemy at idx0); currentTurnIndex=0 → end of round
      // → rebuild: DEADZONE(spd18) comes first → PLAYER_INPUT
      const state: BattleState = {
        ...initialBattleState,
        party: [dz], enemies: [probe],
        phase: 'ENEMY_TURN',
        turnQueue: [
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        round: 1,
      };
      const next = battleReducer(state, { type: 'NEXT_TURN' });
      expect(next.phase).toBe('PLAYER_INPUT');
      expect(next.round).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // WR-04: enemy HP clamped to maxHp on positive hpDelta in ACTION_RESOLVED
  // ─────────────────────────────────────────────────────────────────────────

  describe('WR-04: enemy HP clamped to maxHp on positive hpDelta', () => {
    it('WR-04: enemy HP cannot exceed maxHp when applying a positive hpDelta', () => {
      // Enemy at hp=40/maxHp=40; pendingAction hpDelta +10 → hp stays at 40 (not 50)
      const state: BattleState = {
        ...initialBattleState,
        party: [dz],
        enemies: [probe], // hp=40, maxHp=40
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'heal enemy (edge case)',
          hpDelta: [{ targetId: 'CASTING_PROBE_MK1', amount: +10 }],
          animationType: 'ITEM',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.enemies[0]!.hp).toBe(40); // clamped at maxHp, not 50
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SKILL/TORC: Forge Wall — DEF_BUFF to all alive party members
  // ─────────────────────────────────────────────────────────────────────────

  describe('SKILL/TORC: Forge Wall', () => {
    const torc: Character = {
      kind: 'player', id: 'TORC', name: 'TORC',
      hp: 130, maxHp: 130, en: 20, maxEn: 20, atk: 18, def: 20, spd: 12,
      statusEffects: [], isDefeated: false, isDefending: false,
    };

    it('SKILL/TORC (Forge Wall): applies DEF_BUFF statusEffect to all alive party members', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [{ ...dz, hp: 50 }, torc],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'TORC', kind: 'player', spd: 12 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'TORC' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction).not.toBeNull();
      expect(next.pendingAction!.statusApplied).toHaveLength(2);
      expect(next.pendingAction!.statusApplied![0]!.effect.type).toBe('DEF_BUFF');
      expect(next.pendingAction!.statusApplied![0]!.effect.turnsRemaining).toBe(2);
      expect(next.pendingAction!.statusApplied![0]!.effect.magnitude).toBe(8);
      expect(next.pendingAction!.statusApplied![1]!.effect.type).toBe('DEF_BUFF');
      expect(next.pendingAction!.statusApplied![1]!.effect.turnsRemaining).toBe(2);
      expect(next.pendingAction!.statusApplied![1]!.effect.magnitude).toBe(8);
    });

    it('SKILL/TORC (Forge Wall): deducts 6 EN from TORC', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [{ ...dz, hp: 50 }, torc],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'TORC', kind: 'player', spd: 12 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'TORC' },
      });
      expect(next.pendingAction!.enDelta).toHaveLength(1);
      expect(next.pendingAction!.enDelta![0]!.targetId).toBe('TORC');
      expect(next.pendingAction!.enDelta![0]!.amount).toBe(-6);
    });

    it('SKILL/TORC (Forge Wall): EN guard — returns same state if TORC.en < 6', () => {
      const torcLowEn = { ...torc, en: 5 };
      const state: BattleState = {
        ...initialBattleState,
        party: [dz, torcLowEn],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'TORC' },
      });
      expect(next).toBe(state);
    });

    it('ACTION_RESOLVED: applies statusApplied entries to party members', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [{ ...dz, hp: 50 }, torc],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'TORC', kind: 'player', spd: 12 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1,
        pendingAction: {
          actorId: 'TORC',
          description: 'Forge Wall',
          enDelta: [{ targetId: 'TORC', amount: -6 }],
          statusApplied: [{ targetId: 'DEADZONE', effect: { type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8 } }],
          animationType: 'SKILL_SHIELD',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      const dz2 = next.party.find(c => c.id === 'DEADZONE');
      expect(dz2!.statusEffects).toHaveLength(1);
      expect(dz2!.statusEffects[0]!.type).toBe('DEF_BUFF');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SKILL-05: Status effect decrement end-of-round
  // ─────────────────────────────────────────────────────────────────────────

  describe('SKILL-05: Status effect lifecycle — decrement end-of-round only', () => {
    const torc: Character = {
      kind: 'player', id: 'TORC', name: 'TORC',
      hp: 130, maxHp: 130, en: 20, maxEn: 20, atk: 18, def: 20, spd: 12,
      statusEffects: [], isDefeated: false, isDefending: false,
    };

    it('SKILL-05: DEF_BUFF does NOT decrement mid-round (nextIndex < queue.length)', () => {
      // 2 combatants in queue, currentTurnIndex=0 → nextIndex=1 → mid-round → no decrement
      const dzWithBuff: Character = {
        ...dz,
        statusEffects: [{ type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8 }],
      };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzWithBuff, torc],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'mid-round action',
          animationType: 'ATTACK',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      const dzResult = next.party.find(c => c.id === 'DEADZONE');
      // Mid-round: turnsRemaining should NOT have been decremented
      expect(dzResult!.statusEffects[0]!.turnsRemaining).toBe(2);
    });

    it('SKILL-05: DEF_BUFF decrements turnsRemaining at end-of-round (nextIndex >= queue.length)', () => {
      // Queue has 2 entries, currentTurnIndex=1 → nextIndex=2 === queue.length → end-of-round
      const dzWithBuff: Character = {
        ...dz,
        statusEffects: [{ type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8 }],
      };
      const state: BattleState = {
        ...initialBattleState,
        party: [dzWithBuff, torc],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1,
        pendingAction: {
          actorId: 'CASTING_PROBE_MK1',
          description: 'end-of-round action',
          animationType: 'ATTACK',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      const dzResult = next.party.find(c => c.id === 'DEADZONE');
      // End-of-round: turnsRemaining decremented from 2 to 1
      expect(dzResult!.statusEffects[0]!.turnsRemaining).toBe(1);
    });

    it('SKILL-05: DEF_BUFF expires (filtered out) after 2 end-of-round decrements', () => {
      const dzWithBuff: Character = {
        ...dz,
        statusEffects: [{ type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8 }],
      };
      const state1: BattleState = {
        ...initialBattleState,
        party: [dzWithBuff, torc],
        enemies: [probe],
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1, // last entry → end-of-round
        pendingAction: {
          actorId: 'CASTING_PROBE_MK1',
          description: 'end-of-round 1',
          animationType: 'ATTACK',
        },
      };
      // First end-of-round decrement: turnsRemaining 2 → 1
      const after1 = battleReducer(state1, { type: 'ACTION_RESOLVED' });
      const dzAfter1 = after1.party.find(c => c.id === 'DEADZONE');
      expect(dzAfter1!.statusEffects[0]!.turnsRemaining).toBe(1);

      // Second end-of-round: turnsRemaining 1 → 0 → filtered out
      const state2: BattleState = {
        ...after1,
        phase: 'RESOLVING',
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 1, // last entry → end-of-round
        pendingAction: {
          actorId: 'CASTING_PROBE_MK1',
          description: 'end-of-round 2',
          animationType: 'ATTACK',
        },
      };
      const after2 = battleReducer(state2, { type: 'ACTION_RESOLVED' });
      const dzAfter2 = after2.party.find(c => c.id === 'DEADZONE');
      expect(dzAfter2!.statusEffects).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SKILL/TRINETRA: System Override — heal + remove status
  // ─────────────────────────────────────────────────────────────────────────

  describe('SKILL/TRINETRA: System Override', () => {
    const trinetra: Character = {
      kind: 'player', id: 'TRINETRA', name: 'TRINETRA',
      hp: 85, maxHp: 85, en: 35, maxEn: 35, atk: 15, def: 12, spd: 15,
      statusEffects: [], isDefeated: false, isDefending: false,
    };

    it('SKILL/TRINETRA (System Override HEAL): heals 30 HP on target, capped at maxHp', () => {
      const dzLowHp: Character = { ...dz, hp: 50, maxHp: 95 };
      const state: BattleState = {
        ...initialBattleState,
        party: [trinetra, dzLowHp],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'TRINETRA', kind: 'player', spd: 15 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'TRINETRA', targetId: 'DEADZONE', skillVariant: 'HEAL' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction!.hpDelta).toHaveLength(1);
      expect(next.pendingAction!.hpDelta![0]!.targetId).toBe('DEADZONE');
      expect(next.pendingAction!.hpDelta![0]!.amount).toBe(30);
      expect(next.pendingAction!.enDelta).toHaveLength(1);
      expect(next.pendingAction!.enDelta![0]!.targetId).toBe('TRINETRA');
      expect(next.pendingAction!.enDelta![0]!.amount).toBe(-10);
      expect(next.pendingAction!.animationType).toBe('SKILL_HEAL');
    });

    it('SKILL/TRINETRA (System Override HEAL): heal capped at remaining HP headroom', () => {
      // DEADZONE hp=90, maxHp=95 → healAmount = min(30, 95-90) = 5
      const dzAlmostFull: Character = { ...dz, hp: 90, maxHp: 95 };
      const state: BattleState = {
        ...initialBattleState,
        party: [trinetra, dzAlmostFull],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'TRINETRA', kind: 'player', spd: 15 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'TRINETRA', targetId: 'DEADZONE', skillVariant: 'HEAL' },
      });
      expect(next.pendingAction!.hpDelta![0]!.amount).toBe(5);
    });

    it('SKILL/TRINETRA (System Override REMOVE_STATUS): removes first status from target', () => {
      const dzWithBuff: Character = {
        ...dz,
        statusEffects: [{ type: 'DEF_BUFF', turnsRemaining: 1, magnitude: 8 }],
      };
      const state: BattleState = {
        ...initialBattleState,
        party: [trinetra, dzWithBuff],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
        turnQueue: [
          { combatantId: 'TRINETRA', kind: 'player', spd: 15 },
          { combatantId: 'CASTING_PROBE_MK1', kind: 'enemy', spd: 10 },
        ],
        currentTurnIndex: 0,
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'TRINETRA', targetId: 'DEADZONE', skillVariant: 'REMOVE_STATUS' },
      });
      expect(next.pendingAction!.statusRemoved).toHaveLength(1);
      expect(next.pendingAction!.statusRemoved![0]!.targetId).toBe('DEADZONE');
      expect(next.pendingAction!.statusRemoved![0]!.effectType).toBe('DEF_BUFF');
    });

    it('SKILL/TRINETRA: EN guard — returns same state if en < 10', () => {
      const trinetraLowEn: Character = { ...trinetra, en: 9 };
      const state: BattleState = {
        ...initialBattleState,
        party: [trinetraLowEn, dz],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'TRINETRA', targetId: 'DEADZONE', skillVariant: 'HEAL' },
      });
      expect(next).toBe(state);
    });

    it('SKILL/TRINETRA: returns same state if target not found', () => {
      const state: BattleState = {
        ...initialBattleState,
        party: [trinetra],
        enemies: [probe],
        phase: 'PLAYER_INPUT',
      };
      const next = battleReducer(state, {
        type: 'PLAYER_ACTION',
        payload: { type: 'SKILL', actorId: 'TRINETRA', targetId: 'TORC', skillVariant: 'HEAL' },
      });
      expect(next).toBe(state);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OVERDRIVE engine tests (Phase 4 Plan 04-02 — Tests G-M)
  // ─────────────────────────────────────────────────────────────────────────

  describe('OVERDRIVE reducer transitions (OVERDRIVE-01/02/04/05/06/07/08)', () => {
    // AEGIS-7 enemy fixture
    const aegis: Enemy = {
      kind: 'enemy', id: 'AEGIS_7', name: 'AEGIS-7',
      hp: 200, maxHp: 200, en: 0, maxEn: 0, atk: 28, def: 15, spd: 8,
      statusEffects: [], isDefeated: false, behavior: 'OVERDRIVE_BOSS',
      isOverdriveActive: false,
    };
    const aegisLowHp = { ...aegis, hp: 99 };

    // Test G: PLAYER_ACTION DEFEND in OVERDRIVE_WARNING phase → transitions to RESOLVING (OVERDRIVE-07)
    it('Test G: PLAYER_ACTION DEFEND when phase=OVERDRIVE_WARNING → returns new state with phase=RESOLVING (not no-op)', () => {
      const state: BattleState = {
        ...initialBattleState,
        phase: 'OVERDRIVE_WARNING',
        party: [dz],
        enemies: [probe],
        overdrivePending: true,
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
      // Must NOT be same reference (phase guard must pass, not no-op)
      expect(next).not.toBe(state);
      expect(next.phase).toBe('RESOLVING');
    });

    // Test H: PLAYER_ACTION ATTACK in OVERDRIVE_WARNING phase → transitions to RESOLVING (expanded guard)
    it('Test H: PLAYER_ACTION ATTACK when phase=OVERDRIVE_WARNING → returns new state with phase=RESOLVING (expanded guard passes)', () => {
      const state: BattleState = {
        ...initialBattleState,
        phase: 'OVERDRIVE_WARNING',
        party: [dz],
        enemies: [probe],
        overdrivePending: true,
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
      expect(next).not.toBe(state);
      expect(next.phase).toBe('RESOLVING');
    });

    // Test I: ENEMY_ACTION with AEGIS_7 hp<100, overdrivePending=false → phase=RESOLVING, overdrivePending=true (OVERDRIVE-01+02)
    it('Test I: ENEMY_ACTION when phase=ENEMY_TURN, AEGIS_7 hp<100, overdrivePending=false → state.phase=RESOLVING and state.overdrivePending=true', () => {
      const state: BattleState = {
        ...initialBattleState,
        phase: 'ENEMY_TURN',
        party: [dz],
        enemies: [aegisLowHp],
        overdrivePending: false,
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'AEGIS_7', kind: 'enemy', spd: 8 },
        ],
        currentTurnIndex: 1,
      };
      const next = battleReducer(state, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'AEGIS_7' },
      });
      expect(next.phase).toBe('RESOLVING');
      expect(next.overdrivePending).toBe(true);
    });

    // Test J: ACTION_RESOLVED with overdrivePending=true, next entry=player → phase=OVERDRIVE_WARNING (OVERDRIVE-02)
    it('Test J: ACTION_RESOLVED with overdrivePending=true and next queue entry is player → nextPhase=OVERDRIVE_WARNING', () => {
      const state: BattleState = {
        ...initialBattleState,
        phase: 'RESOLVING',
        party: [dz],
        enemies: [aegisLowHp],
        overdrivePending: true,
        turnQueue: [
          { combatantId: 'AEGIS_7', kind: 'enemy', spd: 8 },
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'AEGIS_7',
          description: 'AEGIS-7 SOBRECARREGA OS SERVOS — TERMINUS CARREGANDO',
          animationType: 'OVERDRIVE_WARNING',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.phase).toBe('OVERDRIVE_WARNING');
    });

    // Test J2: ACTION_RESOLVED with overdrivePending=true, next entry=enemy → phase=OVERDRIVE_RESOLVING
    it('Test J2: ACTION_RESOLVED with overdrivePending=true and next queue entry is enemy → nextPhase=OVERDRIVE_RESOLVING', () => {
      // Scenario: player just acted (OVERDRIVE_WARNING phase), next is AEGIS_7 (enemy) → OVERDRIVE_RESOLVING
      const state: BattleState = {
        ...initialBattleState,
        phase: 'RESOLVING',
        party: [dz],
        enemies: [aegisLowHp],
        overdrivePending: true,
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'AEGIS_7', kind: 'enemy', spd: 8 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'DEADZONE',
          description: 'DEADZONE defende',
          animationType: 'DEFEND',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.phase).toBe('OVERDRIVE_RESOLVING');
    });

    // Test K: ENEMY_ACTION when phase=OVERDRIVE_RESOLVING → reducer allows it, AI returns TERMINUS, phase=RESOLVING
    it('Test K: ENEMY_ACTION when phase=OVERDRIVE_RESOLVING → reducer accepts it (expanded guard), AI returns TERMINUS, phase=RESOLVING', () => {
      const state: BattleState = {
        ...initialBattleState,
        phase: 'OVERDRIVE_RESOLVING',
        party: [{ ...dz, isDefending: false }],
        enemies: [aegisLowHp],
        overdrivePending: true,
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'AEGIS_7', kind: 'enemy', spd: 8 },
        ],
        currentTurnIndex: 1,
      };
      const next = battleReducer(state, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'AEGIS_7' },
      });
      // Phase guard must accept OVERDRIVE_RESOLVING — should NOT be no-op
      expect(next).not.toBe(state);
      expect(next.phase).toBe('RESOLVING');
      expect(next.pendingAction).not.toBeNull();
      expect(next.pendingAction!.animationType).toBe('OVERDRIVE_TERMINUS');
    });

    // Test L: ACTION_RESOLVED when all party hp=0 → phase=GAME_OVER (fires before OVERDRIVE routing)
    it('Test L: ACTION_RESOLVED when all party hp=0 before OVERDRIVE routing → phase=GAME_OVER (OVERDRIVE-05)', () => {
      const dzDying = { ...dz, hp: 1 };
      const state: BattleState = {
        ...initialBattleState,
        phase: 'RESOLVING',
        party: [dzDying],
        enemies: [aegisLowHp],
        overdrivePending: true,
        turnQueue: [
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
          { combatantId: 'AEGIS_7', kind: 'enemy', spd: 8 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'AEGIS_7',
          description: 'TERMINUS fires',
          hpDelta: [{ targetId: 'DEADZONE', amount: -999 }],
          animationType: 'OVERDRIVE_TERMINUS',
        },
      };
      const next = battleReducer(state, { type: 'ACTION_RESOLVED' });
      expect(next.phase).toBe('GAME_OVER');
    });

    // Test M: After TERMINUS fires, overdrivePending resets to false; next AEGIS ENEMY_ACTION
    // (in ENEMY_TURN) produces OVERDRIVE_WARNING again — not immediate OVERDRIVE_RESOLVING
    it('Test M: After TERMINUS resolves, overdrivePending=false; next AEGIS ENEMY_ACTION in ENEMY_TURN produces OVERDRIVE_WARNING (fresh cycle)', () => {
      // Step 1: ACTION_RESOLVED after TERMINUS — should reset overdrivePending to false
      const stateAfterTerminus: BattleState = {
        ...initialBattleState,
        phase: 'RESOLVING',
        party: [dz],
        enemies: [aegisLowHp],
        overdrivePending: true,
        turnQueue: [
          { combatantId: 'AEGIS_7', kind: 'enemy', spd: 8 },
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
        ],
        currentTurnIndex: 0,
        pendingAction: {
          actorId: 'AEGIS_7',
          description: 'AEGIS-7 dispara TERMINUS — protocolo de eliminação em cascata',
          hpDelta: [],
          animationType: 'OVERDRIVE_TERMINUS',
        },
      };
      const afterResolved = battleReducer(stateAfterTerminus, { type: 'ACTION_RESOLVED' });
      // overdrivePending must be false after TERMINUS resolves
      expect(afterResolved.overdrivePending).toBe(false);

      // Step 2: Put AEGIS in ENEMY_TURN with overdrivePending=false — should produce OVERDRIVE_WARNING
      const stateForNextAegisTurn: BattleState = {
        ...initialBattleState,
        phase: 'ENEMY_TURN',
        party: [dz],
        enemies: [aegisLowHp],
        overdrivePending: false,  // reset after TERMINUS
        turnQueue: [
          { combatantId: 'AEGIS_7', kind: 'enemy', spd: 8 },
          { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
        ],
        currentTurnIndex: 0,
      };
      const nextAegisTurn = battleReducer(stateForNextAegisTurn, {
        type: 'ENEMY_ACTION',
        payload: { enemyId: 'AEGIS_7' },
      });
      // Must announce fresh OVERDRIVE_WARNING — not skip to OVERDRIVE_RESOLVING
      expect(nextAegisTurn.overdrivePending).toBe(true);
      expect(nextAegisTurn.pendingAction!.animationType).toBe('OVERDRIVE_WARNING');
    });
  });
});
