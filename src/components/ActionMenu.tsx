'use client';

import React, { useEffect } from 'react';
import type { BattlePhase, Character } from '@/engine/types';

interface ActionMenuProps {
  phase: BattlePhase;
  actor: Character;
  items: { nanoMed: number };
  onAttack: () => void;
  onSkill: () => void;
  onDefend: () => void;
  onItem: () => void;
}

export function ActionMenu({
  phase,
  actor,
  items,
  onAttack,
  onSkill,
  onDefend,
  onItem,
}: ActionMenuProps) {
  const isInputPhase = phase === 'PLAYER_INPUT';
  const canSkill = isInputPhase && actor.en >= 8;
  const canItem = isInputPhase && items.nanoMed > 0;

  // Keyboard shortcuts 1-4 (UI-02) — re-bind when phase or gate conditions change.
  // CRITICAL: cleanup on unmount/re-run (Pitfall 1 / T-02-04-04 mitigation)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // T-02-04-01: phase guard — no-op when not in input phase
      if (!isInputPhase) return;
      if (e.key === '1') onAttack();
      if (e.key === '2' && canSkill) onSkill();
      if (e.key === '3') onDefend();
      if (e.key === '4' && canItem) onItem();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isInputPhase, canSkill, canItem, onAttack, onSkill, onDefend, onItem]);

  return (
    <div
      className="flex gap-2 p-2"
      role="toolbar"
      aria-label="Comandos de batalha"
    >
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
        onClick={onSkill}
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
  );
}
