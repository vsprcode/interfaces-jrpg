import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',          // Default: pure TS engine tests run in Node (fast, no DOM overhead)
    globals: true,                // Allow describe/it/expect without imports
    include: ['src/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [
      ['src/components/**/*.test.tsx', 'jsdom'],
      ['src/engine/gameStateRef.test.ts', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',             // built into Node 18+
      reporter: ['text', 'html'],
      include: ['src/engine/**/*.ts', 'src/components/**/*.tsx'],
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
