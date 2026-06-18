// schemas/scroll/body.js

import Joi from 'joi';

const allowedDirections = ['down', 'up', 'right', 'left'];
const allowedBehaviors = ['auto', 'smooth'];

const scrollBodySchema = Joi.object({
    // 1. selector (Opcional)
    selector: Joi.string().trim().optional().allow(null, ''),

    // 2. direction (String, Condicional)
    direction: Joi.string()
        .valid(...allowedDirections)
        .default('down')
        .messages({
            'any.only': 'La dirección debe ser down, up, right o left.',
        }),

    // 3. amount (Número, Condicional)
    amount: Joi.number().integer().min(1).default(100).messages({
        'number.min': 'La cantidad de píxeles debe ser al menos 1.',
    }),

    // 4. behavior (Requerido, Select)
    behavior: Joi.string()
        .valid(...allowedBehaviors)
        .default('auto')
        .messages({
            'any.only': 'El comportamiento debe ser auto o smooth.',
        }),

    // 5. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),

    // 6. scrollToEnd (Boolean, Opcional) - Scroll infinito hasta el final
    scrollToEnd: Joi.boolean().default(false).optional(),

    // 7. maxScrolls (Número, Opcional) - Límite de intentos para scroll infinito
    maxScrolls: Joi.number().integer().min(1).max(200).default(50).optional(),

    // 8. waitTime (Número, Opcional) - Tiempo de espera entre scrolls en ms
    waitTime: Joi.number().integer().min(500).max(10000).default(2000).optional(),

    // 9. takeScreenshot (Opcional)
    takeScreenshot: Joi.boolean().default(false).optional(),
});
// Bloquea cualquier campo extra que no esté definido.
export default scrollBodySchema;
