import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',          // Phase 1: pure TS engine, no DOM (FOUND-06)
    globals: true,                // Allow describe/it/expect without imports
    include: ['src/engine/**/*.test.ts'],
    coverage: {
      provider: 'v8',             // built into Node 18+
      reporter: ['text', 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/**/*.test.ts', 'src/engine/types.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
