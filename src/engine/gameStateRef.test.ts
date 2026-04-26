/**
 * Tests for useGameStateRef hook.
 * Runs in jsdom environment (see vitest.config.ts environmentMatchGlobs).
 *
 * Closes 0% coverage gap deferred from Phase 1.
 */
import { renderHook, act } from '@testing-library/react';
import { useGameStateRef } from './gameStateRef';
import type { BattleState } from './types';

/** Minimal BattleState fixture for testing */
function makeBattleState(overrides: Partial<BattleState> = {}): BattleState {
  return {
    phase: 'INIT',
    party: [],
    enemies: [],
    turnQueue: [],
    currentTurnIndex: 0,
    round: 0,
    pendingAction: null,
    log: [],
    items: { nanoMed: 1 },
    overdrivePending: false,
    ...overrides,
  };
}

describe('useGameStateRef', () => {
  it('ref reflects initial state', () => {
    const initialState = makeBattleState({ phase: 'INIT' });
    const { result } = renderHook(() => useGameStateRef(initialState));

    expect(result.current.current.phase).toBe('INIT');
  });

  it('ref updates when state changes', () => {
    const initialState = makeBattleState({ phase: 'INIT' });
    const { result, rerender } = renderHook(
      ({ state }: { state: BattleState }) => useGameStateRef(state),
      { initialProps: { state: initialState } }
    );

    expect(result.current.current.phase).toBe('INIT');

    const updatedState = makeBattleState({ phase: 'PLAYER_INPUT' });
    act(() => {
      rerender({ state: updatedState });
    });

    expect(result.current.current.phase).toBe('PLAYER_INPUT');
  });

  it('ref object is stable (same reference) across renders', () => {
    const initialState = makeBattleState({ phase: 'INIT' });
    const { result, rerender } = renderHook(
      ({ state }: { state: BattleState }) => useGameStateRef(state),
      { initialProps: { state: initialState } }
    );

    const refBeforeRerender = result.current;

    const updatedState = makeBattleState({ phase: 'ENEMY_TURN' });
    act(() => {
      rerender({ state: updatedState });
    });

    // The ref object identity must be stable — same object reference
    expect(result.current).toBe(refBeforeRerender);
  });
});
