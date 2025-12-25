// __tests__/security.test.js

// Usando las funciones globales de Vitest (asumiendo globals: true en vitest.config.js)
// Si globals: false, debes importar: import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
// Importación del paquete base para crear un limitador de prueba
import rateLimit from 'express-rate-limit';
// Importa el middleware de Helmet
import { helmetMiddleware } from '../middlewares/security.js';

// -------------------------------------------------------------
// Función Auxiliar para crear una app aislada
// -------------------------------------------------------------
const createTestApp = (middleware) => {
    const app = express();

    // ⚠️ CRUCIAL: Solo aplica el middleware que se está probando.
    app.use(middleware);

    // Una ruta de prueba que siempre responde 200
    app.get('/secure', (req, res) => {
        res.status(200).json({ message: 'Acceso concedido' });
    });

    // ⚠️ Importante: El manejador de errores debe ir al final, no el rateLimiter
    // No añadimos el errorHandler aquí para mantener el test aislado y solo verificar el 429.

    return app;
};

// -------------------------------------------------------------
// PRUEBAS DE SEGURIDAD CON HELMET
// -------------------------------------------------------------

describe('Middleware de Seguridad (Helmet)', () => {
    let app;

    beforeAll(() => {
        // Creamos la app con el middleware de Helmet
        app = createTestApp(helmetMiddleware);
    });

    it('debe establecer la cabecera X-Content-Type-Options: nosniff', async () => {
        const response = await request(app).get('/secure');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('debe establecer la cabecera X-Frame-Options: SAMEORIGIN o DENY (según config)', async () => {
        const response = await request(app).get('/secure');
        expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('debe ocultar la cabecera X-Powered-By', async () => {
        const response = await request(app).get('/secure');
        expect(response.headers['x-powered-by']).toBeUndefined();
    });

    it('debe establecer la cabecera Strict-Transport-Security (HSTS)', async () => {
        const response = await request(app).get('/secure');
        expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });
});

// -------------------------------------------------------------
// PRUEBAS DE RATE LIMITING (apiLimiter)
// -------------------------------------------------------------

describe('Middleware de Limitación de Tasa (Rate Limiter)', () => {
    let app;

    beforeAll(() => {
        // Creamos un limitador con un MAX bajo para la prueba (solo 2 solicitudes)
        const testLimiter = rateLimit({
            windowMs: 1000, // 1 segundo (ventana corta)
            max: 2, // Límite de 2 solicitudes
            standardHeaders: true,
            legacyHeaders: false,
            // Mensaje de error para verificar la respuesta 429
            message: (req, res) => {
                res.status(429).json({
                    success: false,
                    error: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo después de 15 minutos.',
                });
            },
        });

        // La función 'createTestApp' ahora recibe la función middleware VÁLIDA
        app = createTestApp(testLimiter);
    });

    // Este test debe ser síncrono para verificar el consumo del límite
    it('debe permitir las solicitudes iniciales (1 y 2)', async () => {
        // Solicitud 1 (permitida)
        let response1 = await request(app).get('/secure');
        expect(response1.statusCode).toBe(200);
        expect(response1.headers['ratelimit-remaining']).toBe('1'); // Queda 1

        // Solicitud 2 (permitida)
        let response2 = await request(app).get('/secure');
        expect(response2.statusCode).toBe(200);
        expect(response2.headers['ratelimit-remaining']).toBe('0'); // Queda 0
    });

    it('debe bloquear la tercera solicitud y devolver 429', async () => {
        // Asegurar que el límite se ha consumido antes de este test
        // Hacemos 2 llamadas extra antes de la tercera para garantizar que la ventana se respete entre tests
        await request(app).get('/secure'); // Llamada N-1
        await request(app).get('/secure'); // Llamada N-2

        // Solicitud 3 (Bloqueada: 429 Too Many Requests)
        const response = await request(app).get('/secure');

        expect(response.statusCode).toBe(429);
        expect(response.body.error).toContain('Demasiadas solicitudes');
        expect(response.headers['retry-after']).toBeDefined();
        expect(response.headers['ratelimit-remaining']).toBe('0');
    });
});
