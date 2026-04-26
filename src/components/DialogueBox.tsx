'use client';
import React, { useState, useEffect, useCallback } from 'react';

export interface DialogueLine {
  speaker: string;
  text: string;
}

interface DialogueBoxProps {
  lines: DialogueLine[];
  onComplete: () => void;
}

export function DialogueBox({ lines, onComplete }: DialogueBoxProps) {
  const [currentLine, setCurrentLine] = useState(0);

  const advance = useCallback(() => {
    if (currentLine >= lines.length - 1) {
      onComplete();
    } else {
      setCurrentLine(l => l + 1);
    }
  }, [currentLine, lines.length, onComplete]);

  // T-03-06-02: keyboard listener with cleanup to prevent leak
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [advance]);

  const line = lines[currentLine];
  if (!line) return null;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-end"
      style={{ background: 'rgba(0,0,10,0.85)', fontFamily: 'var(--font-pixel), monospace', zIndex: 60, cursor: 'pointer' }}
      onClick={advance}
      role="dialog"
      aria-modal="true"
      aria-label="dialogue"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          background: 'rgba(0,5,20,0.95)',
          border: '1px solid var(--color-electric)',
          padding: '16px',
          marginBottom: '24px',
        }}
      >
        <p style={{ color: 'var(--color-electric)', fontSize: '8px', marginBottom: '8px' }}>
          {line.speaker}
        </p>
        <p style={{ color: 'var(--color-text-glow)', fontSize: '7px', lineHeight: '1.8' }}>
          {line.text}
        </p>
        <p style={{ color: 'var(--color-text-glow)', fontSize: '6px', marginTop: '12px', textAlign: 'right' }}>
          {currentLine + 1}/{lines.length} ▶ CLIQUE OU ESPAÇO
        </p>
      </div>
    </div>
  );
}
