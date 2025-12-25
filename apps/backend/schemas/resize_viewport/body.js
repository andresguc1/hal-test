// schemas/resize_viewport/body.js

import Joi from 'joi';

const exampleDevices = ['iPhone 13', 'Pixel 5', 'iPad Pro', 'Desktop Chrome', ''];

const resizeViewportBodySchema = Joi.object({
    // ... (Campos deviceEmulation, width, height existentes) ...
    deviceEmulation: Joi.string()
        .valid(...exampleDevices)
        .default('')
        .optional()
        .messages({
            'any.only': 'El dispositivo seleccionado no es una emulación válida.',
        }),

    width: Joi.number()
        .integer()
        .min(1)
        .when('deviceEmulation', {
            is: Joi.valid('', null),
            then: Joi.required(),
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'El ancho es obligatorio si no se selecciona emulación de dispositivo.',
            'number.min': 'El ancho debe ser un valor positivo.',
        }),

    height: Joi.number()
        .integer()
        .min(1)
        .when('deviceEmulation', {
            is: Joi.valid('', null),
            then: Joi.required(),
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'El alto es obligatorio si no se selecciona emulación de dispositivo.',
            'number.min': 'El alto debe ser un valor positivo.',
        }),

    // 4. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
});

export default resizeViewportBodySchema;
