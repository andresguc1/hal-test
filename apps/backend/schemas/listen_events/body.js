// schemas/listen_events/body.js

import Joi from 'joi';

const allowedEvents = [
    'click',
    'input',
    'change',
    'submit',
    'request',
    'response',
    'custom',
    'dialog',
    'console',
];
const listenEventsBodySchema = Joi.object({
    // 1. eventType (Requerido, Select)
    eventType: Joi.string()
        .valid(...allowedEvents)
        .required()
        .messages({
            'any.required': 'El tipo de evento a escuchar es obligatorio.',
            'any.only': 'El tipo de evento no es válido.',
        }),

    // 2. selector (Opcional)
    selector: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'El selector debe ser una cadena de texto.',
    }),

    // 2.1 urlPattern (Opcional, para red)
    urlPattern: Joi.string().trim().optional().allow(null, '').messages({
        'string.base': 'urlPattern debe ser una cadena de texto.',
    }),

    // 2.2 method (Opcional, para red)
    method: Joi.string()
        .uppercase()
        .valid('', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD')
        .optional()
        .allow(null, '')
        .messages({
            'any.only': 'El método HTTP no es válido.',
        }),

    // 3. logToFile (Booleano/Checkbox)
    logToFile: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'logToFile debe ser booleano.',
    }),

    // 4. filePath (Ruta de Archivo, Condicional)
    filePath: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('logToFile', {
            is: true,
            then: Joi.string().required().messages({
                'any.required':
                    'La ruta del archivo de logs (filePath) es obligatoria si "Registrar Eventos a Archivo" está activo.',
                'string.empty': 'La ruta del archivo de logs no puede estar vacía.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 5. timeout (Duración de Escucha)
    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min': 'La duración de la escucha (timeout) debe ser positiva o cero (indefinido).',
    }),

    // 6. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default listenEventsBodySchema;
