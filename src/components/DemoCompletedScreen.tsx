'use client';

import React from 'react';

interface DemoCompletedScreenProps {
  onNewGame: () => void;
}

export function DemoCompletedScreen({ onNewGame }: DemoCompletedScreenProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{
        background: 'rgba(10, 0, 16, 0.96)',
        zIndex: 50,
        fontFamily: 'var(--font-pixel), monospace',
      }}
      role="main"
      aria-label="Demo Completa"
    >
      {/* ASCII art block */}
      <pre
        style={{
          color: '#ff0080',
          fontSize: '8px',
          lineHeight: 1.6,
          textAlign: 'center',
          textShadow: '0 0 8px rgba(255, 0, 128, 0.6)',
          marginBottom: '24px',
          whiteSpace: 'pre',
        }}
        aria-hidden="true"
      >
{`
 ██████╗  ██████╗██╗
██╔══██╗██╔════╝╚═╝
███████║█████╗  ██╗
██╔══██║██╔══╝  ╚═╝
██║  ██║██████╗ ██╗
╚═╝  ╚═╝╚═════╝ ╚═╝
  7 — NEUTRALIZADO
`}
      </pre>

      <p
        style={{
          color: '#00ffff',
          fontSize: '10px',
          textAlign: 'center',
          marginBottom: '8px',
          letterSpacing: '0.1em',
          textShadow: '0 0 8px rgba(0, 255, 255, 0.5)',
        }}
      >
        AEGIS-7 NEUTRALIZADO
      </p>

      <p
        style={{
          color: '#aaaaaa',
          fontSize: '7px',
          textAlign: 'center',
          marginBottom: '32px',
          letterSpacing: '0.08em',
        }}
      >
        OPERACAO INTERFACES COMPLETA
      </p>

      <p
        style={{
          color: '#666',
          fontSize: '7px',
          textAlign: 'center',
          marginBottom: '24px',
          fontStyle: 'italic',
        }}
      >
        A resistência analógica persiste. O sistema ainda controla.
      </p>

      <button
        type="button"
        onClick={onNewGame}
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: '9px',
          padding: '10px 20px',
          background: 'none',
          border: '1px solid #ff0080',
          color: '#ff0080',
          cursor: 'pointer',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        NOVA INFILTRACAO
      </button>
    </div>
  );
}
