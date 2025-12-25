// schemas/control_exceptions/body.js

import Joi from 'joi';

const allowedExceptionTypes = [
    'all',
    'navigation',
    'timeout',
    'elementNotFound',
    'network',
    'custom',
];
const allowedActions = ['ignore', 'log', 'retry', 'abort'];

const controlExceptionsBodySchema = Joi.object({
    // 1. exceptionType (Tipo de Excepción a Capturar, Requerido)
    exceptionType: Joi.string()
        .valid(...allowedExceptionTypes)
        .required()
        .messages({
            'any.required': 'El tipo de excepción a capturar es obligatorio.',
        }),

    // 2. action (Acción a Realizar, Requerido)
    action: Joi.string()
        .valid(...allowedActions)
        .default('log')
        .required()
        .messages({
            'any.required': 'La acción a realizar (ignore, log, retry, abort) es obligatoria.',
        }),

    // 3. maxRetries (Máximo de Reintentos, Condicional)
    maxRetries: Joi.number()
        .integer()
        .min(0)
        .default(0)
        .optional()
        .when('action', {
            is: 'retry',
            then: Joi.number().min(1).required().messages({
                'any.required':
                    'El número máximo de reintentos (maxRetries) debe ser al menos 1 para la acción "retry".',
                'number.min': 'El máximo de reintentos debe ser al menos 1.',
            }),
            otherwise: Joi.optional(),
        }),

    // 4. logFile (Ruta del Archivo de Log, Condicional)
    logFile: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: Joi.valid('log', 'retry'),
            then: Joi.string().required().messages({
                'any.required':
                    'La ruta del archivo de log (logFile) es obligatoria para las acciones "log" o "retry".',
                'string.empty': 'La ruta del archivo de log no puede estar vacía.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 5. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para establecer la regla.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default controlExceptionsBodySchema;
