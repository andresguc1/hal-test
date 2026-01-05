import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Esto fuerza a usar la copia de React de tu nodo raíz
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
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
