import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoCompletedScreen } from '@/components/DemoCompletedScreen';

describe('DemoCompletedScreen', () => {
  it('renders AEGIS-7 NEUTRALIZADO text', () => {
    render(<DemoCompletedScreen onNewGame={() => {}} />);
    expect(screen.getByText('AEGIS-7 NEUTRALIZADO')).toBeTruthy();
  });

  it('renders OPERACAO INTERFACES COMPLETA text', () => {
    render(<DemoCompletedScreen onNewGame={() => {}} />);
    expect(screen.getByText('OPERACAO INTERFACES COMPLETA')).toBeTruthy();
  });

  it('renders NOVA INFILTRACAO button', () => {
    render(<DemoCompletedScreen onNewGame={() => {}} />);
    expect(screen.getByRole('button', { name: /nova infiltracao/i })).toBeTruthy();
  });

  it('calls onNewGame when NOVA INFILTRACAO is clicked', () => {
    const mockFn = vi.fn();
    render(<DemoCompletedScreen onNewGame={mockFn} />);
    fireEvent.click(screen.getByRole('button', { name: /nova infiltracao/i }));
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
