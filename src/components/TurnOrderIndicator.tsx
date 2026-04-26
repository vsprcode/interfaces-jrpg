'use client';
import React from 'react';
import type { TurnEntry, Character, Enemy } from '@/engine/types';

interface TurnOrderIndicatorProps {
  turnQueue: TurnEntry[];
  currentTurnIndex: number;
  party: Character[];
  enemies: Enemy[];
}

export function TurnOrderIndicator({
  turnQueue,
  currentTurnIndex,
  party,
  enemies,
}: TurnOrderIndicatorProps) {
  // Show remaining entries in current round (from next turn onward)
  const upcoming = turnQueue.slice(currentTurnIndex + 1);

  if (upcoming.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        padding: '4px 8px',
        fontFamily: 'var(--font-pixel), monospace',
        fontSize: '6px',
      }}
      aria-label="upcoming turns"
    >
      <span style={{ color: '#555', marginRight: '4px' }}>NEXT:</span>
      {upcoming.map((entry, i) => {
        const combatant =
          entry.kind === 'player'
            ? party.find(c => c.id === entry.combatantId)
            : enemies.find(e => e.id === entry.combatantId);
        const label = combatant?.name ?? entry.combatantId;
        const color = entry.kind === 'player' ? 'var(--color-cyan-neon)' : '#ff4444';
        return (
          <span key={`${entry.combatantId}-${i}`} style={{ color, opacity: 0.8 }}>
            {label}
            {i < upcoming.length - 1 && (
              <span style={{ color: '#333', margin: '0 3px' }}>›</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
