'use client';

import React, { useReducer, useEffect, useRef, useState } from 'react';
import { battleReducer, initialBattleState } from '@/engine/reducer';
import { useGameStateRef } from '@/engine/gameStateRef';
import { DEADZONE } from '@/data/characters';
import { CASTING_PROBE_MK1 } from '@/data/enemies';
import { ActionMenu } from '@/components/ActionMenu';
import { CharacterHUD } from '@/components/CharacterHUD';
import { EnemyPanel } from '@/components/EnemyPanel';
import { BattleLog } from '@/components/BattleLog';
import { FloatingDamageNumber } from '@/components/FloatingDamageNumber';
import { SpriteFallback } from '@/components/SpriteFallback';
import { VictoryScreen } from '@/components/VictoryScreen';
import { GameOverScreen } from '@/components/GameOverScreen';
import type { CombatantId } from '@/engine/types';
import styles from '@/styles/battle.module.css';

/**
 * BattleScene — Phase 2 fully-wired battle loop.
 *
 * Preserves all five Phase 1 pitfall guardrails:
 *   1. Strict Mode safe (Pitfall 1, QA-01): every useEffect with timer has clearTimeout cleanup.
 *   2. Stale closure safe (Pitfall 2, QA-02): all deferred reads via stateRef.current.
 *   3. Phase guard (Pitfall 4): enforced in reducer; UI mirrors with disabled buttons.
 *   4. 'use client' (Pitfall 5, FOUND-02): top of file.
 *   5. No random values in render path (QA-04): all randomization stays in reducer.
 *
 * Phase 2 additions:
 *   - All 5 child components wired (CharacterHUD, EnemyPanel, ActionMenu, BattleLog, FloatingDamageNumber)
 *   - ENEMY_TURN useEffect: dispatches ENEMY_ACTION after 600ms beat delay
 *   - Damage popup state: monotonic popupCounter, setPopups triggered on pendingAction.hpDelta
 *   - Screen flash: flashVariant 'a'|'b' toggle forces CSS animation re-trigger (VISUAL-03)
 *   - DEADZONE sprite animation state: derived from pendingAction.animationType (UI-04)
 *   - VictoryScreen and GameOverScreen rendered on terminal phases
 */

interface DamagePopup {
  id: number;
  targetId: CombatantId;
  amount: number;
  isHeal: boolean;
}

interface BattleSceneProps {
  onGameOver?: () => void;
}

