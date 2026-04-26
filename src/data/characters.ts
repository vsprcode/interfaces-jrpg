import type { Character } from '@/engine/types';

/**
 * Playable characters for the [In]terfaces JRPG demo.
 * Stats from PROJECT.md "Personagens Jogáveis" table.
 *
 * DEADZONE | HP 95  | EN 25 | ATK 22 | DEF 10 | SPD 18 | Signal Null (8 EN)
 * TORC     | HP 130 | EN 20 | ATK 18 | DEF 20 | SPD 12 | Forge Wall (6 EN)
 * TRINETRA | HP 85  | EN 35 | ATK 15 | DEF 12 | SPD 15 | System Override (10 EN)
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

export const TORC: Character = {
  kind: 'player',
  id: 'TORC',
  name: 'TORC',
  hp: 130, maxHp: 130,
  en: 20, maxEn: 20,
  atk: 18, def: 20, spd: 12,
  statusEffects: [],
  isDefeated: false,
  isDefending: false,
};

export const TRINETRA: Character = {
  kind: 'player',
  id: 'TRINETRA',
  name: 'TRINETRA',
  hp: 85, maxHp: 85,
  en: 35, maxEn: 35,
  atk: 15, def: 12, spd: 15,
  statusEffects: [],
  isDefeated: false,
  isDefending: false,
};
