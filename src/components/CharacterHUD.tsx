'use client';

import React from 'react';
import type { Character, StatusEffectType } from '@/engine/types';
import styles from '@/styles/battle.module.css';

const STATUS_ICON_MAP: Record<StatusEffectType, string> = {
  DEF_BUFF: 'SHIELD',
  OVERDRIVE_CHARGE: 'TERMINUS',
  DEFENDING: 'GUARD',
};

interface CharacterHUDProps {
  character: Character;
}

export function CharacterHUD({ character }: CharacterHUDProps) {
  const hpRatio = character.hp / character.maxHp;
  const enRatio = character.en / character.maxEn;

  // HP bar color threshold — composed via CSS Module class names (VISUAL-01: no hex in component)
  const hpBarClass = [
    styles.hpBarFill,
    hpRatio < 0.3 ? styles.hpCritical : hpRatio < 0.5 ? styles.hpWarning : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {/* Name row + defending badge */}
      <div className="flex items-center gap-2">
        <span className="text-electric text-xs font-pixel truncate">
          {character.name}
        </span>
        {character.isDefending && (
          <span className={styles.defendingBadge}>DEF</span>
        )}
      </div>

      {/* HP row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-glow opacity-60 w-4 shrink-0 font-pixel">
          HP
        </span>
        <div className={styles.hpBarTrack}>
          <div
            className={hpBarClass}
            style={{ width: `${hpRatio * 100}%` }}
            role="progressbar"
            aria-valuenow={character.hp}
            aria-valuemin={0}
            aria-valuemax={character.maxHp}
            aria-label={`HP de ${character.name}`}
          />
        </div>
        <span className="text-xs text-text-glow font-pixel shrink-0">
          {character.hp}/{character.maxHp}
        </span>
      </div>

      {/* EN row */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-glow opacity-60 w-4 shrink-0 font-pixel">
          EN
        </span>
        <div className={styles.enBarTrack}>
          <div
            className={styles.enBarFill}
            style={{ width: `${enRatio * 100}%` }}
            role="progressbar"
            aria-valuenow={character.en}
            aria-valuemin={0}
            aria-valuemax={character.maxEn}
            aria-label={`EN de ${character.name}`}
          />
        </div>
        <span className="text-xs text-text-glow font-pixel shrink-0">
          {character.en}/{character.maxEn}
        </span>
      </div>

      {/* Status effects row — ASSETS-06 (CSS text icons) */}
      {character.statusEffects.length > 0 && (
        <div className={styles.statusRow}>
          {character.statusEffects.map((effect, i) => (
            <span
              key={`${effect.type}-${i}`}
              className={styles.statusBadge}
              data-type={effect.type}
            >
              {STATUS_ICON_MAP[effect.type]} {effect.turnsRemaining}T
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
