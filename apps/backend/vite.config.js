// vite.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // 🚨 Habilita 'describe', 'it', 'expect' globalmente
        globals: true,

        // 🌐 Usa el entorno de Node.js para pruebas de backend
        environment: 'node',

        // 🔍 Busca los tests en la carpeta __tests__ con extensión .js
        testMatch: ['**/__tests__/**/*.js'],

        // ⚙️ Asegura compatibilidad con dependencias tipo ESM
        deps: {
            inline: ['supertest'],
        },

        // (Opcional) Si surgen errores de importaciones
        // transformMode: { web: [/\.js$/] },
    },
});
