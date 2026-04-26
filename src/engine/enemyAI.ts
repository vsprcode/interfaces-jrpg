import type { Enemy, ResolvedAction, EnemyBehaviorType, BattleState } from './types';

/**
 * AI function signature.
 *
 * Receives the LIVE battle state (not closure-captured) — callers must
 * pass `gameStateRef.current`, never a closed-over state variable (AI-05).
 *
 * Returns a ResolvedAction describing what the enemy does this turn.
 * Pure: no mutation, no side effects. The reducer applies the result.
 */
export type AIFn = (enemy: Enemy, state: BattleState) => ResolvedAction;

/**
 * Strategy map keyed by behavior type. Adding a new enemy archetype means
 * adding one entry here — no switch statements to extend, no class hierarchy.
 */
export const AI_BEHAVIORS: Record<EnemyBehaviorType, AIFn> = {
  // Phase 2 implements ALWAYS_ATTACK fully
  ALWAYS_ATTACK: (enemy, state) => stubAction(enemy, state, 'always_attack stub'),

  // Phase 3 implements TARGET_LOWEST_HP and ATTACK_RANDOM
  TARGET_LOWEST_HP: (enemy, state) => stubAction(enemy, state, 'target_lowest_hp stub'),
  ATTACK_RANDOM: (enemy, state) => stubAction(enemy, state, 'attack_random stub'),

  // Phase 4 implements OVERDRIVE_BOSS
  OVERDRIVE_BOSS: (enemy, state) => stubAction(enemy, state, 'overdrive_boss stub'),
};

function stubAction(enemy: Enemy, state: BattleState, label: string): ResolvedAction {
  // Defensive: validate at least one valid target exists (Pitfall 9)
  const validTargets = state.party.filter(c => !c.isDefeated);
  if (validTargets.length === 0) {
    throw new Error(`AI ${label}: no valid targets — caller must dispatch GAME_OVER first`);
  }

  // Phase 1 stub: stable placeholder action so the reducer can be tested.
  return {
    actorId: enemy.id,
    description: `${enemy.name} acts (${label})`,
    animationType: 'ATTACK',
  };
}

/**
 * Convenience entry point. The reducer (Phase 2+) calls this from ENEMY_ACTION
 * cases. Phase 1 only needs the SHAPE of the function map for AI-01.
 */
export function resolveEnemyAction(enemy: Enemy, state: BattleState): ResolvedAction {
  return AI_BEHAVIORS[enemy.behavior](enemy, state);
}
