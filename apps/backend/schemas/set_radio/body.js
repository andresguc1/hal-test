// schemas/set_radio/body.js

import Joi from 'joi';

const setRadioBodySchema = Joi.object({
    // 1. selector (Requerido) — apunta al radio input o a su label
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del radio es obligatorio.',
        'string.empty': 'El selector del radio no puede estar vacío.',
    }),

    // 2. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 3. browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
}).unknown(true);
// unknown(true) permite extender la configuración sin romper flujos existentes.

export default setRadioBodySchema;
