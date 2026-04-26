import type { Enemy } from '@/engine/types';

/**
 * Enemy instances for the [In]terfaces JRPG demo.
 * Stats from PROJECT.md "Inimigos" table.
 *
 * Casting Probe MK-I  | Fase 1 (x1) | HP 40 | ATK 14 | DEF 6  | SPD 10 | ALWAYS_ATTACK
 * Networker Enforcer  | Fase 2 (x2) | HP 55 | ATK 16 | DEF 8  | SPD 11 | TARGET_LOWEST_HP
 * Casting Patrol Bot  | Fase 3 (x3) | HP 45 | ATK 13 | DEF 7  | SPD 9  | ATTACK_RANDOM
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

const networkerEnforcerBase = {
  kind: 'enemy' as const,
  name: 'Networker Enforcer',
  hp: 55, maxHp: 55,
  en: 0, maxEn: 0,
  atk: 16, def: 8, spd: 11,
  statusEffects: [],
  isDefeated: false,
  behavior: 'TARGET_LOWEST_HP' as const,
};
export const NETWORKER_ENFORCER_A: Enemy = { ...networkerEnforcerBase, id: 'NETWORKER_ENFORCER_A' };
export const NETWORKER_ENFORCER_B: Enemy = { ...networkerEnforcerBase, id: 'NETWORKER_ENFORCER_B' };

const patrolBotBase = {
  kind: 'enemy' as const,
  name: 'Casting Patrol Bot',
  hp: 45, maxHp: 45,
  en: 0, maxEn: 0,
  atk: 13, def: 7, spd: 9,
  statusEffects: [],
  isDefeated: false,
  behavior: 'ATTACK_RANDOM' as const,
};
export const CASTING_PATROL_BOT_A: Enemy = { ...patrolBotBase, id: 'CASTING_PATROL_BOT_A' };
export const CASTING_PATROL_BOT_B: Enemy = { ...patrolBotBase, id: 'CASTING_PATROL_BOT_B' };
export const CASTING_PATROL_BOT_C: Enemy = { ...patrolBotBase, id: 'CASTING_PATROL_BOT_C' };

// AEGIS-7 | Fase 4 (x1) | HP 200 | ATK 28 | DEF 15 | SPD 8 | OVERDRIVE_BOSS
export const AEGIS_7: Enemy = {
  kind: 'enemy',
  id: 'AEGIS_7',
  name: 'AEGIS-7',
  hp: 200, maxHp: 200,
  en: 0, maxEn: 0,
  atk: 28, def: 15, spd: 8,
  statusEffects: [],
  isDefeated: false,
  behavior: 'OVERDRIVE_BOSS',
  isOverdriveActive: false,
};
