import type { Character, Enemy } from '@/engine/types';
import { DEADZONE, TORC, TRINETRA } from '@/data/characters';
import {
  CASTING_PROBE_MK1,
  NETWORKER_ENFORCER_A, NETWORKER_ENFORCER_B,
  CASTING_PATROL_BOT_A, CASTING_PATROL_BOT_B, CASTING_PATROL_BOT_C,
} from '@/data/enemies';

export type EncounterBackground = 'corridor' | 'loading_dock' | 'server_room' | 'command_chamber';

export interface EncounterConfig {
  index: number;
  background: EncounterBackground;
  party: Character[];
  enemies: Enemy[];
  newPartyMember?: Character;
}

export const ENCOUNTER_CONFIGS: EncounterConfig[] = [
  {
    index: 0,
    background: 'corridor',
    party: [DEADZONE],
    enemies: [CASTING_PROBE_MK1],
  },
  {
    index: 1,
    background: 'loading_dock',
    party: [DEADZONE, TORC],
    enemies: [NETWORKER_ENFORCER_A, NETWORKER_ENFORCER_B],
    newPartyMember: TORC,
  },
  {
    index: 2,
    background: 'server_room',
    party: [DEADZONE, TORC, TRINETRA],
    enemies: [CASTING_PATROL_BOT_A, CASTING_PATROL_BOT_B, CASTING_PATROL_BOT_C],
    newPartyMember: TRINETRA,
  },
];
