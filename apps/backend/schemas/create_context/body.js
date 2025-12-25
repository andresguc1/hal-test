// schemas/create_context/body.js (CORREGIDO)

import Joi from 'joi';

const createContextBodySchema = Joi.object({
    // 1. storageState (Opcional)
    storageState: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'La ruta de estado de sesión debe ser una cadena de texto.',
    }),

    // 2. viewportWidth (Ancho del Viewport)
    // Eliminamos la cláusula .when() y permitimos que sea opcional.
    viewportWidth: Joi.number().integer().min(1).optional().messages({
        'number.min': 'El ancho del viewport debe ser al menos 1px.',
    }),

    // 3. viewportHeight (Altura del Viewport)
    // Eliminamos la cláusula .when() y permitimos que sea opcional.
    viewportHeight: Joi.number().integer().min(1).optional().messages({
        'number.min': 'La altura del viewport debe ser al menos 1px.',
    }),

    // 4. userAgent (User-Agent, Opcional)
    userAgent: Joi.string().trim().optional().allow(null, ''),

    // 5. geolocation (Geolocalización, Opcional)
    geolocation: Joi.string().trim().optional().allow(null, ''),

    // 6. permissions (Permisos a Conceder, Opcional)
    permissions: Joi.string().trim().optional().allow(null, ''),

    // 7. locale (Idioma/Configuración Regional, Opcional)
    locale: Joi.string().trim().optional().allow(null, ''),

    // 8. browserId (ID del navegador padre, Requerido)
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador padre (browserId) es obligatorio para crear un contexto.',
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    // ⚠️ Aplicamos la regla de dependencia mutua aquí:
    // Si viewportWidth está presente, viewportHeight es requerido, y viceversa.
    .and('viewportWidth', 'viewportHeight');
export default createContextBodySchema;
