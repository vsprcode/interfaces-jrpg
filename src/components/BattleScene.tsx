'use client';

import React, { useReducer, useEffect, useRef, useState } from 'react';
import { battleReducer, initialBattleState } from '@/engine/reducer';
import { useGameStateRef } from '@/engine/gameStateRef';
import { ActionMenu } from '@/components/ActionMenu';
import { CharacterHUD } from '@/components/CharacterHUD';
import { EnemyPanel } from '@/components/EnemyPanel';
import { BattleLog } from '@/components/BattleLog';
import { FloatingDamageNumber } from '@/components/FloatingDamageNumber';
import { SpriteFallback } from '@/components/SpriteFallback';
import { GameOverScreen } from '@/components/GameOverScreen';
import { TurnOrderIndicator } from '@/components/TurnOrderIndicator';
import type { Character, Enemy, CombatantId } from '@/engine/types';
import styles from '@/styles/battle.module.css';

/**
 * BattleScene — Phase 3 fully-parameterized battle loop.
 *
 * Preserves all five Phase 1 pitfall guardrails:
 *   1. Strict Mode safe (Pitfall 1, QA-01): every useEffect with timer has clearTimeout cleanup.
 *   2. Stale closure safe (Pitfall 2, QA-02): all deferred reads via stateRef.current.
 *   3. Phase guard (Pitfall 4): enforced in reducer; UI mirrors with disabled buttons.
 *   4. 'use client' (Pitfall 5, FOUND-02): top of file.
 *   5. No random values in render path (QA-04): all randomization stays in reducer.
 *
 * Phase 3 changes:
 *   - BattleSceneProps extended: party, enemies, encounterIndex, onVictory, onGameOver
 *   - INIT dispatch uses props (not hardcoded DEADZONE/CASTING_PROBE_MK1)
 *   - onVictory called via stateRef.current.party (Pitfall 4 — stale closure guard)
 *   - handleAttack/handleSkill/handleDefend/handleItem all actor-aware via turnQueue
 *   - VictoryScreen removed — GameController handles post-victory flow
 *   - Background variant applied via encounterIndex
 */

interface DamagePopup {
  id: number;
  targetId: CombatantId;
  amount: number;
  isHeal: boolean;
}

interface BattleSceneProps {
  party: Character[];
  enemies: Enemy[];
  encounterIndex: number;
  onVictory: (finalParty: Character[]) => void;
  onGameOver: () => void;
}

