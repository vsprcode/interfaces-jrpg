/**
 * Tests for GameOverScreen component.
 * Runs in jsdom environment (see vitest.config.ts environmentMatchGlobs).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { GameOverScreen } from '@/components/GameOverScreen';

describe('GameOverScreen', () => {
  it('renders GAME OVER text', () => {
    render(<GameOverScreen onRetry={vi.fn()} />);
    expect(screen.getByText(/GAME OVER/i)).toBeInTheDocument();
  });

  it('renders TENTAR NOVAMENTE retry button', () => {
    render(<GameOverScreen onRetry={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /TENTAR NOVAMENTE/i })
    ).toBeInTheDocument();
  });

  it('clicking TENTAR NOVAMENTE calls onRetry', () => {
    const onRetry = vi.fn();
    render(<GameOverScreen onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /TENTAR NOVAMENTE/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
