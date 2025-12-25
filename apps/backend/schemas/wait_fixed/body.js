// schemas/wait_fixed/body.js (Espera de Duración Fija)

import Joi from 'joi';

const waitFixedBodySchema = Joi.object({
    // 1. duration (Requerido)
    duration: Joi.number()
        .integer()
        .min(0)
        .max(60000) // Máximo 1 minuto (60000ms)
        .required()
        .messages({
            'any.required': 'La duración es requerida.',
            'number.min': 'Debe ser mayor o igual a 0.',
            'number.max': 'Máximo 60000ms (1 minuto).',
        }),
});

export default waitFixedBodySchema;
