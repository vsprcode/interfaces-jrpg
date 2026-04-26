/**
 * Tests for ActionMenu component.
 * Runs in jsdom environment (see vitest.config.ts environmentMatchGlobs).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Character, BattlePhase } from '@/engine/types';
import { ActionMenu } from '@/components/ActionMenu';

// ── Fixtures ──────────────────────────────────────────────────────────────

function makeActor(overrides: Partial<Character> = {}): Character {
  return {
    id: 'DEADZONE',
    kind: 'player',
    name: 'DEADZONE',
    hp: 95,
    maxHp: 95,
    en: 25,
    maxEn: 25,
    atk: 22,
    def: 10,
    spd: 18,
    statusEffects: [],
    isDefeated: false,
    isDefending: false,
    ...overrides,
  };
}

function renderMenu(overrides: {
  phase?: BattlePhase;
  actor?: Character;
  items?: { nanoMed: number };
  onAttack?: () => void;
  onSkill?: () => void;
  onDefend?: () => void;
  onItem?: () => void;
} = {}) {
  const props = {
    phase: overrides.phase ?? 'PLAYER_INPUT',
    actor: overrides.actor ?? makeActor(),
    items: overrides.items ?? { nanoMed: 1 },
    onAttack: overrides.onAttack ?? vi.fn(),
    onSkill: overrides.onSkill ?? vi.fn(),
    onDefend: overrides.onDefend ?? vi.fn(),
    onItem: overrides.onItem ?? vi.fn(),
  };
  return { ...render(<ActionMenu {...props} />), ...props };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('ActionMenu', () => {
  it('renders 4 action buttons: ATACAR, HABILIDADE, DEFENDER, ITEM', () => {
    renderMenu({ phase: 'PLAYER_INPUT', actor: makeActor({ en: 25 }), items: { nanoMed: 1 } });
    expect(screen.getByText('ATACAR')).toBeInTheDocument();
    expect(screen.getByText('HABILIDADE')).toBeInTheDocument();
    expect(screen.getByText('DEFENDER')).toBeInTheDocument();
    expect(screen.getByText('ITEM')).toBeInTheDocument();
  });

  it('all buttons are disabled when phase is RESOLVING', () => {
    renderMenu({ phase: 'RESOLVING' });
    expect(screen.getByText('ATACAR')).toBeDisabled();
    expect(screen.getByText('HABILIDADE')).toBeDisabled();
    expect(screen.getByText('DEFENDER')).toBeDisabled();
    expect(screen.getByText('ITEM')).toBeDisabled();
  });

  it('HABILIDADE button is disabled when character EN is less than 8', () => {
    renderMenu({ phase: 'PLAYER_INPUT', actor: makeActor({ en: 7 }) });
    expect(screen.getByText('HABILIDADE')).toBeDisabled();
    expect(screen.getByText('ATACAR')).not.toBeDisabled();
  });

  it('HABILIDADE button is enabled when character EN is 8 or more', () => {
    renderMenu({ phase: 'PLAYER_INPUT', actor: makeActor({ en: 8 }) });
    expect(screen.getByText('HABILIDADE')).not.toBeDisabled();
  });

  it('ITEM button is disabled when nanoMed count is 0', () => {
    renderMenu({ phase: 'PLAYER_INPUT', items: { nanoMed: 0 } });
    expect(screen.getByText('ITEM')).toBeDisabled();
  });

  it('keyboard shortcut 1 fires ATACAR action', async () => {
    const user = userEvent.setup();
    const onAttack = vi.fn();
    renderMenu({ onAttack });
    await user.keyboard('{1}');
    expect(onAttack).toHaveBeenCalledTimes(1);
  });

  it('keyboard shortcut 2 does not call onSkill when EN < 8', async () => {
    const user = userEvent.setup();
    const onSkill = vi.fn();
    renderMenu({ actor: makeActor({ en: 7 }), onSkill });
    await user.keyboard('{2}');
    expect(onSkill).not.toHaveBeenCalled();
  });

  it('no keyboard handler fires when phase is not PLAYER_INPUT', async () => {
    const user = userEvent.setup();
    const onAttack = vi.fn();
    renderMenu({ phase: 'RESOLVING', onAttack });
    await user.keyboard('{1}');
    expect(onAttack).not.toHaveBeenCalled();
  });
});
