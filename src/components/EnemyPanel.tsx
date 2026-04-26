'use client';

import React from 'react';
import type { Enemy } from '@/engine/types';
import { SpriteFallback } from '@/components/SpriteFallback';
import styles from '@/styles/battle.module.css';

interface EnemyPanelProps {
  enemy: Enemy;
}

export function EnemyPanel({ enemy }: EnemyPanelProps) {
  const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0;

  const hpFillClass = [
    styles.hpBarFill,
    hpRatio < 0.3 ? styles.hpCritical : hpRatio < 0.5 ? styles.hpWarning : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Enemy name */}
      <span
        style={{
          fontSize: '10px',
          fontFamily: 'var(--font-pixel), monospace',
          color: 'var(--color-electric)',
          opacity: 0.8,
          textTransform: 'uppercase',
        }}
      >
        {enemy.name}
      </span>

      {/* Sprite with defeat state (UI-05, ASSETS-02) */}
      <div
        className={[
          'relative',
          enemy.isDefeated ? 'opacity-20 grayscale' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={enemy.isDefeated ? `${enemy.name} derrotada` : enemy.name}
      >
        <SpriteFallback combatantId={enemy.id} kind="enemy" />
        {enemy.isDefeated && (
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '8px',
              fontFamily: 'var(--font-pixel), monospace',
              color: 'var(--color-electric)',
              whiteSpace: 'nowrap',
              opacity: 1,
            }}
          >
            DEFEATED
          </span>
        )}
      </div>

      {/* Enemy HP bar (no EN bar — enemies don't show EN) */}
      <div style={{ width: '100%', maxWidth: '128px' }}>
        <div className={styles.hpBarTrack}>
          <div
            className={hpFillClass}
            style={{ width: `${hpRatio * 100}%` }}
            role="progressbar"
            aria-valuenow={enemy.hp}
            aria-valuemin={0}
            aria-valuemax={enemy.maxHp}
            aria-label={`HP de ${enemy.name}`}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '8px',
            fontFamily: 'var(--font-pixel), monospace',
            opacity: 0.6,
            marginTop: '2px',
          }}
        >
          <span>HP</span>
          <span>
            {enemy.hp}/{enemy.maxHp}
          </span>
        </div>
      </div>
    </div>
  );
}
