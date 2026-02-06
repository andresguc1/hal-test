// schemas/hover/body.js

import Joi from 'joi';

const hoverBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector es obligatorio.',
    }),

    // 2. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 3. browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto.',
    }),

    // 4. takeScreenshot (Captura de pantalla, opcional)
    takeScreenshot: Joi.boolean().default(false),
});

export default hoverBodySchema;
