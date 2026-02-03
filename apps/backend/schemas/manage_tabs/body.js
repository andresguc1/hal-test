// schemas/manage_tabs/body.js

import Joi from 'joi';

const allowedActions = ['new', 'switch', 'close', 'list'];

const manageTabsBodySchema = Joi.object({
    // 1. action (Requerido, Select)
    action: Joi.string()
        .valid(...allowedActions)
        .required()
        .messages({
            'any.required': 'La operación de pestaña (action) es obligatoria.',
            'any.only': 'La acción debe ser "new", "switch", "close" o "list".',
        }),

    // 2. browserId (Opcional) - 🆕 Añadido
    // Identificador del navegador objetivo. Si no se envía, el controlador usará el último activo.
    browserId: Joi.string()
        .allow(null, '') // Permite que sea nulo o una cadena vacía
        .optional()
        .messages({
            'string.base': 'browserId debe ser una cadena de texto.',
        }),

    // 3. tabIndex (Número, Condicional)
    tabIndex: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
            'number.min': 'El índice de la pestaña debe ser 0 o mayor.',
            'number.base': 'El índice de la pestaña debe ser un número entero.',
        })
        // Condicional: Requerido solo si action es 'switch'
        .when('action', {
            is: 'switch',
            then: Joi.required().messages({
                'any.required': 'El índice de la pestaña es obligatorio para la acción "switch".',
            }),
            otherwise: Joi.optional(),
        }),

    // 4. url (String, Optional)
    url: Joi.string()
        // Valida que sea una URL válida con protocolo http o https
        .uri({ scheme: ['http', 'https'] })
        .trim()
        .optional()
        .allow(null, '')
        .messages({
            'string.uri': 'URL inválida. Debe incluir http:// o https://.',
        }),
}).unknown(true);

export default manageTabsBodySchema;
