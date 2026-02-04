// schemas/wait_for_element/body.js

import Joi from 'joi';

const allowedConditions = ['visible', 'hidden', 'attached', 'detached'];

const waitForElementBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del elemento es obligatorio.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 2. condition (Requerido)
    condition: Joi.string()
        .valid(...allowedConditions)
        .default('visible')
        .required()
        .messages({
            'any.required': 'La condición de espera es obligatoria.',
            'any.only': 'La condición debe ser: visible, hidden, attached o detached.',
        }),

    // 3. timeout (Opcional)
    timeout: Joi.number().integer().min(1).default(30000).optional().messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1 ms.',
        'number.base': 'El timeout debe ser un número entero.',
    }),

    // 4. browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto.',
    }),

    // 5. takeScreenshot (Opcional)
    takeScreenshot: Joi.boolean().default(false).optional(),
});

export default waitForElementBodySchema;
