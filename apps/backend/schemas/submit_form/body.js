// schemas/submit_form/body.js

import Joi from 'joi';

const submitFormBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del formulario o botón de envío es obligatorio.',
    }),

    // 2. waitForNavigation (Booleano/Checkbox)
    waitForNavigation: Joi.boolean()
        .default(true) // Esperar navegación por defecto
        .optional()
        .messages({
            'boolean.base': 'El campo waitForNavigation debe ser booleano.',
        }),

    // 3. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 4. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default submitFormBodySchema;
