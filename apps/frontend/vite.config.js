import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("./package.json");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/app/",
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
  },

  // === PROXY PARA BACKEND ===
  server: {
    port: parseInt(process.env.VITE_PORT) || 5173,
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PORT || 2001}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
