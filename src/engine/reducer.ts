import type { BattleState, Action } from './types';
import { buildTurnQueue } from './turnQueue';

export const initialBattleState: BattleState = {
  phase: 'INIT',
  party: [],
  enemies: [],
  turnQueue: [],
  currentTurnIndex: 0,
  round: 0,
  pendingAction: null,
  log: [],
  items: { nanoMed: 3 },
};

/**
 * Pure reducer for battle state. Synchronous, deterministic, never throws.
 *
 * GROUND RULES (Phase 1 guardrails):
 *   1. Every PLAYER_ACTION case starts with the phase guard (ENGINE-05, QA-05).
 *   2. Every state update spreads parent objects AND nested combatants (ENGINE-06, QA-03).
 *   3. Math.random() is allowed here (QA-04 — reducer dispatch is a discrete event).
 *   4. Returns NEW state object on change; returns identical reference on no-op.
 */
export function battleReducer(state: BattleState, action: Action): BattleState {
  switch (action.type) {
    case 'INIT': {
      const { party, enemies } = action.payload;
      const clonedParty = party.map(c => ({ ...c }));
      const clonedEnemies = enemies.map(e => ({ ...e }));
      const turnQueue = buildTurnQueue(clonedParty, clonedEnemies);
      return {
        ...initialBattleState,
        party: clonedParty,
        enemies: clonedEnemies,
        turnQueue,
        phase: 'PLAYER_INPUT',
        round: 1,
        log: ['Encontro iniciado.'],
      };
    }

    case 'PLAYER_ACTION': {
      // PHASE GUARD (ENGINE-05, QA-05, Pitfall 4)
      if (state.phase !== 'PLAYER_INPUT') {
        return state;
      }

      return {
        ...state,
        phase: 'RESOLVING',
        pendingAction: {
          actorId: action.payload.actorId,
          description: `${action.payload.actorId} executes ${action.payload.type}.`,
          animationType: 'ATTACK',
        },
        log: [...state.log, `${action.payload.actorId} → ${action.payload.type}`],
      };
    }

    case 'ACTION_RESOLVED': {
      if (state.phase !== 'RESOLVING') return state;
      return {
        ...state,
        pendingAction: null,
        phase: 'PLAYER_INPUT',
      };
    }

    case 'ENEMY_ACTION': {
      if (state.phase !== 'ENEMY_TURN') return state;
      return { ...state, phase: 'RESOLVING' };
    }

    case 'NEXT_TURN': {
      const nextIndex = state.currentTurnIndex + 1;
      if (nextIndex >= state.turnQueue.length) {
        const newQueue = buildTurnQueue(state.party, state.enemies);
        return {
          ...state,
          turnQueue: newQueue,
          currentTurnIndex: 0,
          round: state.round + 1,
        };
      }
      return { ...state, currentTurnIndex: nextIndex };
    }

    case 'CHECK_END_CONDITIONS': {
      const allEnemiesDefeated = state.enemies.every(e => e.isDefeated);
      const allPartyDefeated = state.party.every(c => c.isDefeated);
      if (allEnemiesDefeated) return { ...state, phase: 'VICTORY' };
      if (allPartyDefeated) return { ...state, phase: 'GAME_OVER' };
      return state;
    }

    default: {
      // Exhaustiveness check — TypeScript errors if a new Action variant is added without a case
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = action;
      return state;
    }
  }
}
