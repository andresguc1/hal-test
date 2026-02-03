// schemas/back_forward/body.js

import Joi from 'joi';

const backForwardBodySchema = Joi.object({
    // 1. browserId (ID del navegador objetivo) 🚨 ¡CRUCIAL!
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),

    // 2. timeout (Opcional)
    // Playwright soporta un timeout para goBack/goForward, aunque
    // la implementación en action.controller.js no lo usa actualmente,
    // es buena práctica incluirlo en el esquema si se va a añadir soporte.
    timeout: Joi.number().integer().min(1).default(30000).optional().messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),
}).unknown(true);
// Bloquea cualquier campo extra que no esté definido. (Nota: .unknown(true) permite campos adicionales como nodeId, runId, etc.)
export default backForwardBodySchema;
