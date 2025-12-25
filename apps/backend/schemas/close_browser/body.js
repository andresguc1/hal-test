// schemas/close_browser/body.js

import Joi from 'joi';

/**
 * Schema para close_browser:
 * - browserId ya NO es obligatorio (el backend decidirá qué instancia cerrar si no viene).
 * - forceClose y clearContext mantienen sus valores por defecto.
 */
const closeBrowserBodySchema = Joi.object({
    // 1. browserId (OPCIONAL)
    // Si se envía, debe ser una cadena no vacía; si no se envía, el backend usará la última instancia activa.
    browserId: Joi.string()
        .trim()
        .allow(null, '') // permitir vacío o null para compatibilidad con frontends que no lo envían
        .optional()
        .messages({
            'string.base': 'El browserId debe ser una cadena de texto.',
        }),

    // 2. forceClose (Opcional)
    forceClose: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'El campo forceClose debe ser un valor booleano (true/false).',
    }),

    // 3. clearContext (Opcional)
    clearContext: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo clearContext debe ser un valor booleano (true/false).',
    }),
});
// Bloquea campos extra no definidos
export default closeBrowserBodySchema;
