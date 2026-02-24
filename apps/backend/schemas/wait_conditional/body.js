// schemas/wait_conditional/body.js

import Joi from 'joi';

const waitConditionalBodySchema = Joi.object({
    // 1. expression (Requerido, String o Objeto)
    expression: Joi.alternatives()
        .try(Joi.string(), Joi.object(), Joi.array())
        .required()
        .messages({
            'any.required': 'La condición o expresión es obligatoria.',
        }),

    // 2. waitType
    waitType: Joi.string().valid('browser', 'variable').default('browser'),

    // 3. polling (Intervalo de Evaluación)
    polling: Joi.number().integer().min(1).default(100).messages({
        'number.min': 'El intervalo de evaluación (polling) debe ser al menos 1ms.',
    }),

    // 4. timeout (Tiempo de espera Máximo)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 5. Retrocompatibilidad
    conditionScript: Joi.string().trim().optional(),
    args: Joi.string().trim().optional().allow(null, ''),
    browserId: Joi.string().allow(null, '').optional(),
});

// Bloquea cualquier campo extra que no esté definido.
export default waitConditionalBodySchema;
