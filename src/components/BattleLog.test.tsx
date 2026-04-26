/**
 * Tests for BattleLog component.
 * Runs in jsdom environment (see vitest.config.ts environmentMatchGlobs).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BattleLog } from '@/components/BattleLog';

describe('BattleLog', () => {
  it('renders all log entries passed as props', () => {
    const log = [
      'Encontro iniciado.',
      'DEADZONE encontra brecha no firewall — 16 de dano',
    ];
    render(<BattleLog log={log} />);

    expect(screen.getByText('Encontro iniciado.')).toBeTruthy();
    expect(
      screen.getByText('DEADZONE encontra brecha no firewall — 16 de dano'),
    ).toBeTruthy();
  });

  it('renders empty state when log array is empty', () => {
    // Should mount without throwing
    render(<BattleLog log={[]} />);
    // Placeholder text is rendered for empty state
    expect(screen.getByText('...')).toBeTruthy();
  });

  it('renders most recent entry last (array order matches DOM order)', () => {
    const log = ['first', 'second', 'third'];
    render(<BattleLog log={log} />);

    expect(screen.getByText('first')).toBeTruthy();
    expect(screen.getByText('second')).toBeTruthy();
    expect(screen.getByText('third')).toBeTruthy();

    // Verify DOM order: first should appear before second, second before third
    const logEl = screen.getByRole('log');
    const paragraphs = Array.from(logEl.querySelectorAll('p'));
    const texts = paragraphs.map((p) => p.textContent);
    expect(texts[0]).toBe('first');
    expect(texts[1]).toBe('second');
    expect(texts[2]).toBe('third');
  });
});
