import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Generated output, never linted: build bundles, Playwright report/traces
  // and test-results all contain minified third-party code.
  globalIgnores([
    "dist",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    // Build/test tooling runs in Node, not the browser: it needs the node
    // globals the browser block below does not provide.
    "vite.config.js",
    "vitest.setup.js",
  ]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        __APP_VERSION__: "readonly", // Injected by Vite define at build time
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^[A-Z_]|^motion$",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Playwright specs and Node-side test fixtures run in Node, so they need
    // the node globals on top of the browser ones.
    files: ["e2e/**/*.js", "test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
