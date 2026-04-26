import type { Character, Enemy, TurnEntry, CombatantId } from './types';

/**
 * Builds the turn order for a single round.
 *
 * Rules (ENGINE-03):
 *   - Sort by SPD descending.
 *   - Ties: stable — declaration order preserved (party listed first by convention,
 *     so player wins ties — favorable JRPG bias).
 *   - Defeated combatants are excluded (they don't get a turn this round).
 *   - SPD value is snapshotted at build time — mid-round SPD changes do not reorder.
 *
 * Pure function. Never mutates inputs.
 */
export function buildTurnQueue(
  party: readonly Character[],
  enemies: readonly Enemy[]
): TurnEntry[] {
  const entries: TurnEntry[] = [
    ...party
      .filter(c => !c.isDefeated)
      .map(c => ({
        combatantId: c.id as CombatantId,
        kind: 'player' as const,
        spd: c.spd, // snapshot
      })),
    ...enemies
      .filter(e => !e.isDefeated)
      .map(e => ({
        combatantId: e.id as CombatantId,
        kind: 'enemy' as const,
        spd: e.spd,
      })),
  ];

  // Array.prototype.sort is stable as of ES2019 — guaranteed in Node 12+
  // (we target Node 20, so safe). Ties preserve declaration order.
  return entries.sort((a, b) => b.spd - a.spd);
}
