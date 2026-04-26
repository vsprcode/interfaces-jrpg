'use client';

import React from 'react';
import styles from '@/styles/battle.module.css';

interface FloatingDamageNumberProps {
  amount: number;    // absolute positive value — display as "-{amount}" or "+{amount}"
  isHeal?: boolean;  // true → render as +N in heal color (cyan-neon)
  onDone: () => void;
}

/**
 * Absolutely positioned damage popup. Must be placed inside a `position: relative` wrapper.
 * The parent provides `key={popup.id}` (monotonic counter) to force remount on every hit,
 * restarting the CSS animation from frame 0 even on consecutive identical hits. (VISUAL-07)
 *
 * Animation: @keyframes floatDamage in battle.module.css (translateY -48px, opacity 1→0, 700ms)
 * Self-removes via onAnimationEnd callback — no setTimeout, no useEffect timer. (UI-09)
 */
export function FloatingDamageNumber({
  amount,
  isHeal = false,
  onDone,
}: FloatingDamageNumberProps) {
  const displayText = isHeal ? `+${amount}` : `-${amount}`;

  const className = [styles.damageNumber, isHeal ? styles.damageNumberHeal : '']
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={className}
      onAnimationEnd={onDone}
      aria-live="assertive"
      aria-atomic="true"
    >
      {displayText}
    </span>
  );
}
