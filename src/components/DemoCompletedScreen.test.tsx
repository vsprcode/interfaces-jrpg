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

  it('renders "Próximo capítulo em breve..." tagline (NARR-06)', () => {
    render(<DemoCompletedScreen onNewGame={() => {}} />);
    expect(screen.getByText(/próximo capítulo em breve/i)).toBeTruthy();
  });

  it('tagline is not aria-hidden (narrative content for assistive tech)', () => {
    render(<DemoCompletedScreen onNewGame={() => {}} />);
    const taglineEl = screen.getByText(/próximo capítulo em breve/i);
    expect(taglineEl.getAttribute('aria-hidden')).toBeNull();
  });

  it('tagline appears between the italic line and the button', () => {
    const { container } = render(<DemoCompletedScreen onNewGame={() => {}} />);
    const allPs = container.querySelectorAll('p');
    const texts = Array.from(allPs).map(p => p.textContent ?? '');
    const italicIdx = texts.findIndex(t => t.includes('A resistência analógica persiste'));
    const taglineIdx = texts.findIndex(t => /próximo capítulo em breve/i.test(t));
    expect(italicIdx).toBeGreaterThanOrEqual(0);
    expect(taglineIdx).toBeGreaterThan(italicIdx);
    const button = container.querySelector('button');
    const taglineNode = Array.from(container.querySelectorAll('p'))[taglineIdx] as Element | undefined;
    if (button && taglineNode) {
      const allNodes = Array.from(container.querySelectorAll('*'));
      const btnIdx = allNodes.indexOf(button);
      const taglineNodeIdx = allNodes.indexOf(taglineNode);
      expect(taglineNodeIdx).toBeLessThan(btnIdx);
    }
  });
});
