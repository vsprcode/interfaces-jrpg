import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DialogueBox } from './DialogueBox';

const lines = [
  { speaker: 'TORC', text: 'Você sobreviveu ao corredor. Impressionante para um Ghost.' },
  { speaker: 'DEADZONE', text: 'Forge Wall primeiro. Perguntas depois.' },
];

describe('DialogueBox', () => {
  it('renders first line on mount', () => {
    render(<DialogueBox lines={lines} onComplete={() => {}} />);
    expect(screen.getByText('TORC')).toBeTruthy();
    expect(screen.getByText(lines[0]!.text)).toBeTruthy();
  });

  it('advances to next line on click', () => {
    render(<DialogueBox lines={lines} onComplete={() => {}} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.getByText('DEADZONE')).toBeTruthy();
    expect(screen.getByText(lines[1]!.text)).toBeTruthy();
  });

  it('calls onComplete when last line is advanced past', () => {
    const onComplete = vi.fn();
    render(<DialogueBox lines={lines} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('dialog')); // line 1 → line 2
    fireEvent.click(screen.getByRole('dialog')); // line 2 → onComplete
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('renders nothing when lines array is empty', () => {
    const { container } = render(<DialogueBox lines={[]} onComplete={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