export function BattleScene({ onGameOver }: BattleSceneProps = {}) {
  const [state, dispatch] = useReducer(battleReducer, initialBattleState);
  const stateRef = useGameStateRef(state);

  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const popupCounter = useRef(0);
  const [flashVariant, setFlashVariant] = useState<'a' | 'b'>('a');

  // ── One-shot INIT (Strict Mode safe via useRef flag — RESEARCH §15.1) ──────
  const initFired = useRef(false);
  useEffect(() => {
    if (initFired.current) return;
    initFired.current = true;
    dispatch({ type: 'INIT', payload: { party: [DEADZONE], enemies: [CASTING_PROBE_MK1] } });
  }, []);

  // ── Animation gate: RESOLVING → ACTION_RESOLVED after 800ms (QA-01, QA-02) ──
  // Triggers damage popups and screen flash when pendingAction has hpDelta.
  useEffect(() => {
    if (state.phase !== 'RESOLVING' || !state.pendingAction) return;

    // Trigger damage popup(s) on action resolution
    if (state.pendingAction.hpDelta && state.pendingAction.hpDelta.length > 0) {
      const newPopups = state.pendingAction.hpDelta.map(d => ({
        id: ++popupCounter.current,
        targetId: d.targetId,
        amount: Math.abs(d.amount),
        isHeal: d.amount > 0,
      }));
      setPopups(prev => [...prev, ...newPopups]);
      // VISUAL-03: variant toggle re-triggers CSS animation (class name changes → DOM diff → animation restarts)
      setFlashVariant(v => v === 'a' ? 'b' : 'a');
    }

    const timer = setTimeout(() => {
      // Read FRESH state via ref — not closed-over state (Pitfall 2, QA-02)
      const current = stateRef.current;
      if (current.phase === 'RESOLVING') {
        dispatch({ type: 'ACTION_RESOLVED' });
      }
    }, 800);

    // CRITICAL: cleanup on unmount/re-run (Pitfall 1, QA-01)
    return () => clearTimeout(timer);
  }, [state.phase, state.pendingAction, stateRef]);

  // ── ENEMY_TURN useEffect: dispatch ENEMY_ACTION after 600ms beat delay ──────
  // clearTimeout cleanup prevents Strict Mode double-fire (T-02-06-01, Pitfall F)
  useEffect(() => {
    if (state.phase !== 'ENEMY_TURN') return;

    const currentEntry = state.turnQueue[state.currentTurnIndex];
    if (!currentEntry) return;

    const enemy = state.enemies.find(e => e.id === currentEntry.combatantId);
    if (!enemy || enemy.isDefeated) {
      dispatch({ type: 'NEXT_TURN' });
      return;
    }

    const timer = setTimeout(() => {
      // Read FRESH state via ref (Pitfall 2, T-02-06-02 — stale closure prevention)
      const current = stateRef.current;
      if (current.phase === 'ENEMY_TURN') {
        dispatch({ type: 'ENEMY_ACTION', payload: { enemyId: enemy.id } });
      }
    }, 600);

    // CRITICAL: cleanup prevents Strict Mode double-fire (Pitfall 1, T-02-06-01)
    return () => clearTimeout(timer);
  }, [state.phase, state.currentTurnIndex, stateRef, state.enemies, state.turnQueue]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const deadzone = state.party[0];
  const probe = state.enemies[0];

  // UI-04: Derive DEADZONE sprite animation state from phase + pendingAction
  // Maps to data-state attribute on sprite wrapper; CSS rules in battle.module.css apply visuals.
  type SpriteState = 'idle' | 'attack' | 'skill' | 'defend' | 'hurt';
  const spriteState: SpriteState = (() => {
    if (state.phase === 'RESOLVING' && state.pendingAction) {
      if (state.pendingAction.actorId === 'DEADZONE') {
        const anim = state.pendingAction.animationType;
        if (anim === 'ATTACK') return 'attack';
        if (anim === 'SKILL_ELECTRIC') return 'skill';
        if (anim === 'DEFEND') return 'defend';
      } else {
        // Enemy is acting — DEADZONE is receiving damage
        return 'hurt';
      }
    }
    return 'idle';
  })();

  // Action dispatch handlers (wired to ActionMenu callbacks)
  const handleAttack = () => {
    if (!probe || probe.isDefeated) return;
    dispatch({
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
    });
  };

  const handleSkill = () => {
    if (!probe || probe.isDefeated) return;
    dispatch({
      type: 'PLAYER_ACTION',
      payload: { type: 'SKILL', actorId: 'DEADZONE', targetId: 'CASTING_PROBE_MK1' },
    });
  };

  const handleDefend = () => {
    dispatch({
      type: 'PLAYER_ACTION',
      payload: { type: 'DEFEND', actorId: 'DEADZONE' },
    });
  };

  const handleItem = () => {
    dispatch({
      type: 'PLAYER_ACTION',
      payload: { type: 'ITEM', actorId: 'DEADZONE', targetId: 'DEADZONE' },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const flashClass = flashVariant === 'a' ? styles.flashA : styles.flashB;

  return (
    <div
      className="relative w-full max-w-4xl mx-auto"
      style={{ aspectRatio: '16/9', fontFamily: 'var(--font-pixel), monospace' }}
    >
      {/* BG_corridor CSS gradient (ASSETS-03) */}
      <div className={`absolute inset-0 ${styles.battleBackground}`} aria-hidden="true" />

      {/* Screen flash overlay (VISUAL-03, T-02-06-04: pointer-events none so buttons stay clickable)
          key={flashVariant} forces DOM re-create → CSS animation restarts from frame 0 on each hit */}
      <div
        key={flashVariant}
        className={`absolute inset-0 ${flashClass}`}
        style={{ background: 'white', zIndex: 20 }}
        aria-hidden="true"
      />

      {/* Main battle layout: flex-col enemy / party / HUD */}
      <div className="relative flex flex-col h-full" style={{ zIndex: 10 }}>

        {/* Enemy zone — EnemyPanel satisfies UI-03 (Probe HP visible alongside CharacterHUD below) */}
        <div className="flex-1 flex items-center justify-center relative">
          {probe && (
            <div className="relative">
              <EnemyPanel enemy={probe} />
              {/* Floating damage numbers on enemy */}
              {popups
                .filter(p => p.targetId === 'CASTING_PROBE_MK1')
                .map(popup => (
                  <FloatingDamageNumber
                    key={popup.id}
                    amount={popup.amount}
                    isHeal={popup.isHeal}
                    onDone={() => setPopups(prev => prev.filter(p => p.id !== popup.id))}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Party zone — DEADZONE sprite with animation state (UI-04, ASSETS-01) */}
        <div className="flex-1 flex items-end justify-start px-4 pb-2">
          {deadzone && (
            <div className="relative flex items-end gap-4">
              {/* data-state drives CSS selectors in battle.module.css for animation (UI-04) */}
              <div
                data-state={spriteState}
                style={{ opacity: deadzone.isDefending ? 0.8 : 1 }}
              >
                <SpriteFallback combatantId="DEADZONE" kind="player" />
              </div>
              {/* Floating damage numbers on DEADZONE */}
              <div className="relative">
                {popups
                  .filter(p => p.targetId === 'DEADZONE')
                  .map(popup => (
                    <FloatingDamageNumber
                      key={popup.id}
                      amount={popup.amount}
                      isHeal={popup.isHeal}
                      onDone={() => setPopups(prev => prev.filter(p => p.id !== popup.id))}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* HUD footer: CharacterHUD + BattleLog + ActionMenu */}
        {/* CharacterHUD satisfies UI-03 (DEADZONE HP/EN visible alongside EnemyPanel above) */}
        <div
          className="flex flex-col"
          style={{
            height: '128px',
            background: 'rgba(0,0,0,0.7)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Status row: CharacterHUD (UI-03) */}
          <div
            className="flex items-center px-3 py-1 gap-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {deadzone && <CharacterHUD character={deadzone} />}
          </div>

          {/* Battle log (UI-07) */}
          <div className="flex-1 overflow-hidden px-2 py-1">
            <BattleLog log={state.log} />
          </div>

          {/* Command menu — ActionMenu handles its own PLAYER_INPUT phase guard (UI-02) */}
          {deadzone && (
            <ActionMenu
              phase={state.phase}
              actor={deadzone}
              items={state.items}
              onAttack={handleAttack}
              onSkill={handleSkill}
              onDefend={handleDefend}
              onItem={handleItem}
            />
          )}
        </div>
      </div>

      {/* Victory overlay (END-02 partial) */}
      {state.phase === 'VICTORY' && (
        <VictoryScreen message="Probe MK-I neutralizada. Corredor 7-A desobstruído." />
      )}

      {/* Game over overlay (END-02, END-03, END-04) */}
      {state.phase === 'GAME_OVER' && (
        <GameOverScreen onRetry={onGameOver ?? (() => {})} />
      )}
    </div>
  );
}
