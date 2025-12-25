// schemas/find_element/body.js

import Joi from 'joi';

const allowedSelectorTypes = ['css', 'xpath', 'text'];

const findElementBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector para localizar el elemento es obligatorio.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 2. selectorType (Opcional, con validación de opciones)
    selectorType: Joi.string()
        .valid(...allowedSelectorTypes)
        .default('css')
        .optional()
        .messages({
            'any.only': 'El tipo de selector debe ser css, xpath o text.',
        }),

    // 3. timeout (Opcional)
    timeout: Joi.number().integer().min(1).default(10000).optional().messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1 ms.',
        'number.base': 'El timeout debe ser un número entero.',
    }),

    // 4. visible (Opcional)
    visible: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo visible debe ser booleano (true/false).',
    }),

    // 5. browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
});

export default findElementBodySchema;
