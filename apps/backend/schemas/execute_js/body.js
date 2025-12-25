// schemas/execute_js/body.js

import Joi from 'joi';

const executeJsBodySchema = Joi.object({
    // 1. script (Requerido)
    script: Joi.string().trim().required().messages({
        'any.required': 'El código JavaScript (script) es obligatorio.',
        'string.empty': 'El script no puede estar vacío.',
    }),

    // 2. returnValue (Opcional)
    returnValue: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'El campo returnValue debe ser booleano.',
    }),

    // 3. variableName (Requerido CONDICIONAL)
    variableName: Joi.string()
        .trim()
        .allow('')
        .when('returnValue', {
            // Si returnValue es true, variableName es obligatorio.
            is: true,
            then: Joi.string().trim().min(1).required(),
            // Si es false, es opcional y se ignora.
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'variableName es obligatorio si se espera un valor de retorno.',
            'string.min': 'El nombre de la variable no puede estar vacío.',
        }),

    // 4. args (Opcional)
    // Se espera una cadena de texto que el controlador debe procesar (o el MCP).
    args: Joi.string().allow(null, '').optional().messages({
        'string.base': 'args debe ser una cadena de argumentos serializables.',
    }),

    // 5. browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});

export default executeJsBodySchema;
