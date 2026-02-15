// schemas/manage_session/body.js

import Joi from 'joi';

const allowedTargets = ['cookie', 'local_storage', 'session_storage', 'header', 'query'];
const allowedActions = ['get', 'set', 'delete', 'clear'];

const manageSessionBodySchema = Joi.object({
    // 1. target (Destino: cookie, storage, header, query)
    target: Joi.string()
        .valid(...allowedTargets)
        .required()
        .messages({
            'any.required': 'El destino de sesión (target) es obligatorio.',
            'any.only':
                'El target debe ser cookie, local_storage, session_storage, header o query.',
        }),

    // 2. action (Acción: get, set, delete, clear)
    action: Joi.string()
        .valid(...allowedActions)
        .required()
        .messages({
            'any.required': 'La acción es obligatoria (get, set, delete, clear).',
        }),

    // 3. key (Nombre de la clave/cookie/header)
    key: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: Joi.valid('get', 'set', 'delete'),
            then: Joi.string().required().messages({
                'any.required': 'La clave (key) es obligatoria para get, set o delete.',
            }),
        }),

    // 4. value (Valor para inyectar/set)
    value: Joi.string()
        .optional()
        .allow(null, '')
        .when('action', {
            is: 'set',
            then: Joi.string().required().messages({
                'any.required': 'El valor (value) es obligatorio para la acción set.',
            }),
        }),

    // 5. variableName (Para guardar el resultado de get)
    variableName: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: 'get',
            then: Joi.string().required().messages({
                'any.required': 'El nombre de la variable es obligatorio para la acción get.',
            }),
        }),

    // 6. cookiesData (Soporte para bulk cookies si es necesario, JSON string)
    cookiesData: Joi.string().optional().allow(null, ''),
});

export default manageSessionBodySchema;
