import { useRef, useEffect } from 'react';
import type { BattleState } from './types';

/**
 * Mirrors current battle state into a ref so deferred callbacks (setTimeout,
 * setInterval, AI handlers, animation completion) read the LATEST state, not
 * the value captured by closure at the time the callback was scheduled.
 *
 * This is the canonical fix for Pitfall 2 (stale closures) and the foundation
 * for AI-05 (AI reads via gameStateRef, not closure).
 *
 * Usage in BattleScene:
 *   const [state, dispatch] = useReducer(battleReducer, initialBattleState);
 *   const stateRef = useGameStateRef(state);
 *
 *   setTimeout(() => {
 *     const current = stateRef.current; // ALWAYS fresh
 *     if (current.phase === 'RESOLVING') {
 *       dispatch({ type: 'ACTION_RESOLVED' });
 *     }
 *   }, 800);
 */
export function useGameStateRef(state: BattleState) {
  const ref = useRef<BattleState>(state);
  useEffect(() => {
    ref.current = state;
  }, [state]);
  return ref;
}
