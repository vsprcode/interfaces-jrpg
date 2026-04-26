'use client';

import React, { useEffect, useState } from 'react';
import type { BattlePhase, Character } from '@/engine/types';

type SkillSelectStep =
  | { step: 'none' }
  | { step: 'pick_target' }
  | { step: 'pick_effect'; targetId: string };

interface ActionMenuProps {
  phase: BattlePhase;
  actor: Character;
  party: Character[];
  items: { nanoMed: number };
  onAttack: () => void;
  onSkill: () => void;
  onDefend: () => void;
  onItem: () => void;
  onSkillWithTarget: (targetId: string, variant: 'HEAL' | 'REMOVE_STATUS') => void;
}

export function ActionMenu({
  phase,
  actor,
  party,
  items,
  onAttack,
  onSkill,
  onDefend,
  onItem,
  onSkillWithTarget,
}: ActionMenuProps) {
  const isInputPhase = phase === 'PLAYER_INPUT';
  const canSkill = isInputPhase && actor.en >= 8;
  const canItem = isInputPhase && items.nanoMed > 0;

  // SkillSelectStep: local state machine for TRINETRA's two-step skill flow
  const [skillSelect, setSkillSelect] = useState<SkillSelectStep>({ step: 'none' });

  // Pitfall 5: reset SkillSelectStep when phase changes away from PLAYER_INPUT (T-03-06-01)
  useEffect(() => {
    if (phase !== 'PLAYER_INPUT') {
      setSkillSelect({ step: 'none' });
    }
  }, [phase]);

  // Override HABILIDADE click: TRINETRA enters pick_target mode; others call onSkill
  const handleSkillClick = () => {
    if (actor.id === 'TRINETRA') {
      setSkillSelect({ step: 'pick_target' });
    } else {
      onSkill();
    }
  };

  // Keyboard shortcuts 1-4 (UI-02) — re-bind when phase or gate conditions change.
  // CRITICAL: cleanup on unmount/re-run (Pitfall 1 / T-02-04-04 mitigation)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // T-02-04-01: phase guard — no-op when not in input phase
      if (!isInputPhase) return;
      if (e.key === '1') onAttack();
      if (e.key === '2' && canSkill) handleSkillClick();
      if (e.key === '3') onDefend();
      if (e.key === '4' && canItem) onItem();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isInputPhase, canSkill, canItem, onAttack, onSkill, onDefend, onItem, actor.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="flex flex-col gap-1"
      role="toolbar"
      aria-label="Comandos de batalha"
    >
      {/* Target picker overlay for TRINETRA — pick_target step */}
      {skillSelect.step === 'pick_target' && (
        <div style={{ display: 'flex', gap: '8px', padding: '4px', alignItems: 'center' }}>
          <span style={{ color: '#aaa', fontSize: '7px', fontFamily: 'var(--font-pixel), monospace' }}>ALVO:</span>
          {party.filter(c => !c.isDefeated).map(c => (
            <button
              key={c.id}
              onClick={() => setSkillSelect({ step: 'pick_effect', targetId: c.id })}
              style={{ fontSize: '7px', padding: '4px 8px', border: '1px solid #444', background: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'var(--font-pixel), monospace' }}
            >
              {c.name} ({c.hp}/{c.maxHp}HP)
            </button>
          ))}
          <button
            onClick={() => setSkillSelect({ step: 'none' })}
            style={{ fontSize: '7px', color: '#666', background: 'none', border: '1px solid #333', cursor: 'pointer', fontFamily: 'var(--font-pixel), monospace' }}
          >
            CANCELAR
          </button>
        </div>
      )}

      {/* Effect picker overlay for TRINETRA — pick_effect step */}
      {skillSelect.step === 'pick_effect' && (
        <div style={{ display: 'flex', gap: '8px', padding: '4px', alignItems: 'center' }}>
          <span style={{ color: '#aaa', fontSize: '7px', fontFamily: 'var(--font-pixel), monospace' }}>EFEITO:</span>
          <button
            onClick={() => {
              onSkillWithTarget(skillSelect.targetId, 'HEAL');
              setSkillSelect({ step: 'none' });
            }}
            style={{ fontSize: '7px', padding: '4px 8px', border: '1px solid var(--color-cyan-neon)', background: 'none', color: 'var(--color-cyan-neon)', cursor: 'pointer', fontFamily: 'var(--font-pixel), monospace' }}
          >
            CURAR
          </button>
          <button
            onClick={() => {
              onSkillWithTarget(skillSelect.targetId, 'REMOVE_STATUS');
              setSkillSelect({ step: 'none' });
            }}
            style={{ fontSize: '7px', padding: '4px 8px', border: '1px solid #ff9900', background: 'none', color: '#ff9900', cursor: 'pointer', fontFamily: 'var(--font-pixel), monospace' }}
          >
            LIMPAR STATUS
          </button>
          <button
            onClick={() => setSkillSelect({ step: 'pick_target' })}
            style={{ fontSize: '7px', color: '#666', background: 'none', border: '1px solid #333', cursor: 'pointer', fontFamily: 'var(--font-pixel), monospace' }}
          >
            VOLTAR
          </button>
        </div>
      )}

      {/* Main command buttons */}
      <div className="flex gap-2 p-2">
        {/* T-02-04-02: disabled attribute prevents button spam when phase changes */}
        <button
          type="button"
          disabled={!isInputPhase}
          onClick={onAttack}
          className="px-3 py-1 text-xs bg-electric text-bg-dark disabled:opacity-40 disabled:cursor-not-allowed font-pixel"
        >
          ATACAR
        </button>

        <button
          type="button"
          disabled={!canSkill}
          onClick={handleSkillClick}
          className="px-3 py-1 text-xs bg-cyan-neon text-bg-dark disabled:opacity-40 disabled:cursor-not-allowed font-pixel"
        >
          HABILIDADE
        </button>

        <button
          type="button"
          disabled={!isInputPhase}
          onClick={onDefend}
          className="px-3 py-1 text-xs border border-electric text-electric disabled:opacity-40 disabled:cursor-not-allowed font-pixel"
        >
          DEFENDER
        </button>

        <button
          type="button"
          disabled={!canItem}
          onClick={onItem}
          className="px-3 py-1 text-xs border border-cyan-neon text-cyan-neon disabled:opacity-40 disabled:cursor-not-allowed font-pixel"
        >
          ITEM
        </button>
      </div>
    </div>
  );
}
