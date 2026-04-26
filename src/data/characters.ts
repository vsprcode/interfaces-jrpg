import type { Character } from '@/engine/types';

/**
 * Phase 1 scope: DEADZONE only.
 * TORC and TRINETRA are added in Phase 2/3 when their encounters land.
 * Stats from PROJECT.md "Personagens Jogáveis" table:
 *   DEADZONE | HP 95 | EN 25 | ATK 22 | DEF 10 | SPD 18
 */
export const DEADZONE: Character = {
  kind: 'player',
  id: 'DEADZONE',
  name: 'DEADZONE',
  hp: 95, maxHp: 95,
  en: 25, maxEn: 25,
  atk: 22, def: 10, spd: 18,
  statusEffects: [],
  isDefeated: false,
  isDefending: false,
};
