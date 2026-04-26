import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TurnOrderIndicator } from './TurnOrderIndicator';
import type { TurnEntry, Character, Enemy } from '@/engine/types';

// Minimal test fixtures
const makeChar = (id: 'DEADZONE' | 'TORC', spd: number): Character => ({
  kind: 'player', id, name: id, hp: 50, maxHp: 50, en: 20, maxEn: 20,
  atk: 10, def: 5, spd, statusEffects: [], isDefeated: false, isDefending: false,
});
const makeEnemy = (id: 'NETWORKER_ENFORCER_A', spd: number): Enemy => ({
  kind: 'enemy', id, name: 'Enforcer A', hp: 55, maxHp: 55, en: 0, maxEn: 0,
  atk: 16, def: 8, spd, statusEffects: [], isDefeated: false, behavior: 'TARGET_LOWEST_HP',
});

describe('TurnOrderIndicator', () => {
  it('renders remaining queue entries from currentTurnIndex+1', () => {
    const queue: TurnEntry[] = [
      { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
      { combatantId: 'TORC', kind: 'player', spd: 12 },
      { combatantId: 'NETWORKER_ENFORCER_A', kind: 'enemy', spd: 11 },
    ];
    const party = [makeChar('DEADZONE', 18), makeChar('TORC', 12)];
    const enemies = [makeEnemy('NETWORKER_ENFORCER_A', 11)];
    // currentTurnIndex = 0 (DEADZONE acting), so upcoming = [TORC, Enforcer A]
    render(<TurnOrderIndicator turnQueue={queue} currentTurnIndex={0} party={party} enemies={enemies} />);
    expect(screen.getByText('TORC')).toBeTruthy();
    expect(screen.getByText('Enforcer A')).toBeTruthy();
    // DEADZONE (current) should NOT appear
    expect(screen.queryByText('NEXT:')).toBeTruthy();
  });

  it('renders nothing when no upcoming entries', () => {
    const queue: TurnEntry[] = [
      { combatantId: 'DEADZONE', kind: 'player', spd: 18 },
    ];
    const { container } = render(
      <TurnOrderIndicator
        turnQueue={queue}
        currentTurnIndex={0}
        party={[makeChar('DEADZONE', 18)]}
        enemies={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
