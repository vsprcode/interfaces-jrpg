import React, { type CSSProperties } from 'react';
import styles from '@/styles/sprite-fallback.module.css';
import type { CombatantId } from '@/engine/types';

const COLOR_BY_ID: Record<string, string> = {
  DEADZONE:           '#00BFFF', // electric blue
  TORC:               '#FFD700', // gold
  TRINETRA:           '#7DF9FF', // cyan glow
  CASTING_PROBE_MK1:  '#FF1744', // red
  NETWORKER_ENFORCER: '#FF6E00', // orange
  CASTING_PATROL_BOT: '#FF1744',
  AEGIS_7:            '#FF00FF', // magenta — boss
};

interface Props {
  combatantId: CombatantId;
  kind: 'player' | 'enemy' | 'boss';
}

export function SpriteFallback({ combatantId, kind }: Props) {
  const glow = COLOR_BY_ID[combatantId] ?? '#00BFFF';
  return (
    <div
      className={styles.sprite}
      data-kind={kind}
      style={{ '--glow': glow } as CSSProperties}
      role="img"
      aria-label={combatantId}
    />
  );
}
