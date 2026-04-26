'use client';

interface GameOverScreenProps {
  onRetry: () => void;
}

export function GameOverScreen({ onRetry }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-dark/95 z-10">
      <h2
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          color: 'var(--color-danger, #ff1744)',
          fontSize: '18px',
          marginBottom: '16px',
          textAlign: 'center',
          textShadow: '0 0 12px rgba(255,23,68,0.8)',
        }}
      >
        GAME OVER
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          color: 'var(--color-text-glow)',
          fontSize: '10px',
          textAlign: 'center',
          padding: '0 32px',
          lineHeight: '1.8',
          marginBottom: '32px',
        }}
      >
        DEADZONE eliminada. A resistência analógica recua.
      </p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          fontFamily: 'var(--font-pixel), monospace',
          fontSize: '10px',
          padding: '8px 24px',
          border: '1px solid var(--color-electric, #00bfff)',
          color: 'var(--color-electric, #00bfff)',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'background 150ms, color 150ms',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-electric, #00bfff)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-bg-dark, #050510)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-electric, #00bfff)';
        }}
      >
        TENTAR NOVAMENTE
      </button>
    </div>
  );
}
