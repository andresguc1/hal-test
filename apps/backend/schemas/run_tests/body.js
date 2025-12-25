// schemas/run_tests/body.js

import Joi from 'joi';

const allowedReportFormats = ['html', 'json', 'junit', 'list'];

const runTestsBodySchema = Joi.object({
    // 1. testSuite (Ruta/Nombre de la Suite, Requerido)
    testSuite: Joi.string().trim().required().messages({
        'any.required': 'El nombre o ruta de la suite de tests (testSuite) es obligatorio.',
        'string.empty': 'La suite de tests no puede estar vacía.',
    }),

    // 2. parallel (Ejecutar en Paralelo, Opcional)
    parallel: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'parallel debe ser booleano.',
    }),

    // 3. retries (Número de Reintentos, Opcional)
    retries: Joi.number().integer().min(0).default(0).optional().messages({
        'number.min': 'El número de reintentos debe ser 0 o mayor.',
    }),

    // 4. reportFormat (Formato del Reporte, Opcional)
    reportFormat: Joi.string()
        .valid(...allowedReportFormats)
        .default('html')
        .optional()
        .messages({
            'any.only': 'El formato de reporte debe ser html, json, junit o list.',
        }),

    // 5. timeout (Tiempo Máximo de la Suite, Opcional)
    timeout: Joi.number()
        .integer()
        .min(1)
        .default(300000) // 5 minutos por defecto
        .optional()
        .messages({
            'number.min': 'El timeout debe ser al menos 1ms.',
        }),

    // 6. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default runTestsBodySchema;
