// __tests__/api.test.js (Totalmente compatible con ESM Nativos usando Vitest)

// 1. Importar funciones de Vitest
import { describe, it, expect } from 'vitest';

// 2. Importar la librería de testing HTTP.
import request from 'supertest';

// 3. Importar directamente la instancia de la aplicación Express.
import app from '../app.js';

// -------------------------------------------------------------
// PREFIJO DE API: Todos los tests deben usar el prefijo /api
// -------------------------------------------------------------
const API_PREFIX = '/api';

// -------------------------------------------------------------
// PRUEBAS PRINCIPALES: Cubriendo todos los cURL definidos
// -------------------------------------------------------------
describe('HalTest API Endpoints: Status, Nodes, and Project', () => {
    // --- GRUPO 1: Pruebas Básicas de Estado y Catálogo (cURL #1, #2, #3) ---

    it('GET /api/status (cURL #1) debe verificar que el servidor está activo y devolver 200', async () => {
        const response = await request(app).get(`${API_PREFIX}/status`);
        expect(response.statusCode).toBe(200);
        // Asumiendo una respuesta estándar para el estado del servidor
        expect(response.body).toBeTypeOf('object');
        expect(response.body).toHaveProperty('status', 'ok');
    });

    it('GET /api/nodes/categories (cURL #2) debe obtener la lista de categorías (mínimo 5) con status 200', async () => {
        const response = await request(app).get(`${API_PREFIX}/nodes/categories`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeTypeOf('object');
        // Verificar que existan al menos 5 categorías para asegurar la carga completa
        expect(Object.keys(response.body).length).toBeGreaterThanOrEqual(5);
        expect(response.body).toHaveProperty('browser_management');
    });

    it('GET /api/nodes/operations (cURL #3) debe obtener todos los esquemas de operaciones con status 200', async () => {
        const response = await request(app).get(`${API_PREFIX}/nodes/operations`);

        expect(response.statusCode).toBe(200);

        // Aceptar objeto (mapa)
        expect(response.body).toBeInstanceOf(Object);
        const keys = Object.keys(response.body);
        expect(keys.length).toBeGreaterThanOrEqual(15);

        // Verificar estructura del primer esquema (por nombre)
        const firstKey = keys[0];
        expect(Array.isArray(response.body[firstKey])).toBe(true);
        expect(response.body[firstKey][0]).toHaveProperty('name');
        expect(response.body[firstKey][0]).toHaveProperty('type');
    });

    // --- GRUPO 2: Pruebas de Esquemas Específicos usando ?op= (cURL #4, #5, #6, #7) ---

    const OPERATIONS_URL = `${API_PREFIX}/nodes/operations`;

    it(
        'GET ' +
            OPERATIONS_URL +
            '?op=click (cURL #4) debe devolver el esquema de la operación "click"',
        async () => {
            const response = await request(app).get(`${OPERATIONS_URL}?op=click`);

            expect(response.statusCode).toBe(200);

            // Normalizar el body a un array de parámetros:
            // - Si response.body ya es un array -> usarlo.
            // - Si es un objeto con clave 'click' (o cualquier otra) -> tomar esa primera entrada.
            const paramsArray = Array.isArray(response.body)
                ? response.body
                : // Si viene un objeto tipo { click: [ ... ] }, tomar el primer valor que sea un array
                  Object.values(response.body).find((v) => Array.isArray(v)) || [];

            // Asegurarse que tenemos un array y que contiene el parámetro 'selector'
            expect(Array.isArray(paramsArray)).toBe(true);
            expect(paramsArray.some((p) => p && p.name === 'selector')).toBe(true);
        },
    );

    it(
        'GET ' +
            OPERATIONS_URL +
            '?op=resize_viewport (cURL #5) debe devolver el esquema de "resize_viewport"',
        async () => {
            const response = await request(app).get(`${OPERATIONS_URL}?op=resize_viewport`);

            expect(response.statusCode).toBe(200);

            // Normalizar: si la respuesta es { resize_viewport: [...] }, extraer el array
            const paramsArray = Array.isArray(response.body)
                ? response.body
                : Object.values(response.body).find((v) => Array.isArray(v)) || [];

            // Verificar que es un array válido
            expect(Array.isArray(paramsArray)).toBe(true);

            // Obtener los nombres de los campos
            const fieldNames = paramsArray.map((field) => field.name);

            // Verificar que contenga 'width' y 'height'
            expect(fieldNames).toContain('width');
            expect(fieldNames).toContain('height');
        },
    );

    it(
        'GET ' +
            OPERATIONS_URL +
            '?op=mock_response (cURL #6) debe devolver el esquema de "mock_response"',
        async () => {
            const response = await request(app).get(`${OPERATIONS_URL}?op=mock_response`);

            expect(response.statusCode).toBe(200);

            // Normalizar el body a un array de parámetros:
            const paramsArray = Array.isArray(response.body)
                ? response.body
                : Object.values(response.body).find((v) => Array.isArray(v)) || [];

            // Asegurarnos que es un array
            expect(Array.isArray(paramsArray)).toBe(true);

            // Buscar si existe un campo 'url' o 'urlPattern'
            const hasUrlField = paramsArray.some(
                (p) => p && (p.name === 'url' || p.name === 'urlPattern'),
            );

            expect(hasUrlField).toBe(true);
        },
    );

    it(
        'GET ' + OPERATIONS_URL + '?op=operacion-no-existe (cURL #7) debe devolver 404 Not Found',
        async () => {
            const response = await request(app).get(`${OPERATIONS_URL}?op=operacion-no-existe`);

            // Debe responder con código 404
            expect(response.statusCode).toBe(404);

            // Debe tener una propiedad 'error' en formato JSON
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/no encontrada/i); // tolerante con el idioma
        },
    );

    // --- GRUPO 3: Pruebas de Carga de Proyectos (cURL #8, #9) ---

    const PROJECT_LOAD_URL = `${API_PREFIX}/project/load`;

    it(
        'GET ' +
            PROJECT_LOAD_URL +
            '?id=PRJ-42 (cURL #8) debe cargar el proyecto Mock con status 200',
        async () => {
            const response = await request(app).get(`${PROJECT_LOAD_URL}?id=PRJ-42`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toBeTypeOf('object');

            // Verificar la propiedad clave del proyecto mock
            expect(response.body).toHaveProperty('projectId', 'PRJ-42');
            expect(response.body).toHaveProperty('projectName');
        },
    );

    it(
        'GET ' + PROJECT_LOAD_URL + '?id=ID-INCORRECTO (cURL #9) debe devolver 404 Not Found',
        async () => {
            const response = await request(app).get(`${PROJECT_LOAD_URL}?id=ID-INCORRECTO`);
            expect(response.statusCode).toBe(404);
            expect(response.text).toContain('Proyecto no encontrado');
        },
    );

    // --- GRUPO 4: Pruebas Generales de 404 ---

    it('GET /ruta-inexistente (sin prefijo) debe devolver un código de error (Ej: 404)', async () => {
        const response = await request(app).get('/ruta-inexistente');
        expect(response.statusCode).toBe(404);
    });

    it('GET /api/ruta-inexistente (con prefijo) debe devolver un código de error (Ej: 404)', async () => {
        const response = await request(app).get(`${API_PREFIX}/ruta-inexistente`);
        expect(response.statusCode).toBe(404);
    });
});
