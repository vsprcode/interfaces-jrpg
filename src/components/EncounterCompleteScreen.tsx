'use client';

import type { Character } from '@/engine/types';

const NARRATIVES: Record<number, string> = {
  0: 'Corredor 7-A desobstruído. TORC emerge das sombras.',
  1: 'Doca de Carga limpa. TRINETRA sincroniza com o grupo.',
};

interface EncounterCompleteProps {
  party: Character[];
  encounterIndex: number; // the encounter that just completed
  onContinue: () => void;
}

export function EncounterCompleteScreen({ party, encounterIndex, onContinue }: EncounterCompleteProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,10,0.95)', fontFamily: 'var(--font-pixel), monospace', zIndex: 50 }}
    >
      <p style={{ color: 'var(--color-electric)', fontSize: '10px', marginBottom: '24px' }}>
        ENCOUNTER COMPLETE
      </p>
      <p style={{ color: 'var(--color-text-glow)', fontSize: '7px', marginBottom: '32px', textAlign: 'center', maxWidth: '400px' }}>
        {NARRATIVES[encounterIndex] ?? ''}
      </p>
      <div style={{ marginBottom: '32px' }}>
        {party.map(c => (
          <div key={c.id} style={{ color: '#aaa', fontSize: '7px', marginBottom: '8px' }}>
            {c.name}: {c.hp}/{c.maxHp} HP
          </div>
        ))}
      </div>
      <button
        onClick={onContinue}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') onContinue(); }}
        style={{
          background: 'none',
          border: '1px solid var(--color-electric)',
          color: 'var(--color-electric)',
          fontSize: '8px',
          padding: '8px 16px',
          cursor: 'pointer',
          fontFamily: 'var(--font-pixel), monospace',
        }}
      >
        CONTINUAR
      </button>
    </div>
  );
}