export function BattleScene({ party, enemies, encounterIndex, onVictory, onGameOver }: BattleSceneProps) {
  const [state, dispatch] = useReducer(battleReducer, initialBattleState);
  const stateRef = useGameStateRef(state);

  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const popupCounter = useRef(0);
  const [flashVariant, setFlashVariant] = useState<'a' | 'b'>('a');

  // ── One-shot INIT using props (Strict Mode safe via useRef flag — RESEARCH §15.1) ──
  const initFired = useRef(false);
  useEffect(() => {
    if (initFired.current) return;
    initFired.current = true;
    dispatch({ type: 'INIT', payload: { party, enemies } });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentionally runs once

  // ── VICTORY phase effect — HP carry-over via stateRef (Pitfall 4 — stale closure guard) ──
  // T-03-04-02: use stateRef.current.party, not closed-over state, to avoid stale party ref
  useEffect(() => {
    if (state.phase === 'VICTORY') {
      onVictory(stateRef.current.party);
    }
  }, [state.phase, onVictory, stateRef]);

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
  // Current actor derived from turn queue (not hardcoded to DEADZONE)
  const currentEntry = state.turnQueue[state.currentTurnIndex];
  const currentActor = state.party.find(c => c.id === currentEntry?.combatantId && !c.isDefeated)
    ?? state.party.find(c => !c.isDefeated)
    ?? state.party[0];

  // UI-04: Derive sprite animation state from phase + pendingAction
  // Maps to data-state attribute on sprite wrapper; CSS rules in battle.module.css apply visuals.
  type SpriteState = 'idle' | 'attack' | 'skill' | 'defend' | 'hurt';
  const getSpriteState = (characterId: string): SpriteState => {
    if (state.phase === 'RESOLVING' && state.pendingAction) {
      if (state.pendingAction.actorId === characterId) {
        const anim = state.pendingAction.animationType;
        if (anim === 'ATTACK') return 'attack';
        if (anim === 'SKILL_ELECTRIC' || anim === 'SKILL_SHIELD' || anim === 'SKILL_HEAL') return 'skill';
        if (anim === 'DEFEND') return 'defend';
      } else if (state.pendingAction.hpDelta?.some(d => d.targetId === characterId)) {
        return 'hurt';
      }
    }
    return 'idle';
  };

  // Action dispatch handlers (wired to ActionMenu callbacks)
  // All handlers derive current actor from turnQueue (not hardcoded actorId)
  const handleAttack = () => {
    const entry = state.turnQueue[state.currentTurnIndex];
    const actor = state.party.find(c => c.id === entry?.combatantId && !c.isDefeated);
    if (!actor) return;
    const aliveEnemy = state.enemies.find(e => !e.isDefeated);
    if (!aliveEnemy) return;
    dispatch({
      type: 'PLAYER_ACTION',
      payload: { type: 'ATTACK', actorId: actor.id, targetId: aliveEnemy.id },
    });
  };

  const handleSkill = () => {
    const entry = state.turnQueue[state.currentTurnIndex];
    const actor = state.party.find(c => c.id === entry?.combatantId);
    if (!actor) return;
    if (actor.id === 'TORC') {
      dispatch({ type: 'PLAYER_ACTION', payload: { type: 'SKILL', actorId: 'TORC' } });
    } else if (actor.id === 'DEADZONE') {
      const aliveEnemy = state.enemies.find(e => !e.isDefeated);
      if (!aliveEnemy) return;
      dispatch({ type: 'PLAYER_ACTION', payload: { type: 'SKILL', actorId: 'DEADZONE', targetId: aliveEnemy.id } });
    }
    // TRINETRA: handled via skill picker in Plan 03-06 — no-op for now
  };

  const handleDefend = () => {
    const entry = state.turnQueue[state.currentTurnIndex];
    const actor = state.party.find(c => c.id === entry?.combatantId);
    if (!actor) return;
    dispatch({ type: 'PLAYER_ACTION', payload: { type: 'DEFEND', actorId: actor.id } });
  };

  const handleItem = () => {
    const entry = state.turnQueue[state.currentTurnIndex];
    const actor = state.party.find(c => c.id === entry?.combatantId);
    if (!actor) return;
    dispatch({ type: 'PLAYER_ACTION', payload: { type: 'ITEM', actorId: actor.id, targetId: actor.id } });
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  const flashClass = flashVariant === 'a' ? styles.flashA : styles.flashB;

  // Background variant by encounter index (ASSETS-03)
  const bgVariants = ['corridor', 'loading_dock', 'server_room'] as const;
  const bgKey = bgVariants[encounterIndex] ?? 'corridor';
  const bgClass = [
    styles.battleBackground,
    bgKey === 'loading_dock' ? styles.bg_loading_dock : undefined,
    bgKey === 'server_room' ? styles.bg_server_room : undefined,
  ].filter(Boolean).join(' ');

  return (
    <div
      className="relative w-full max-w-4xl mx-auto"
      style={{ aspectRatio: '16/9', fontFamily: 'var(--font-pixel), monospace' }}
    >
      {/* Background gradient variant by encounter (ASSETS-03) */}
      <div className={`absolute inset-0 ${bgClass}`} aria-hidden="true" />

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

        {/* Enemy zone — EnemyPanel(s) satisfy UI-03 */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 relative">
          {/* Turn order indicator — shows remaining queue from currentTurnIndex+1 (UI-08) */}
          <TurnOrderIndicator
            turnQueue={state.turnQueue}
            currentTurnIndex={state.currentTurnIndex}
            party={state.party}
            enemies={state.enemies}
          />
          <div className="flex items-center justify-center gap-8 w-full">
            {state.enemies.map(enemy => (
              <div key={enemy.id} className="relative">
                <EnemyPanel enemy={enemy} />
                {/* Floating damage numbers on each enemy */}
                {popups
                  .filter(p => p.targetId === enemy.id)
                  .map(popup => (
                    <FloatingDamageNumber
                      key={popup.id}
                      amount={popup.amount}
                      isHeal={popup.isHeal}
                      onDone={() => setPopups(prev => prev.filter(p => p.id !== popup.id))}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Party zone — character sprites with animation states (UI-04, ASSETS-01) */}
        <div className="flex-1 flex items-end justify-start px-4 pb-2 gap-4">
          {state.party.map(character => (
            <div key={character.id} className="relative flex items-end gap-2">
              {/* data-state drives CSS selectors in battle.module.css for animation (UI-04) */}
              <div
                data-state={getSpriteState(character.id)}
                style={{ opacity: character.isDefending ? 0.8 : 1 }}
              >
                <SpriteFallback combatantId={character.id} kind="player" />
              </div>
              {/* Floating damage/heal numbers on each party member */}
              <div className="relative">
                {popups
                  .filter(p => p.targetId === character.id)
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
          ))}
        </div>

        {/* HUD footer: CharacterHUD(s) + BattleLog + ActionMenu */}
        <div
          className="flex flex-col"
          style={{
            height: '128px',
            background: 'rgba(0,0,0,0.7)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {/* Status row: all CharacterHUDs (UI-03) */}
          <div
            className="flex items-center px-3 py-1 gap-4 overflow-x-auto"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {state.party.map(character => (
              <CharacterHUD key={character.id} character={character} />
            ))}
          </div>

          {/* Battle log (UI-07) */}
          <div className="flex-1 overflow-hidden px-2 py-1">
            <BattleLog log={state.log} />
          </div>

          {/* Command menu — ActionMenu handles its own PLAYER_INPUT phase guard (UI-02) */}
          {currentActor && (
            <ActionMenu
              phase={state.phase}
              actor={currentActor}
              items={state.items}
              onAttack={handleAttack}
              onSkill={handleSkill}
              onDefend={handleDefend}
              onItem={handleItem}
            />
          )}
        </div>
      </div>

      {/* Game over overlay (END-02, END-03, END-04) */}
      {state.phase === 'GAME_OVER' && (
        <GameOverScreen onRetry={onGameOver} />
      )}
    </div>
  );
}
