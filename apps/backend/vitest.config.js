import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: ['__tests__/**/*.test.js'],
        exclude: ['node_modules', 'dist', 'tests/**/*'],
    },
});
