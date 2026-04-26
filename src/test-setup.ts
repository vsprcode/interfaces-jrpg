// Vitest setup: extend expect with @testing-library/jest-dom matchers
// (toBeDisabled, toBeInTheDocument, toHaveAttribute, etc.)
import '@testing-library/jest-dom';

// jsdom does not implement scrollIntoView — mock it globally so components
// that call element.scrollIntoView() (e.g. BattleLog auto-scroll) do not throw.
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}
