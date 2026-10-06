import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("./package.json");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.NODE_ENV === "production" ? "/app/" : "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Esto fuerza a usar la copia de React de tu nodo raíz
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
  },

  // === INJECT VERSION FROM package.json ===
  // This replaces __APP_VERSION__ at build time — no manual sync needed.
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },

  // === TEST CONFIGURATION ===
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    exclude: ["node_modules", "dist"],
    // Elevated to tolerate parallel (turbo) runs, where heavy flow-aware
    // setup hooks (IndexedDB shims, ScreenshotManager) legitimately exceed
    // Vitest's 10s default under load. The suite itself is ~2.6s isolated.
    hookTimeout: 30000,
  },

  // === PROXY PARA BACKEND ===
  server: {
    port: parseInt(process.env.VITE_PORT) || 5173,
    allowedHosts: ["sb-47817dtru2d5.vercel.run"],
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PORT || 2001}`,
        changeOrigin: true,
        secure: false,
      },
      "/tollai": {
        target: `http://localhost:${process.env.PORT || 2001}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
