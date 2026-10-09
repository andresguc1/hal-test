import { defineConfig } from 'vitest/config';

// Network-dependent E2E specs live under __tests__/e2e and are excluded from
// the default unit run (they require live third-party sites + real browsers).
// Run them explicitly with `pnpm test:e2e`.
export default defineConfig({
    test: {
        globals: true,
        include: ['__tests__/**/*.test.js'],
        exclude: ['node_modules', 'dist', 'tests/**/*', '__tests__/e2e/**'],
        setupFiles: ['./vitest.setup.js'],
        globalSetup: ['./vitest.global-setup.js'],
    },
});
