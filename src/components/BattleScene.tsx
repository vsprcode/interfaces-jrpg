'use client';

import { useReducer, useEffect, useRef } from 'react';
import { battleReducer, initialBattleState } from '@/engine/reducer';
import { useGameStateRef } from '@/engine/gameStateRef';
import { DEADZONE } from '@/data/characters';
import { CASTING_PROBE_MK1 } from '@/data/enemies';
import { SpriteFallback } from '@/components/SpriteFallback';

/**
 * Phase 1 BattleScene shell.
 *
 * Encodes all five Phase 1 pitfall guardrails as runtime patterns:
 *   1. Strict Mode safe (Pitfall 1, QA-01): every useEffect with timer cleans up.
 *   2. Stale closure safe (Pitfall 2, QA-02): deferred reads via stateRef.current.
 *   3. Phase guard (Pitfall 4): enforced inside reducer; UI mirrors with disabled buttons.
 *   4. 'use client' (Pitfall 5, FOUND-02): top of file.
 *   5. No random values in render path (QA-04): all randomization stays in reducer or useEffect (Phase 2+).
 *
 * One-shot INIT dispatch uses useRef flag (NOT useState) — useState gets reset by
 * Strict Mode double-mount in dev; useRef survives.
 */
export function BattleScene() {
  const [state, dispatch] = useReducer(battleReducer, initialBattleState);
  const stateRef = useGameStateRef(state);

  // ── One-shot INIT (Strict Mode safe via useRef flag — RESEARCH §15.1) ──
  const initFired = useRef(false);
  useEffect(() => {
    if (initFired.current) return;
    initFired.current = true;
    dispatch({
      type: 'INIT',
      payload: { party: [DEADZONE], enemies: [CASTING_PROBE_MK1] },
    });
  }, []);

  // ── Animation gate: RESOLVING → PLAYER_INPUT after 800ms (QA-01, QA-02) ──
  useEffect(() => {
    if (state.phase !== 'RESOLVING' || !state.pendingAction) return;

    const timer = setTimeout(() => {
      // Read FRESH state via ref — not closure (Pitfall 2)
      const current = stateRef.current;
      if (current.phase === 'RESOLVING') {
        dispatch({ type: 'ACTION_RESOLVED' });
      }
    }, 800);

    // CRITICAL: cleanup on unmount/re-run (Pitfall 1, QA-01)
    return () => clearTimeout(timer);
  }, [state.phase, state.pendingAction, stateRef]);

  return (
    <main className="min-h-screen bg-bg-dark text-text-glow font-pixel p-8">
      <h1 className="text-electric text-2xl mb-4">[In]terfaces — Engine Skeleton</h1>

      <section className="mb-6 space-y-1">
        <p>Phase: <span className="text-cyan-neon">{state.phase}</span></p>
        <p>Round: {state.round}</p>
        <p>Turn queue length: {state.turnQueue.length}</p>
        <p>Log entries: {state.log.length}</p>
        <p>Pending action: {state.pendingAction ? state.pendingAction.description : '(none)'}</p>
      </section>

      <section className="mb-6 flex gap-8 items-center">
        <div>
          <p className="text-xs mb-2 text-electric">DEADZONE (player)</p>
          <SpriteFallback combatantId="DEADZONE" kind="player" />
        </div>
        <div>
          <p className="text-xs mb-2 text-electric">CASTING_PROBE_MK1 (enemy)</p>
          <SpriteFallback combatantId="CASTING_PROBE_MK1" kind="enemy" />
        </div>
      </section>

      <button
        type="button"
        className="bg-electric text-bg-dark px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={state.phase !== 'PLAYER_INPUT'}
        onClick={() => dispatch({
          type: 'PLAYER_ACTION',
          payload: { type: 'ATTACK', actorId: 'DEADZONE' },
        })}
      >
        Synthetic Action (test phase transition)
      </button>

      <pre className="mt-6 text-xs opacity-60 whitespace-pre-wrap">
        {state.log.join('\n')}
      </pre>
    </main>
  );
}
