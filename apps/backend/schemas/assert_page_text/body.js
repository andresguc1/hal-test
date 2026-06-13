// schemas/assert_page_text/body.js

import Joi from 'joi';

/**
 * Schema for assert_page_text action.
 * Validates textToFind, matchType, caseSensitive, and timeout.
 */
const assertPageTextBodySchema = Joi.object({
    textToFind: Joi.string().required().messages({
        'any.required': 'La propiedad "textToFind" es obligatoria.',
        'string.empty': 'La propiedad "textToFind" no puede estar vacía.',
    }),

    matchType: Joi.string()
        .valid('contains', 'exact', 'regex')
        .default('contains')
        .optional()
        .messages({
            'any.only': 'Valor no válido para "matchType". Debe ser contains, exact o regex.',
        }),

    caseSensitive: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'La propiedad "caseSensitive" debe ser un booleano.',
    }),

    timeout: Joi.number().integer().min(0).default(5000).optional().messages({
        'number.base': 'El tiempo de espera debe ser un número entero.',
        'number.min': 'El tiempo de espera no puede ser negativo.',
    }),

    browserId: Joi.string().allow(null, '').optional(),
}).unknown(true);

export default assertPageTextBodySchema;
