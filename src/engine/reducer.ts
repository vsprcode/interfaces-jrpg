import type { BattleState, Action, ResolvedAction } from './types';
import { buildTurnQueue } from './turnQueue';
import { calculateDamage } from './damage';
import { resolveEnemyAction } from './enemyAI';

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

      const { type: actionType, actorId, targetId } = action.payload;
      const actor = state.party.find(c => c.id === actorId)!;

      // Clear isDefending at the start of this actor's turn (A1: clear at dispatch)
      // T-02-02-03: isDefending cleared before any action to prevent stale persisting flag
      const partyCleared = state.party.map(c =>
        c.id === actorId ? { ...c, isDefending: false } : c
      );

      switch (actionType) {
        case 'ATTACK': {
          const target = state.enemies.find(e => e.id === targetId)!;
          const dmg = calculateDamage(actor, target);
          const resolved: ResolvedAction = {
            actorId: actor.id,
            description: `DEADZONE encontra brecha no firewall — ${dmg} de dano`,
            hpDelta: [{ targetId: target.id, amount: -dmg }],
            animationType: 'ATTACK',
          };
          return {
            ...state,
            party: partyCleared,
            phase: 'RESOLVING',
            pendingAction: resolved,
            log: [...state.log, resolved.description],
          };
        }

        case 'DEFEND': {
          // T-02-02-03: isDefending set on actor immediately; cleared next turn
          // Pitfall D: DEFEND has NO EN check — always available
          const enRecovery = Math.min(5, actor.maxEn - actor.en);
          const resolved: ResolvedAction = {
            actorId: actor.id,
            description: 'DEADZONE ativa postura de contenção analógica — recupera 5 EN',
            enDelta: enRecovery > 0 ? [{ targetId: actor.id, amount: enRecovery }] : [],
            animationType: 'DEFEND',
          };
          // Set isDefending: true on actor directly (so it's available for AI's damageMultiplier check)
          const partyDefending = partyCleared.map(c =>
            c.id === actorId ? { ...c, isDefending: true } : c
          );
          return {
            ...state,
            party: partyDefending,
            phase: 'RESOLVING',
            pendingAction: resolved,
            log: [...state.log, resolved.description],
          };
        }

        case 'ITEM': {
          // T-02-02-02: Guard against exhausted inventory
          if (state.items.nanoMed <= 0) return state;
          const healTarget = state.party.find(c => c.id === (targetId ?? actorId))!;
          // Pitfall E: clamp heal amount to available HP headroom
          const healAmount = Math.min(30, healTarget.maxHp - healTarget.hp);
          const resolved: ResolvedAction = {
            actorId: actor.id,
            description: `DEADZONE injeta Nano-Med — restaura ${healAmount} HP`,
            hpDelta: [{ targetId: healTarget.id, amount: healAmount }],
            animationType: 'ITEM',
          };
          return {
            ...state,
            party: partyCleared,
            phase: 'RESOLVING',
            pendingAction: resolved,
            items: { ...state.items, nanoMed: state.items.nanoMed - 1 },
            log: [...state.log, resolved.description],
          };
        }

        case 'SKILL': {
          // Signal Null (SKILL-01/04): defPenetration 0.7, EN cost 8
          const EN_COST = 8;
          if (actor.en < EN_COST) return state; // SKILL-04: same-reference no-op (T-02-03-01)
          const target = state.enemies.find(e => e.id === targetId)!;
          const dmg = calculateDamage(actor, target, { defPenetration: 0.7 });
          const resolved: ResolvedAction = {
            actorId: actor.id,
            description: `DEADZONE transmite SIGNAL NULL — protocolo de ruído digital ativado — ${dmg} de dano (DEF ignorada em 30%)`,
            hpDelta: [{ targetId: target.id, amount: -dmg }],
            enDelta: [{ targetId: actor.id, amount: -EN_COST }],
            animationType: 'SKILL_ELECTRIC',
          };
          return {
            ...state,
            party: partyCleared,
            phase: 'RESOLVING',
            pendingAction: resolved,
            log: [...state.log, resolved.description],
          };
        }
      }
    }

    case 'ACTION_RESOLVED': {
      if (state.phase !== 'RESOLVING') return state;
      if (!state.pendingAction) return { ...state, phase: 'PLAYER_INPUT' };

      const { hpDelta, enDelta } = state.pendingAction;

      let newParty = state.party;
      let newEnemies = state.enemies;

      // Apply HP deltas to both party and enemies
      // T-02-02-01: HP always clamped via Math.max(0, Math.min(maxHp, hp + delta))
      if (hpDelta) {
        for (const delta of hpDelta) {
          newParty = newParty.map(c => {
            if (c.id !== delta.targetId) return c;
            const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta.amount));
            return { ...c, hp: newHp, isDefeated: newHp <= 0 };
          });
          newEnemies = newEnemies.map(e => {
            if (e.id !== delta.targetId) return e;
            const newHp = Math.max(0, e.hp + delta.amount);
            return { ...e, hp: newHp, isDefeated: newHp <= 0 };
          });
        }
      }

      // Apply EN deltas (party only)
      if (enDelta) {
        for (const delta of enDelta) {
          newParty = newParty.map(c => {
            if (c.id !== delta.targetId) return c;
            return { ...c, en: Math.max(0, Math.min(c.maxEn, c.en + delta.amount)) };
          });
        }
      }

      // T-02-02-04: Check end conditions BEFORE advancing queue (Pitfall C)
      if (newEnemies.every(e => e.isDefeated)) {
        return {
          ...state,
          party: newParty,
          enemies: newEnemies,
          pendingAction: null,
          phase: 'VICTORY',
          log: [...state.log, 'Probe MK-I neutralizada. Corredor 7-A desobstruído.'],
        };
      }
      if (newParty.every(c => c.isDefeated)) {
        return {
          ...state,
          party: newParty,
          enemies: newEnemies,
          pendingAction: null,
          phase: 'GAME_OVER',
          log: [...state.log, 'DEADZONE eliminada. A resistência analógica recua.'],
        };
      }

      // Advance turn queue
      const nextIndex = state.currentTurnIndex + 1;
      if (nextIndex >= state.turnQueue.length) {
        // End of round — rebuild queue for new round
        const newQueue = buildTurnQueue(newParty, newEnemies);
        const nextEntry = newQueue[0];
        const nextPhase = nextEntry!.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
        return {
          ...state,
          party: newParty,
          enemies: newEnemies,
          turnQueue: newQueue,
          currentTurnIndex: 0,
          round: state.round + 1,
          pendingAction: null,
          phase: nextPhase,
        };
      }

      const nextEntry = state.turnQueue[nextIndex];
      const nextPhase = nextEntry!.kind === 'player' ? 'PLAYER_INPUT' : 'ENEMY_TURN';
      return {
        ...state,
        party: newParty,
        enemies: newEnemies,
        currentTurnIndex: nextIndex,
        pendingAction: null,
        phase: nextPhase,
      };
    }

    case 'ENEMY_ACTION': {
      if (state.phase !== 'ENEMY_TURN') return state;
      const { enemyId } = action.payload;
      const enemy = state.enemies.find(e => e.id === enemyId);
      if (!enemy || enemy.isDefeated) {
        // T-02-03-03: Skip defeated enemy — advance turn index without RESOLVING
        const nextIndex = state.currentTurnIndex + 1;
        if (nextIndex >= state.turnQueue.length) {
          const newQueue = buildTurnQueue(state.party, state.enemies);
          return { ...state, turnQueue: newQueue, currentTurnIndex: 0, round: state.round + 1 };
        }
        return { ...state, currentTurnIndex: nextIndex };
      }
      const resolvedAction = resolveEnemyAction(enemy, state);
      return {
        ...state,
        phase: 'RESOLVING',
        pendingAction: resolvedAction,
        log: [...state.log, resolvedAction.description],
      };
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
