// schemas/manage_cookies/body.js

import Joi from 'joi';

const allowedActions = ['get', 'set', 'delete', 'clear'];

const manageCookiesBodySchema = Joi.object({
    // 1. action (Acción sobre Cookies, Requerido)
    action: Joi.string()
        .valid(...allowedActions)
        .required()
        .messages({
            'any.required': 'La acción sobre las cookies (get, set, delete, clear) es obligatoria.',
            'any.only': 'La acción debe ser get, set, delete o clear.',
        }),

    // 2. cookiesData (Datos de Cookies, Condicional)
    cookiesData: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: Joi.valid('set', 'delete'),
            then: Joi.string().required().messages({
                'any.required':
                    'Los datos de las cookies (cookiesData JSON Array) son obligatorios para las acciones "set" o "delete".',
                'string.empty': 'Los datos de las cookies no pueden estar vacíos.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 3. domainFilter (Filtro por Dominio, Opcional)
    domainFilter: Joi.string().trim().optional().allow(null, ''),

    // 4. pathFilter (Filtro por Ruta (Path), Opcional)
    pathFilter: Joi.string().trim().optional().allow(null, ''),

    // 5. variableName (Guardar Resultado, Condicional)
    variableName: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('action', {
            is: 'get',
            then: Joi.string().required().messages({
                'any.required':
                    'El nombre de la variable es obligatorio para la acción "get" para guardar el resultado.',
                'string.empty': 'El nombre de la variable no puede estar vacío.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),
});
// Bloquea cualquier campo extra que no esté definido.
export default manageCookiesBodySchema;
