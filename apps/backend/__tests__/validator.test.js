/* eslint-env vitest */

import { vi } from 'vitest';
import Joi from 'joi';
import validate from '../middlewares/validator.js'; // Asegúrate que esta ruta sea correcta

// -------------------------------------------------------------------------
// MOCKS para Express
// -------------------------------------------------------------------------

/**
 * Función para generar mocks de req, res y next para cada prueba.
 * @param {object} reqData - Datos iniciales para req (body, params, query).
 * @returns {{req: object, res: object, next: function}}
 */
const mockHttp = (reqData = {}) => {
    const req = {
        body: reqData.body || {},
        params: reqData.params || {},
        query: reqData.query || {},
    };

    // Mock simple de res con métodos encadenables por si se necesitan
    const res = {
        status: vi.fn().mockImplementation(() => res),
        json: vi.fn().mockImplementation(() => res),
        send: vi.fn().mockImplementation(() => res),
    };

    const next = vi.fn(); // Compatible con Vitest

    return { req, res, next };
};

// -------------------------------------------------------------------------
// SUITE DE PRUEBAS
// -------------------------------------------------------------------------

describe('Middleware de Validación Joi (validate.js)', () => {
    // Esquemas de prueba simples
    const bodySchema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().default(30),
    });

    const querySchema = Joi.object({
        limit: Joi.number().integer().min(1).default(10),
    });

    // ==========================================================
    // PRUEBAS DE ÉXITO (Validación y Asignación de Valores Limpios)
    // ==========================================================

    test('Debe llamar a next() y limpiar el body si la validación es exitosa', () => {
        const { req, res, next } = mockHttp({ body: { name: 'Alice', extraField: 'remove me' } });

        // Ejecutar el middleware con solo el esquema de body
        validate({ body: bodySchema })(req, res, next);

        // 1. Debe llamar a next() sin error
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();

        // 2. Verifica que el campo extra haya sido eliminado (stripUnknown)
        expect(req.body).toEqual({
            name: 'Alice',
            age: 30, // Valor por defecto aplicado por Joi
        });
    });

    test('Debe aplicar el valor por defecto para query y llamar a next()', () => {
        const { req, res, next } = mockHttp({ query: {} }); // Query vacío

        // Ejecutar el middleware con solo el esquema de query
        validate({ query: querySchema })(req, res, next);

        // 1. Debe llamar a next() sin error
        expect(next).toHaveBeenCalledTimes(1);

        // 2. Verifica que el valor por defecto se haya asignado
        expect(req.query).toEqual({
            limit: 10,
        });
    });

    // ==========================================================
    // PRUEBAS DE FALLA (Retorno de Error 400)
    // ==========================================================

    test('Debe llamar a next(error) con statusCode 400 y detalles si el body es inválido', () => {
        // name es requerido, age debe ser número
        const { req, res, next } = mockHttp({ body: { age: 'not_a_number' } });

        // Ejecutar el middleware
        validate({ body: bodySchema })(req, res, next);

        // 1. Debe ser llamado con un argumento (el objeto Error)
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];

        // 2. Verificar el formato y contenido del error
        expect(error.statusCode).toBe(400);
        expect(error.details).toHaveLength(2); // Faltan 'name' y 'age' es inválido
        expect(error.details).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    field: 'name',
                    message: expect.stringContaining('is required'),
                }),
                expect.objectContaining({
                    field: 'age',
                    message: expect.stringContaining('must be a number'),
                }),
            ]),
        );
    });

    test('Debe llamar a next(error) si se combinan esquemas y uno falla (ej. body y query)', () => {
        // Body falla (name requerido) y query es válido
        const { req, res, next } = mockHttp({
            body: { age: 40 },
            query: { limit: 5 }, // Válido, pero debe fallar por el body
        });

        // Ejecutar con ambos esquemas
        validate({ body: bodySchema, query: querySchema })(req, res, next);

        // 1. Verifica que solo se llama a next con error
        expect(next).toHaveBeenCalledTimes(1);
        const error = next.mock.calls[0][0];

        // 2. El error solo debe ser el del body
        expect(error.statusCode).toBe(400);
        expect(error.details).toHaveLength(1);
        expect(error.details[0].field).toBe('name');
    });
});
