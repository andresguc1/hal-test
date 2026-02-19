// schemas/handle_downloads/body.js

import Joi from 'joi';

const allowedActions = ['wait', 'save', 'validate', 'saveAndValidate'];

const handleDownloadsBodySchema = Joi.object({
    // 1. action (Acción de Descarga, Opcional)
    action: Joi.string()
        .valid(...allowedActions)
        .optional()
        .default('save')
        .messages({
            'any.only': 'La acción debe ser un tipo de descarga válido.',
        }),

    // 2. selector (Trigger de Descarga, Requerido) 🆙
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del botón de descarga es obligatorio.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 3. timeout (Tiempo de Espera Máximo, Opcional)
    timeout: Joi.number().integer().min(1).default(30000).optional().messages({
        'number.min': 'El timeout debe ser al menos 1ms.',
    }),

    // 4. path (Ruta de Guardado, Opcional) 🆙
    path: Joi.string().trim().optional().allow(null, '').messages({
        'string.empty': 'La ruta no puede estar vacía.',
    }),

    // 5. expectedFileName (Nombre de Archivo Esperado, Opcional)
    expectedFileName: Joi.string().trim().optional().allow(null, ''),

    // 6. minSizeKB (Tamaño Mínimo, Opcional)
    minSizeKB: Joi.number().integer().min(0).optional().messages({
        'number.min': 'El tamaño mínimo debe ser 0 o mayor.',
    }),

    // 7. maxSizeKB (Tamaño Máximo, Opcional)
    maxSizeKB: Joi.number().integer().min(0).optional().messages({
        'number.min': 'El tamaño máximo debe ser 0 o mayor.',
    }),

    // 8. variableName (Nombre de variable para capturar resultado, Opcional) 🆕
    variableName: Joi.string().trim().optional(),

    // 9. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});

export default handleDownloadsBodySchema;
