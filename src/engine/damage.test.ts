import { describe, it, expect } from 'vitest';
import { calculateDamage, getEffectiveDef } from './damage';
import type { Character, Enemy } from './types';

const makeChar = (overrides: Partial<Character> = {}): Character => ({
  kind: 'player',
  id: 'DEADZONE',
  name: 'DEADZONE',
  hp: 95, maxHp: 95,
  en: 25, maxEn: 25,
  atk: 22, def: 10, spd: 18,
  statusEffects: [],
  isDefeated: false,
  isDefending: false,
  ...overrides,
});

const makeEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
  kind: 'enemy',
  id: 'CASTING_PROBE_MK1',
  name: 'Casting Probe MK-I',
  hp: 40, maxHp: 40,
  en: 0, maxEn: 0,
  atk: 14, def: 6, spd: 10,
  statusEffects: [],
  isDefeated: false,
  behavior: 'ALWAYS_ATTACK',
  ...overrides,
});

describe('calculateDamage', () => {
  it('returns ATK - DEF for the simple case', () => {
    const attacker = makeChar({ atk: 22 });
    const target = makeEnemy({ def: 6 });
    expect(calculateDamage(attacker, target)).toBe(16);
  });

  it('returns minimum 1 when DEF >= ATK (ENGINE-02 boundary)', () => {
    const attacker = makeChar({ atk: 5 });
    const target = makeEnemy({ def: 100 });
    expect(calculateDamage(attacker, target)).toBe(1);
  });

  it('returns minimum 1 when ATK == DEF', () => {
    const attacker = makeChar({ atk: 10 });
    const target = makeEnemy({ def: 10 });
    expect(calculateDamage(attacker, target)).toBe(1);
  });

  it('applies defPenetration (Signal Null ignores 30% DEF)', () => {
    const attacker = makeChar({ atk: 22 });
    const target = makeEnemy({ def: 10 });
    // effectiveDef = floor(10 * 0.7) = 7 → 22 - 7 = 15
    expect(calculateDamage(attacker, target, { defPenetration: 0.7 })).toBe(15);
  });

  it('applies damageMultiplier (DEFENDING halves)', () => {
    const attacker = makeChar({ atk: 30 });
    const target = makeEnemy({ def: 10 });
    // raw = (30 - 10) * 0.5 = 10
    expect(calculateDamage(attacker, target, { damageMultiplier: 0.5 })).toBe(10);
  });

  it('includes DEF_BUFF status effect in effective DEF', () => {
    const attacker = makeChar({ atk: 22 });
    const target = makeEnemy({
      def: 6,
      statusEffects: [{ type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8 }],
    });
    // effectiveDef = 6 + 8 = 14 → 22 - 14 = 8
    expect(calculateDamage(attacker, target)).toBe(8);
  });

  // ── Mutation regression tests (ENGINE-06, QA-03) ────────────────────────
  it('does NOT mutate attacker or target (purity contract)', () => {
    const attacker = makeChar();
    const target = makeEnemy();
    const attackerSnapshot = JSON.stringify(attacker);
    const targetSnapshot = JSON.stringify(target);

    calculateDamage(attacker, target);

    expect(JSON.stringify(attacker)).toBe(attackerSnapshot);
    expect(JSON.stringify(target)).toBe(targetSnapshot);
  });

  it('does NOT mutate the modifiers object', () => {
    const mods = { defPenetration: 0.7, damageMultiplier: 1.5 };
    const snapshot = JSON.stringify(mods);
    calculateDamage(makeChar(), makeEnemy(), mods);
    expect(JSON.stringify(mods)).toBe(snapshot);
  });
});

describe('getEffectiveDef', () => {
  it('returns base DEF when no status effects', () => {
    expect(getEffectiveDef(makeEnemy({ def: 7 }))).toBe(7);
  });

  it('stacks multiple DEF_BUFF magnitudes', () => {
    const target = makeEnemy({
      def: 5,
      statusEffects: [
        { type: 'DEF_BUFF', turnsRemaining: 2, magnitude: 8 },
        { type: 'DEF_BUFF', turnsRemaining: 1, magnitude: 3 },
      ],
    });
    expect(getEffectiveDef(target)).toBe(16);
  });

  it('ignores non-DEF_BUFF status effects', () => {
    const target = makeEnemy({
      def: 7,
      statusEffects: [{ type: 'OVERDRIVE_CHARGE', turnsRemaining: 1 }],
    });
    expect(getEffectiveDef(target)).toBe(7);
  });
});
