// src/engine/types.ts

// ── Identity ──────────────────────────────────────────────────────────────
export type CharacterId = 'DEADZONE' | 'TORC' | 'TRINETRA';
export type EnemyId =
  | 'CASTING_PROBE_MK1'
  | 'NETWORKER_ENFORCER_A'
  | 'NETWORKER_ENFORCER_B'
  | 'CASTING_PATROL_BOT_A'
  | 'CASTING_PATROL_BOT_B'
  | 'CASTING_PATROL_BOT_C'
  | 'AEGIS_7';
export type CombatantId = CharacterId | EnemyId;

// ── Status effects ────────────────────────────────────────────────────────
export type StatusEffectType =
  | 'DEF_BUFF'         // TORC's Forge Wall (+8 DEF, 2 turns)
  | 'OVERDRIVE_CHARGE' // AEGIS-7 charging TERMINUS
  | 'DEFENDING';       // player chose DEFEND this turn

export interface StatusEffect {
  type: StatusEffectType;
  turnsRemaining: number;
  magnitude?: number;
  appliedBy?: CombatantId;
}

// ── Combatant base ────────────────────────────────────────────────────────
interface CombatantBase {
  id: CombatantId;
  name: string;
  hp: number;
  maxHp: number;
  en: number;
  maxEn: number;
  atk: number;
  def: number;
  spd: number;
  statusEffects: StatusEffect[];
  isDefeated: boolean;
}

export interface Character extends CombatantBase {
  kind: 'player';
  id: CharacterId;
  isDefending: boolean;
}

export interface Enemy extends CombatantBase {
  kind: 'enemy';
  id: EnemyId;
  behavior: EnemyBehaviorType;
  isOverdriveActive?: boolean;
}

export type Combatant = Character | Enemy;

// ── Turn queue ────────────────────────────────────────────────────────────
export interface TurnEntry {
  combatantId: CombatantId;
  kind: 'player' | 'enemy';
  spd: number; // snapshot at queue-build time
}

// ── Enemy AI ──────────────────────────────────────────────────────────────
export type EnemyBehaviorType =
  | 'ALWAYS_ATTACK'
  | 'TARGET_LOWEST_HP'
  | 'ATTACK_RANDOM'
  | 'OVERDRIVE_BOSS';

// ── Battle phase (discriminated union) ────────────────────────────────────
export type BattlePhase =
  | 'INIT'
  | 'PLAYER_INPUT'
  | 'RESOLVING'
  | 'ENEMY_TURN'
  | 'VICTORY'
  | 'GAME_OVER';

// ── Resolved actions (logic → UI bridge) ──────────────────────────────────
export type AnimationType =
  | 'ATTACK'
  | 'DEFEND'
  | 'ITEM'
  | 'SKILL_ELECTRIC'
  | 'SKILL_SHIELD'
  | 'SKILL_HEAL'
  | 'OVERDRIVE_WARNING'
  | 'OVERDRIVE_TERMINUS';

export interface HpDelta { targetId: CombatantId; amount: number; }
export interface EnDelta { targetId: CombatantId; amount: number; }
export interface StatusApplied { targetId: CombatantId; effect: StatusEffect; }
export interface StatusRemoved { targetId: CombatantId; effectType: StatusEffectType; }

export interface ResolvedAction {
  actorId: CombatantId;
  description: string;
  hpDelta?: HpDelta[];
  enDelta?: EnDelta[];
  statusApplied?: StatusApplied[];
  statusRemoved?: StatusRemoved[];
  animationType: AnimationType;
}

// ── Player actions (input from UI to reducer) ─────────────────────────────
export type PlayerActionType = 'ATTACK' | 'SKILL' | 'DEFEND' | 'ITEM';

export interface PlayerAction {
  type: PlayerActionType;
  actorId: CharacterId;
  targetId?: CombatantId;
  skillVariant?: 'HEAL' | 'REMOVE_STATUS';
}

// ── Top-level battle state ────────────────────────────────────────────────
export interface BattleState {
  phase: BattlePhase;
  party: Character[];
  enemies: Enemy[];
  turnQueue: TurnEntry[];
  currentTurnIndex: number;
  round: number;
  pendingAction: ResolvedAction | null;
  log: string[];
  items: { nanoMed: number };
}

// ── Reducer action union ──────────────────────────────────────────────────
export type Action =
  | { type: 'INIT'; payload: { party: Character[]; enemies: Enemy[] } }
  | { type: 'PLAYER_ACTION'; payload: PlayerAction }
  | { type: 'ENEMY_ACTION'; payload: { enemyId: EnemyId } }
  | { type: 'ACTION_RESOLVED' }
  | { type: 'NEXT_TURN' }
  | { type: 'CHECK_END_CONDITIONS' };
