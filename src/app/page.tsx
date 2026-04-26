'use client';

import { GameController } from '@/components/GameController';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--color-bg-dark, #050510)' }}
    >
      {/* Title header — ASSETS-04 */}
      <header
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          textAlign: 'center',
          marginBottom: '16px',
          userSelect: 'none',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(10px, 2vw, 18px)',
            color: 'var(--color-electric, #00BFFF)',
            textShadow: '0 0 12px rgba(0, 191, 255, 0.8), 0 0 24px rgba(0, 191, 255, 0.4)',
            letterSpacing: '0.12em',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          [In]terfaces
        </h1>
        <p
          style={{
            fontSize: 'clamp(6px, 1vw, 9px)',
            color: 'var(--color-text-glow, #7DF9FF)',
            opacity: 0.6,
            letterSpacing: '0.1em',
            margin: '6px 0 0 0',
          }}
        >
          2042 — Era Pré-Transumana
        </p>
      </header>

      {/* Game container */}
      <GameController />
    </main>
  );
}
