'use client';

/**
 * CharacterSprite — renders pixel-art sprites for player characters and AEGIS-7.
 *
 * Sprites are extracted 48×64px frames from the reference sprite sheets,
 * stored as transparent PNGs in /public/sprites/.
 *
 * Layout:
 *   {id}_idle.png   — single 48×64 PARAR DIREITA frame  (player) or ESQUERDA (boss)
 *   {id}_attack.png — 96×64 strip: two ATAQUE frames side-by-side
 *
 * Scale:
 *   Player characters: 2× → 96×128px display
 *   AEGIS-7 boss:      3× → 144×192px display
 *
 * State mapping:
 *   'idle'   → idle PNG, no filter
 *   'attack' → attack strip, CSS steps(2) animation
 *   'skill'  → idle PNG, hue-rotate+brightness filter
 *   'defend' → idle PNG, desaturate+darken filter
 *   'hurt'   → idle PNG, brightness flash filter
 */

import React, { type CSSProperties } from 'react';
import styles from '@/styles/character-sprite.module.css';

/** Characters that have real sprite assets. Others fall through to SpriteFallback. */
const SPRITE_IDS: Record<string, string> = {
  DEADZONE: 'deadzone',
  TORC:     'torc',
  TRINETRA: 'trinetra',
  AEGIS_7:  'aegis7',
};

export type SpriteState = 'idle' | 'attack' | 'skill' | 'defend' | 'hurt';

interface Props {
  characterId: string;
  state: SpriteState;
  /** 'boss' renders at 3× scale (144×192) instead of 2× (96×128). */
  kind?: 'player' | 'boss';
}

/** Returns true if this characterId has a real sprite asset. */
export function hasSprite(characterId: string): boolean {
  return characterId in SPRITE_IDS;
}

export function CharacterSprite({ characterId, state, kind = 'player' }: Props) {
  const spriteKey = SPRITE_IDS[characterId];
  if (!spriteKey) return null;

  const isBoss = kind === 'boss';
  const isAttacking = state === 'attack';

  // CSS filter based on combat state
  const filterClass =
    state === 'hurt'   ? styles.hurtFilter   :
    state === 'defend' ? styles.defendFilter  :
    state === 'skill'  ? styles.skillFilter   :
    undefined;

  // ── Attack animation (CSS background-position steps) ──
  if (isAttacking) {
    const attackClass = isBoss ? styles.attackBoss : styles.attackPlayer;
    return (
      <div
        className={[attackClass, filterClass].filter(Boolean).join(' ')}
        style={{
          backgroundImage: `url('/sprites/${spriteKey}_attack.png')`,
        } as CSSProperties}
        role="img"
        aria-label={characterId}
      />
    );
  }

  // ── Idle / skill / defend / hurt (static frame with optional filter) ──
  const idleClass = isBoss ? styles.idleBoss : styles.idlePlayer;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/sprites/${spriteKey}_idle.png`}
      className={[idleClass, filterClass].filter(Boolean).join(' ')}
      alt={characterId}
      draggable={false}
    />
  );
}
