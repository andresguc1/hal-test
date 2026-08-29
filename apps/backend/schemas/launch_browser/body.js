// schemas/launch_browser/body.js

import Joi from 'joi';

// Array de valores permitidos para browserType
const allowedBrowserTypes = ['chromium', 'firefox', 'webkit', 'lightpanda'];

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
    headless: Joi.boolean().default(false).optional().messages({
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

    maximizeWindow: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'maximizeWindow debe ser un valor booleano.',
    }),

    devicePreset: Joi.string()
        .valid(
            'Desktop',
            'iPhone SE',
            'iPhone XR',
            'iPhone 12 Pro',
            'iPhone 14 Pro Max',
            'Pixel 7',
            'Samsung Galaxy S22',
            'Samsung Galaxy S20 Ultra',
            'iPad Mini',
            'iPad Air',
            'iPad Pro',
            'Tablet',
            'Custom',
        )
        .default('Desktop')
        .optional(),

    // 7. Width & Height (Opcional)
    width: Joi.number().integer().min(100).optional(),
    height: Joi.number().integer().min(100).optional(),
    isMobile: Joi.boolean().optional().default(false),
    hasTouch: Joi.boolean().optional().default(false),

    // --- Network Conditions (Optional) ---
    networkProfile: Joi.string()
        .valid(
            'No throttling',
            'WiFi fast',
            'WiFi slow',
            '4G',
            'Fast 3G',
            'Slow 3G',
            '2G',
            'High Latency',
            'Custom',
            'Offline',
            'Slow 4G',
        )
        .optional(),
    offline: Joi.boolean().optional(),
    latency: Joi.number().min(0).optional(),
    downloadThroughput: Joi.number().min(-1).optional(),
    uploadThroughput: Joi.number().min(-1).optional(),
}).unknown(true);

export default launchBrowserBodySchema;
