// __tests__/errorHandler.test.js

import request from 'supertest';
import express from 'express';
// ⬇️ Importar el middleware a probar
import errorHandler from '../middlewares/errorHandler.js';

// -------------------------------------------------------------
// Función Auxiliar para crear una app aislada
// -------------------------------------------------------------
const createTestApp = (errorToThrow) => {
    const app = express();

    // Necesario para que la app sepa parsear JSON
    app.use(express.json());

    // 1. Ruta que lanza el error que queremos probar
    app.get('/error-test', (req, res, next) => {
        // Lanza el error usando next(error)
        return next(errorToThrow);
    });

    // 2. Middleware de Fallback 404 (para asegurar que los errores son capturados antes)
    app.use((req, res) => {
        res.status(404).send('Not Found');
    });

    // 3. Manejador de Errores (DEBE IR ÚLTIMO)
    app.use(errorHandler);

    return app;
};

// -------------------------------------------------------------
// PRUEBAS
// -------------------------------------------------------------

describe('ErrorHandler Middleware', () => {
    // 🎯 NUEVO: Prueba de error 500 en modo Desarrollo (debe mostrar stack)
    it('debe capturar errores sin statusCode y devolver 500 con stack en desarrollo', async () => {
        const genericError = new Error('Memory leak detected.');

        // Asegurar modo desarrollo
        process.env.NODE_ENV = 'development';
        const app = createTestApp(genericError);

        const response = await request(app).get('/error-test');

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        // En desarrollo, debe devolver el mensaje específico
        expect(response.body.error).toBe('Memory leak detected.');
        // En desarrollo, debe incluir el stack trace
        expect(response.body.stack).toBeDefined();
    });

    // Simular un error de Servidor Interno (500) en modo Producción
    it('debe capturar errores sin statusCode y devolver 500 generico en produccion', async () => {
        const genericError = new Error('Database connection failed.');

        // Simular modo producción para verificar el mensaje genérico
        process.env.NODE_ENV = 'production';
        const app = createTestApp(genericError);

        const response = await request(app).get('/error-test');

        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        // Debe devolver el mensaje genérico en producción
        expect(response.body.error).toBe(
            'Error interno del servidor. Intente nuevamente más tarde.',
        );
        // No debe incluir el stack trace en producción
        expect(response.body.stack).toBeUndefined();

        // Volver a modo desarrollo para las pruebas siguientes
        process.env.NODE_ENV = 'development';
    });

    // Simular un error personalizado (ej: 401 Unauthorized o 404 de servicio interno)
    it('debe capturar errores con statusCode adjunto (401)', async () => {
        const authError = new Error('Access denied. Invalid token.');
        authError.statusCode = 401; // Error personalizado

        const app = createTestApp(authError);

        const response = await request(app).get('/error-test');

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Access denied. Invalid token.');
        expect(response.body.status).toBe(401);
    });

    // Simular un error de Validación (400) que incluye la propiedad 'details'
    it('debe capturar errores de validacion (400) y devolver los detalles', async () => {
        const validationError = new Error('Error de validación de datos en la solicitud.');
        validationError.statusCode = 400;
        validationError.details = [{ field: 'url', message: 'La URL es obligatoria.' }]; // Detalle del validator.js

        const app = createTestApp(validationError);

        const response = await request(app).get('/error-test');

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Error de validación de datos en la solicitud.');
        expect(response.body.details).toBeDefined();
        expect(response.body.details[0].field).toBe('url');
    });

    // 🎯 NUEVO: Simular un error típico de Playwright (Timeouts o selectores inválidos)
    it('debe manejar errores de Playwright que no son de validacion y devolver 500', async () => {
        // Playwright a menudo lanza errores de tipo 'Error' con un mensaje largo
        // y sin 'statusCode', lo que debería llevar a un 500.
        const playwrightError = new Error(
            'Timeout 30000ms exceeded. Waiting for selector "button.login" failed.',
        );

        const app = createTestApp(playwrightError);

        const response = await request(app).get('/error-test');

        // El manejador debe clasificarlo como un 500 genérico si no tiene status code
        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        // En modo desarrollo, debe mostrar el mensaje de error específico
        expect(response.body.error).toBe(
            'Timeout 30000ms exceeded. Waiting for selector "button.login" failed.',
        );
        expect(response.body.stack).toBeDefined(); // Asumiendo modo desarrollo
    });

    // 🎯 NUEVO: Simular un error de Playwright (Page closed) con un tipo de error personalizado (si se usa)
    it('debe manejar errores que no son de la clase Error si el manejador lo permite', async () => {
        // Simulación de un objeto de error (no una instancia de Error)
        const customObjectError = {
            message: 'Browser context was closed suddenly.',
            name: 'BrowserError',
        };

        const app = createTestApp(customObjectError);

        const response = await request(app).get('/error-test');

        // Debería caer en el manejo de 500 genérico (asumiendo que el manejador los convierte)
        expect(response.statusCode).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Browser context was closed suddenly.');
    });
});
