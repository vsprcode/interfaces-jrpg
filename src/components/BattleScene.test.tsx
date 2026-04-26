/**
 * Integration smoke tests for BattleScene.
 * Runs in jsdom environment (see vitest.config.ts environmentMatchGlobs).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BattleScene } from '@/components/BattleScene';

describe('BattleScene', () => {
  it('renders without crashing', () => {
    expect(() => render(<BattleScene />)).not.toThrow();
  });

  it('renders a button with text ATACAR after INIT', async () => {
    render(<BattleScene />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ATACAR/i })).toBeInTheDocument();
    });
  });

  it.todo('shows DEADZONE HP bar in the party HUD');
  it.todo('shows enemy HP bar in the enemy panel');
  it.todo('renders GAME OVER screen when battle phase is GAME_OVER');
  it.todo('renders victory state when battle phase is VICTORY');
});
