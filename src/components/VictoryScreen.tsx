'use client';

import React from 'react';

interface VictoryScreenProps {
  message: string;
}

export function VictoryScreen({ message }: VictoryScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark/90 z-10">
      <h2
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          color: 'var(--color-electric)',
          fontSize: '18px',
          marginBottom: '16px',
          textAlign: 'center',
          textShadow: '0 0 12px var(--color-electric)',
        }}
      >
        MISSÃO CONCLUÍDA
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          color: 'var(--color-text-glow)',
          fontSize: '10px',
          textAlign: 'center',
          padding: '0 32px',
          lineHeight: '1.8',
        }}
      >
        {message}
      </p>
    </div>
  );
}
