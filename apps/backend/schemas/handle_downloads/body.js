// schemas/handle_downloads/body.js

import Joi from 'joi';

const allowedActions = ['wait', 'save', 'validate', 'saveAndValidate'];
const saveActions = ['save', 'saveAndValidate'];
const validateActions = ['validate', 'saveAndValidate'];

const handleDownloadsBodySchema = Joi.object({
    // 1. action (Acción de Descarga, Requerido)
    action: Joi.string()
        .valid(...allowedActions)
        .required()
        .messages({
            'any.required': 'La acción de descarga es obligatoria.',
        }),

    // 2. timeout (Tiempo de Espera Máximo, Opcional)
    timeout: Joi.number().integer().min(1).default(30000).optional().messages({
        'number.min': 'El timeout debe ser al menos 1ms.',
    }),

    // 3. path (Ruta de Guardado, Condicional)
    path: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: Joi.valid(...saveActions),
            then: Joi.string().required().messages({
                'any.required':
                    'La ruta de guardado (path) es obligatoria para las acciones "Save" o "Save and Validate".',
                'string.empty': 'La ruta no puede estar vacía.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 4. expectedFileName (Nombre de Archivo Esperado, Condicional)
    expectedFileName: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: Joi.valid(...validateActions),
            then: Joi.string().required().messages({
                'any.required':
                    'El nombre de archivo esperado es obligatorio para las acciones que incluyen "Validate".',
                'string.empty': 'El nombre de archivo esperado no puede estar vacío.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 5. minSizeKB (Tamaño Mínimo, Opcional)
    minSizeKB: Joi.number().integer().min(0).optional().messages({
        'number.min': 'El tamaño mínimo debe ser 0 o mayor.',
    }),

    // 6. maxSizeKB (Tamaño Máximo, Opcional)
    maxSizeKB: Joi.number().integer().min(0).optional().messages({
        'number.min': 'El tamaño máximo debe ser 0 o mayor.',
    }),

    // 7. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});

export default handleDownloadsBodySchema;
