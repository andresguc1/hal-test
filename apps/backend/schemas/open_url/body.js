// schemas/open_url/body.js

import Joi from 'joi';

// Valores válidos para el campo 'waitUntil' según Playwright
const allowedWaitUntilValues = [
    'load',
    'domcontentloaded',
    'networkidle',
    'networkidle0',
    'networkidle2',
];

/**
 * Schema para la acción open_url.
 * Se eliminó la obligatoriedad de `browserId`,
 * ya que ahora el backend determina automáticamente qué navegador usar.
 */
const openUrlBodySchema = Joi.object({
    // 1. URL (Requerido)
    url: Joi.string()
        .uri({ scheme: ['http', 'https'] })
        .trim()
        .required()
        .messages({
            'any.required': 'La propiedad "url" es obligatoria para abrir una página.',
            'string.empty': 'La propiedad "url" no puede estar vacía.',
            'string.uri': 'URL inválida. Debe incluir http:// o https://.',
        }),

    // 2. waitUntil (Condición de espera)
    waitUntil: Joi.string()
        .valid(...allowedWaitUntilValues)
        .default('domcontentloaded')
        .optional()
        .messages({
            'any.only':
                'Valor no válido para "waitUntil". Use load, domcontentloaded, networkidle, networkidle0 o networkidle2.',
        }),

    // 3. timeout (Tiempo de espera máximo en milisegundos)
    timeout: Joi.number().integer().min(0).default(20000).optional().messages({
        'number.base': 'El tiempo de espera debe ser un número entero.',
        'number.min': 'El tiempo de espera no puede ser negativo.',
    }),

    // 4. browserId (opcional, gestionado internamente)
    browserId: Joi.string()
        .allow(null, '') // Permite no enviarlo o enviarlo vacío
        .optional()
        .messages({
            'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
        }),
}).unknown(true);
// Rechazar campos desconocidos para mantener consistencia y seguridad
export default openUrlBodySchema;
