import type { Enemy } from '@/engine/types';

/**
 * Phase 1 scope: CASTING_PROBE_MK1 only.
 * Networker Enforcer, Patrol Bot, AEGIS-7 are added in Phase 3/4 when their encounters land.
 * Stats from PROJECT.md "Inimigos" table:
 *   Casting Probe MK-I | HP 40 | ATK 14 | DEF 6 | SPD 10 | Behavior: always_attack
 */
export const CASTING_PROBE_MK1: Enemy = {
  kind: 'enemy',
  id: 'CASTING_PROBE_MK1',
  name: 'Casting Probe MK-I',
  hp: 40, maxHp: 40,
  en: 0, maxEn: 0,
  atk: 14, def: 6, spd: 10,
  statusEffects: [],
  isDefeated: false,
  behavior: 'ALWAYS_ATTACK',
};
