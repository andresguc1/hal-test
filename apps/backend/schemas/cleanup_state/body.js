// schemas/cleanup_state/body.js

import Joi from 'joi';

const allowedTargets = ['context', 'page'];

const cleanupStateBodySchema = Joi.object({
    // 1. target (Ámbito de Limpieza, Requerido)
    target: Joi.string()
        .valid(...allowedTargets)
        .required()
        .messages({
            'any.required': 'El ámbito de limpieza (context o page) es obligatorio.',
        }),

    // 2. includeCookies (Booleano/Checkbox)
    includeCookies: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'includeCookies debe ser booleano.',
    }),

    // 3. includeLocalStorage (Booleano/Checkbox)
    includeLocalStorage: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'includeLocalStorage debe ser booleano.',
    }),

    // 4. includeSessionStorage (Booleano/Checkbox)
    includeSessionStorage: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'includeSessionStorage debe ser booleano.',
    }),

    // 5. includeIndexedDB (Booleano/Checkbox)
    includeIndexedDB: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'includeIndexedDB debe ser booleano.',
    }),

    // 6. includePermissions (Booleano/Checkbox)
    includePermissions: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'includePermissions debe ser booleano.',
    }),

    // 7. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required': 'El ID del navegador/contexto (browserId) es obligatorio.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default cleanupStateBodySchema;
