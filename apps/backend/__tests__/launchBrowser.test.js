// launchBrowser.test.js
// ====================================================================
// Prueba para la ruta GET /api/nodes/operations?op=launch_browser
// Asegura que el servidor Express devuelva el esquema de configuración
// completo para la operación 'launch_browser'.
//
// NOTA: Compatible con Vitest + Supertest.
// ====================================================================

import request from 'supertest';
// Asegúrate de que tu archivo app.js use 'export default app;' para que esta importación funcione.
import app from '../app.js';

// La función 'describe' y 'it' (o 'test') son nativas de Vitest/Jest.
describe('GET /api/nodes/operations?op=launch_browser', () => {
    // Test 1: Verificar respuesta 200 y formato de objeto
    it('debería responder con un código 200 y un objeto JSON', async () => {
        const response = await request(app).get('/api/nodes/operations?op=launch_browser');

        // 1. Verificar el código de estado
        expect(response.statusCode).toBe(200);

        // 2. Verificar que el cuerpo de la respuesta sea un objeto JSON
        expect(response.headers['content-type']).toMatch(/json/);
        expect(typeof response.body).toBe('object');
        expect(Array.isArray(response.body)).toBe(false);
    });

    // Test 2: Verificar que el objeto contenga la clave 'launch_browser'
    it('debería contener la clave "launch_browser" en el cuerpo de la respuesta', async () => {
        const response = await request(app).get('/api/nodes/operations?op=launch_browser');

        // La respuesta debe ser un objeto con una única clave: 'launch_browser'
        expect(response.body).toHaveProperty('launch_browser');
    });

    // Test 3: Verificar que el esquema de 'launch_browser' sea un array de configuraciones
    it('el valor de "launch_browser" debe ser un array con al menos 4 configuraciones de campo', async () => {
        const response = await request(app).get('/api/nodes/operations?op=launch_browser');
        const schema = response.body.launch_browser;

        // 1. Verificar que sea un array
        expect(Array.isArray(schema)).toBe(true);

        // 2. Verificar que contenga un número razonable de campos
        // Basado en el mock de app.js (browserType, headless, slowMo, args, executablePath)
        expect(schema.length).toBeGreaterThanOrEqual(5);

        // 3. Verificar la estructura del primer campo (browserType)
        const browserTypeConfig = schema.find((field) => field.name === 'browserType');

        expect(browserTypeConfig).toBeDefined();
        expect(browserTypeConfig.type).toBe('select');
        expect(browserTypeConfig.required).toBe(true);
        expect(browserTypeConfig.defaultValue).toBe('chromium');
        expect(Array.isArray(browserTypeConfig.options)).toBe(true);
    });

    // Test 4: Manejo de operación no encontrada
    it('debería responder con un código 404 si la operación no existe', async () => {
        const response = await request(app).get('/api/nodes/operations?op=non_existent_op');

        // 1. Verificar el código de estado
        expect(response.statusCode).toBe(404);

        // 2. Verificar el mensaje de error
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('non_existent_op');
    });
});
