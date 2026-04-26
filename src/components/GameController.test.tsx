/**
 * Unit tests for GameController phase transitions.
 * Tests OPENING_DIALOGUE and CLOSING_DIALOGUE phases (NARR-01).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock BattleScene to avoid jsdom canvas/animation issues
vi.mock('@/components/BattleScene', () => ({
  BattleScene: ({ onVictory, onGameOver }: { onVictory: (p: unknown[]) => void; onGameOver: () => void }) => (
    <div data-testid="battle-scene">
      <button onClick={() => onVictory([])}>sim-victory</button>
      <button onClick={onGameOver}>sim-gameover</button>
    </div>
  ),
}));

// Mock EncounterCompleteScreen
vi.mock('@/components/EncounterCompleteScreen', () => ({
  EncounterCompleteScreen: ({ onContinue }: { onContinue: () => void }) => (
    <div data-testid="encounter-complete">
      <button onClick={onContinue}>continue</button>
    </div>
  ),
}));

// Mock DemoCompletedScreen
vi.mock('@/components/DemoCompletedScreen', () => ({
  DemoCompletedScreen: ({ onNewGame }: { onNewGame: () => void }) => (
    <div data-testid="demo-completed">
      <button onClick={onNewGame}>NOVA INFILTRACAO</button>
    </div>
  ),
}));

import { GameController } from './GameController';

describe('GameController — OPENING_DIALOGUE and CLOSING_DIALOGUE phases', () => {
  it('Test 1: initial controllerPhase is OPENING_DIALOGUE (DialogueBox visible, BattleScene hidden)', () => {
    render(<GameController />);
    // DialogueBox should be present (shows SISTEMA speaker from OPENING_DIALOGUE_LINES)
    expect(screen.getByRole('dialog')).toBeTruthy();
    // BattleScene should NOT be present
    expect(screen.queryByTestId('battle-scene')).toBeNull();
  });

  it('Test 2: after handleOpeningComplete fires, controllerPhase becomes BATTLE', () => {
    render(<GameController />);
    // Click through all 4 opening dialogue lines to trigger onComplete
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog); // line 0 → line 1
    fireEvent.click(dialog); // line 1 → line 2
    fireEvent.click(dialog); // line 2 → line 3
    fireEvent.click(dialog); // line 3 → onComplete (handleOpeningComplete)
    // Now BattleScene should be visible
    expect(screen.getByTestId('battle-scene')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Test 3: after handleVictory with encounterIndex=3, controllerPhase becomes CLOSING_DIALOGUE', () => {
    render(<GameController />);
    // Click through opening dialogue to get to BATTLE
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    fireEvent.click(dialog);
    fireEvent.click(dialog);
    fireEvent.click(dialog);
    // Now in BATTLE (encounter 0). Simulate victories to reach encounter 3
    // Victory 0 → ENCOUNTER_2_DIALOGUE
    fireEvent.click(screen.getByText('sim-victory'));
    // Click through E2 dialogue (3 lines)
    fireEvent.click(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('dialog'));
    // Now in BATTLE (encounter 1). Victory 1 → ENCOUNTER_3_DIALOGUE
    fireEvent.click(screen.getByText('sim-victory'));
    // Click through E3 dialogue (3 lines)
    fireEvent.click(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('dialog'));
    // Now in BATTLE (encounter 2). Victory 2 → ENCOUNTER_4_DIALOGUE
    fireEvent.click(screen.getByText('sim-victory'));
    // Click through E4 dialogue (3 lines)
    fireEvent.click(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('dialog'));
    fireEvent.click(screen.getByRole('dialog'));
    // Now in BATTLE (encounter 3). Victory 3 → CLOSING_DIALOGUE
    fireEvent.click(screen.getByText('sim-victory'));
    // CLOSING_DIALOGUE: DialogueBox should be visible, DemoCompletedScreen hidden
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByTestId('demo-completed')).toBeNull();
  });

  it('Test 4: after handleClosingComplete fires, controllerPhase becomes DEMO_COMPLETED', () => {
    render(<GameController />);
    // Navigate to CLOSING_DIALOGUE
    const skipToClosing = () => {
      // Opening
      const d = screen.getByRole('dialog');
      fireEvent.click(d); fireEvent.click(d); fireEvent.click(d); fireEvent.click(d);
      // E1 victory → E2 dialogue
      fireEvent.click(screen.getByText('sim-victory'));
      const d2 = screen.getByRole('dialog');
      fireEvent.click(d2); fireEvent.click(d2); fireEvent.click(d2);
      // E2 victory → E3 dialogue
      fireEvent.click(screen.getByText('sim-victory'));
      const d3 = screen.getByRole('dialog');
      fireEvent.click(d3); fireEvent.click(d3); fireEvent.click(d3);
      // E3 victory → E4 dialogue
      fireEvent.click(screen.getByText('sim-victory'));
      const d4 = screen.getByRole('dialog');
      fireEvent.click(d4); fireEvent.click(d4); fireEvent.click(d4);
      // E4 victory → CLOSING_DIALOGUE
      fireEvent.click(screen.getByText('sim-victory'));
    };
    skipToClosing();
    // Click through all 4 closing dialogue lines
    const closing = screen.getByRole('dialog');
    fireEvent.click(closing); // line 0 → line 1
    fireEvent.click(closing); // line 1 → line 2
    fireEvent.click(closing); // line 2 → line 3
    fireEvent.click(closing); // line 3 → onComplete (handleClosingComplete)
    // DemoCompletedScreen should now be visible
    expect(screen.getByTestId('demo-completed')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Test 5: handleNewGame resets controllerPhase to OPENING_DIALOGUE (not BATTLE)', () => {
    render(<GameController />);
    // Navigate to DEMO_COMPLETED via full flow
    const d = screen.getByRole('dialog');
    fireEvent.click(d); fireEvent.click(d); fireEvent.click(d); fireEvent.click(d);
    fireEvent.click(screen.getByText('sim-victory'));
    const d2 = screen.getByRole('dialog');
    fireEvent.click(d2); fireEvent.click(d2); fireEvent.click(d2);
    fireEvent.click(screen.getByText('sim-victory'));
    const d3 = screen.getByRole('dialog');
    fireEvent.click(d3); fireEvent.click(d3); fireEvent.click(d3);
    fireEvent.click(screen.getByText('sim-victory'));
    const d4 = screen.getByRole('dialog');
    fireEvent.click(d4); fireEvent.click(d4); fireEvent.click(d4);
    fireEvent.click(screen.getByText('sim-victory'));
    const closing = screen.getByRole('dialog');
    fireEvent.click(closing); fireEvent.click(closing); fireEvent.click(closing); fireEvent.click(closing);
    // Now in DEMO_COMPLETED
    expect(screen.getByTestId('demo-completed')).toBeTruthy();
    // Click NOVA INFILTRACAO → handleNewGame → should go back to OPENING_DIALOGUE
    fireEvent.click(screen.getByText('NOVA INFILTRACAO'));
    // DialogueBox should be visible again (OPENING_DIALOGUE)
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByTestId('battle-scene')).toBeNull();
    expect(screen.queryByTestId('demo-completed')).toBeNull();
  });
});
