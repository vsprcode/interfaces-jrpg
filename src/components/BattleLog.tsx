'use client';

import React, { useEffect, useRef } from 'react';

interface BattleLogProps {
  log: string[];
}

export function BattleLog({ log }: BattleLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest entry (UI-07)
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <div
      className="h-24 overflow-y-auto bg-black/40 border border-white/10 p-2 text-xs"
      style={{ fontFamily: 'var(--font-pixel), monospace' }}
      role="log"
      aria-live="polite"
      aria-label="Registro de batalha"
    >
      {log.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>...</p>
      ) : (
        log.map((entry, i) => (
          <p
            key={i}
            style={{ color: 'var(--color-text-glow)', lineHeight: '1.6', marginBottom: '4px' }}
          >
            {entry}
          </p>
        ))
      )}
      <div ref={logEndRef} />
    </div>
  );
}
