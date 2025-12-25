// schemas/intercept_request/body.js

import Joi from 'joi';

const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'ALL', ''];
const allowedActions = ['mock', 'block', 'modify'];

const interceptRequestBodySchema = Joi.object({
    // 1. urlPattern (Requerido)
    urlPattern: Joi.string().trim().required().messages({
        'any.required': 'El patrón de URL a interceptar es obligatorio.',
    }),

    // 2. method (Método HTTP, Opcional)
    method: Joi.string()
        .valid(...allowedMethods)
        .default('POST')
        .uppercase()
        .optional(),

    // 3. action (Acción a Realizar: mock | block | modify)
    action: Joi.string()
        .valid(...allowedActions)
        .default('mock')
        .required()
        .messages({
            'any.required': 'La acción a realizar (mock, block, modify) es obligatoria.',
            'any.only': 'La acción debe ser mock, block o modify.',
        }),

    // 4. responseMock (Cuerpo de Respuesta Mock, Condicional)
    responseMock: Joi.string()
        .optional()
        .allow(null, '')
        .when('action', {
            is: 'mock',
            then: Joi.optional().messages({
                // Nota: Podría ser requerido, pero a veces se mockea vacío. Lo dejamos opcional pero recomendado.
                'string.base': 'responseMock debe ser una cadena JSON.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 5. timeout (Duración de Interceptación)
    timeout: Joi.number().integer().min(0).default(60000).messages({
        'number.min': 'El timeout debe ser positivo o cero.',
    }),

    // Eliminar browserId explícitamente si llega
    browserId: Joi.any().strip(),

    endpoint: Joi.string().optional().allow(''),
});

export default interceptRequestBodySchema;
