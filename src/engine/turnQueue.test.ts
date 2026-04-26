import { describe, it, expect } from 'vitest';
import { buildTurnQueue } from './turnQueue';
import type { Character, Enemy } from './types';

const c = (id: Character['id'], spd: number, defeated = false): Character => ({
  kind: 'player', id, name: id,
  hp: 1, maxHp: 1, en: 0, maxEn: 0, atk: 0, def: 0, spd,
  statusEffects: [], isDefeated: defeated, isDefending: false,
});

const e = (id: Enemy['id'], spd: number, defeated = false): Enemy => ({
  kind: 'enemy', id, name: id,
  hp: 1, maxHp: 1, en: 0, maxEn: 0, atk: 0, def: 0, spd,
  statusEffects: [], isDefeated: defeated, behavior: 'ALWAYS_ATTACK',
});

describe('buildTurnQueue', () => {
  it('sorts by SPD descending', () => {
    const party = [c('DEADZONE', 18), c('TORC', 12)];
    const enemies = [e('CASTING_PROBE_MK1', 10)];
    const q = buildTurnQueue(party, enemies);
    expect(q.map(t => t.combatantId)).toEqual(['DEADZONE', 'TORC', 'CASTING_PROBE_MK1']);
  });

  it('handles ties with stable sort (party first)', () => {
    const party = [c('TORC', 11)];
    const enemies = [e('NETWORKER_ENFORCER', 11)];
    const q = buildTurnQueue(party, enemies);
    expect(q[0]?.combatantId).toBe('TORC');
    expect(q[1]?.combatantId).toBe('NETWORKER_ENFORCER');
  });

  it('excludes defeated combatants', () => {
    const party = [c('DEADZONE', 18), c('TORC', 12, /* defeated */ true)];
    const enemies = [e('CASTING_PROBE_MK1', 10)];
    const q = buildTurnQueue(party, enemies);
    expect(q.map(t => t.combatantId)).toEqual(['DEADZONE', 'CASTING_PROBE_MK1']);
  });

  it('returns empty array when all combatants defeated', () => {
    const party = [c('DEADZONE', 18, true)];
    const enemies = [e('CASTING_PROBE_MK1', 10, true)];
    expect(buildTurnQueue(party, enemies)).toEqual([]);
  });

  it('snapshots SPD at build time (does not store reference)', () => {
    const dz = c('DEADZONE', 18);
    const q = buildTurnQueue([dz], []);
    // Mutate the original (illustrative — real code never does this)
    (dz as { spd: number }).spd = 99;
    expect(q[0]?.spd).toBe(18); // snapshot intact
  });

  it('does NOT mutate input arrays (purity)', () => {
    const party = [c('DEADZONE', 18), c('TORC', 12)];
    const enemies = [e('CASTING_PROBE_MK1', 10)];
    const partySnap = JSON.stringify(party);
    const enemiesSnap = JSON.stringify(enemies);
    buildTurnQueue(party, enemies);
    expect(JSON.stringify(party)).toBe(partySnap);
    expect(JSON.stringify(enemies)).toBe(enemiesSnap);
  });
});
