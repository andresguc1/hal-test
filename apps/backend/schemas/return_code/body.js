// schemas/return_code/body.js

import Joi from 'joi';

const returnCodeBodySchema = Joi.object({
    // 1. successField (Propiedad de Éxito, Opcional)
    successField: Joi.string().trim().default('success').optional().messages({
        'string.base': 'successField debe ser una cadena de texto.',
    }),

    // 2. exitOnFail (Detener Proceso al Fallar, Opcional)
    exitOnFail: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'exitOnFail debe ser booleano.',
    }),

    // 3. customCodes (Códigos de Salida Personalizados (JSON), Opcional)
    // Se valida como string, el framework debe parsear el JSON.
    customCodes: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .default('{ "success": 0, "failed": 1 }')
        .messages({
            'string.base': 'customCodes debe ser una cadena de texto (JSON).',
        }),

    // 4. verbose (Modo Detallado, Opcional)
    verbose: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'verbose debe ser booleano.',
    }),

    // 5. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default returnCodeBodySchema;
