import { defineConfig } from 'vitest/config';

// Dedicated config for the network-dependent E2E specs. These launch real
// browsers and hit live third-party sites, so they are opt-in via `pnpm test:e2e`.
export default defineConfig({
    test: {
        globals: true,
        include: ['__tests__/e2e/**/*.test.js'],
        exclude: ['node_modules', 'dist'],
        setupFiles: ['./vitest.setup.js'],
        globalSetup: ['./vitest.global-setup.js'],
    },
});
