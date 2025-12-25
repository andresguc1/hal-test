// schemas/wait_navigation/body.js

import Joi from 'joi';

const allowedWaitUntilValues = ['load', 'domcontentloaded', 'networkidle'];

const waitNavigationBodySchema = Joi.object({
    // 1. url (URL de Destino Específica, Opcional)
    url: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'La URL de destino debe ser una cadena de texto o un patrón.',
    }),

    // 2. timeout (Tiempo de espera)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 3. waitUntil (Condición de Fin de Navegación, Requerido)
    waitUntil: Joi.string()
        .valid(...allowedWaitUntilValues)
        .default('load')
        .required()
        .messages({
            'any.required': 'La condición de fin de navegación es obligatoria.',
            'any.only': 'La condición debe ser load, domcontentloaded o networkidle.',
        }),

    // 4. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default waitNavigationBodySchema;
