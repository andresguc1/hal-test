// schemas/launch_browser/body.js

import Joi from 'joi';

// Array de valores permitidos para browserType
const allowedBrowserTypes = ['chromium', 'firefox', 'webkit'];

const launchBrowserBodySchema = Joi.object({
    // 1. browserType (Obligatorio)
    browserType: Joi.string()
        .valid(...allowedBrowserTypes)
        .default('chromium')
        .required()
        .messages({
            'any.required': 'El tipo de navegador (browserType) es obligatorio.',
            'any.only': 'El tipo de navegador debe ser chromium, firefox, o webkit.',
        }),

    // 2. headless (Opcional)
    headless: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo headless debe ser un valor booleano (true/false).',
    }),

    // 3. slowMo (Opcional)
    // Retardo en milisegundos entre cada operación
    slowMo: Joi.number().integer().min(0).default(0).optional().messages({
        'number.base': 'slowMo debe ser un número.',
        'number.min': 'slowMo no puede ser negativo.',
    }),

    // 4. args (Opcional)
    // Argumentos de línea de comandos del navegador (se envía como string y el controlador lo separa)
    args: Joi.string()
        .allow(null, '') // Permite que sea nulo o una cadena vacía
        .optional()
        .messages({
            'string.base': 'args debe ser una cadena de texto.',
        }),

    // 5. executablePath (Opcional)
    // Ruta a un ejecutable de navegador personalizado
    executablePath: Joi.string().allow(null, '').optional().messages({
        'string.base': 'executablePath debe ser una cadena de texto.',
    }),

    // 6. maximizeWindow (Opcional)
    maximizeWindow: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'maximizeWindow debe ser un valor booleano.',
    }),

    // ⚠️ Deshabilita la opción 'unknown' para solo permitir los campos definidos
});

export default launchBrowserBodySchema;
