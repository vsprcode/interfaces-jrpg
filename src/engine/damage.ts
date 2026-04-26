import type { Combatant } from './types';

export interface DamageModifiers {
  /** Multiplier on the defender's effective DEF (0.7 = ignore 30% — Signal Null). */
  defPenetration?: number;
  /** Flat ATK bonus from skills/buffs. */
  flatAtkBonus?: number;
  /** Final damage multiplier (1.5 = crit, 0.5 = DEFENDING). */
  damageMultiplier?: number;
}

/**
 * Pure damage formula.
 *   base = (attacker.atk + flatAtkBonus) - (effectiveDef * defPenetration)
 *   final = floor(base * damageMultiplier)
 *   returns max(1, final)
 *
 * Always returns >= 1 (per ENGINE-02). Never mutates inputs.
 */
export function calculateDamage(
  attacker: Combatant,
  target: Combatant,
  modifiers: DamageModifiers = {}
): number {
  const flatBonus = modifiers.flatAtkBonus ?? 0;
  const penetration = modifiers.defPenetration ?? 1.0;
  const multiplier = modifiers.damageMultiplier ?? 1.0;

  const effectiveAtk = attacker.atk + flatBonus;
  const effectiveDef = Math.floor(getEffectiveDef(target) * penetration);

  const raw = (effectiveAtk - effectiveDef) * multiplier;
  return Math.max(1, Math.floor(raw));
}

/** Returns DEF including any DEF_BUFF status effect magnitudes. */
export function getEffectiveDef(combatant: Combatant): number {
  const buffs = combatant.statusEffects.filter(e => e.type === 'DEF_BUFF');
  const totalBuff = buffs.reduce((sum, b) => sum + (b.magnitude ?? 0), 0);
  return combatant.def + totalBuff;
}
