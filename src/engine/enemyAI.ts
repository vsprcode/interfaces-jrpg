import type { Enemy, ResolvedAction, EnemyBehaviorType, BattleState } from './types';
import { calculateDamage } from './damage';

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
  // Phase 2 Plan 03: ALWAYS_ATTACK real implementation (AI-02)
  ALWAYS_ATTACK: (enemy, state) => {
    const validTargets = state.party.filter(c => !c.isDefeated);
    if (validTargets.length === 0) {
      throw new Error('ALWAYS_ATTACK: no valid targets — GAME_OVER should have fired first');
    }
    const target = validTargets[0]!; // first alive party member (deterministic, AI-02)
    const dmg = calculateDamage(enemy, target, {
      damageMultiplier: target.isDefending ? 0.5 : 1.0,
    });
    // T-02-03-02: isDefending check — dedicated test asserts dmg halved when defending
    const description = target.isDefending
      ? `Casting Probe MK-I varre o corredor — DEADZONE absorve o impacto — ${dmg} de dano`
      : `Casting Probe MK-I varre o corredor — sonda de ataque detecta DEADZONE — ${dmg} de dano`;
    return {
      actorId: enemy.id,
      description,
      hpDelta: [{ targetId: target.id, amount: -dmg }],
      animationType: 'ATTACK',
    };
  },

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
