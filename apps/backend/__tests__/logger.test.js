// __tests__/logger.test.js (Totalmente compatible con ESM Nativos usando Vitest)

// 1. Importar funciones de Vitest
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';

// 2. Importar módulos de Node.js y dependencias de NPM
import path from 'path';
import fs from 'fs/promises';
import request from 'supertest';
import express from 'express';

// 3. Importar el logger local (asume exportaciones nombradas en logger.js)
import { developmentLogger } from '../middlewares/logger.js';

// -------------------------------------------------------------
// Mocks y Setup
// -------------------------------------------------------------
const testLogDir = path.join(process.cwd(), '__test_logs');

// Función Auxiliar para crear una app aislada
const createTestApp = (loggerMiddleware) => {
    const app = express();
    app.use(loggerMiddleware);

    app.get('/test-log', (req, res) => {
        res.status(200).send('OK');
    });

    return app;
};

// -------------------------------------------------------------
// Hooks de Ciclo de Vida
// -------------------------------------------------------------
beforeAll(async () => {
    // Asegurarse de que el directorio de logs de prueba esté limpio (por si más tarde pruebas productionLogger)
    await fs.rm(testLogDir, { recursive: true, force: true });
});

let stdoutWriteSpy;
afterEach(() => {
    // Limpiar el estado de los mocks después de cada prueba
    vi.clearAllMocks();
    if (stdoutWriteSpy) {
        stdoutWriteSpy.mockRestore();
        stdoutWriteSpy = undefined;
    }
});

afterAll(async () => {
    // Asegurarse de limpiar el directorio de logs de prueba al finalizar
    await fs.rm(testLogDir, { recursive: true, force: true });
});

// -------------------------------------------------------------
// PRUEBAS
// -------------------------------------------------------------
describe('Logger Middleware (Morgan)', () => {
    describe('Development Logger ("dev" format)', () => {
        it('debe escribir logs en stdout (formato "dev")', async () => {
            // Espiar process.stdout.write (Morgan escribe en el stream, no en console.log)
            stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

            // Crea la app con el logger de desarrollo
            const app = createTestApp(developmentLogger());

            // Envía la solicitud
            await request(app).get('/test-log');

            // Verificar que process.stdout.write fue llamado al menos una vez
            expect(stdoutWriteSpy).toHaveBeenCalled();

            // Buscar en las llamadas una que incluya el método/route y el status
            const anyCallContains = stdoutWriteSpy.mock.calls.some((call) => {
                const chunk = String(call[0]); // primer argumento es el chunk escrito
                return chunk.includes('GET /test-log') && /200/.test(chunk);
            });

            expect(anyCallContains).toBe(true);
        });
    });

    // Comentario: si quieres probar productionLogger, lo ideal es mockear fs.createWriteStream
    // o inyectar la ruta de logs en el módulo para escribir a un directorio temporal.
});
