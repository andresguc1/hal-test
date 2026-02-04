// schemas/get_set_content/body.js

import Joi from 'joi';

const allowedActions = ['get', 'set'];
const allowedContentTypes = ['text', 'html', 'attribute'];

const getSetContentBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector para localizar el elemento es obligatorio.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 2. action (Requerido)
    action: Joi.string()
        .valid(...allowedActions)
        .default('get')
        .required()
        .messages({
            'any.required': 'La acción (get/set) es obligatoria.',
            'any.only': 'La acción debe ser "get" (obtener) o "set" (asignar).',
        }),

    // 3. contentType (Opcional) - Tipo de contenido a obtener/establecer
    contentType: Joi.string()
        .valid(...allowedContentTypes)
        .default('text')
        .optional()
        .messages({
            'any.only': 'El tipo de contenido debe ser "text", "html" o "attribute".',
        }),

    // 4. attribute (Condicional) - Nombre del atributo específico
    attribute: Joi.string()
        .trim()
        .when('contentType', {
            is: 'attribute',
            then: Joi.required(),
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required':
                'El nombre del atributo es obligatorio cuando contentType es "attribute".',
            'string.empty': 'El nombre del atributo no puede estar vacío.',
        }),

    // 5. value (Requerido CONDICIONAL)
    value: Joi.string()
        .allow('')
        .when('action', {
            // Si action es 'set', el campo 'value' es obligatorio (puede ser cadena vacía)
            is: 'set',
            then: Joi.required(),
            // Si action es 'get', el campo 'value' es opcional y se ignora.
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'El "value" es obligatorio cuando la acción es "set".',
        }),

    // 6. clearBeforeSet (Opcional)
    clearBeforeSet: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo clearBeforeSet debe ser booleano.',
    }),

    // 7. browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto.',
    }),

    // 8. takeScreenshot (Opcional)
    takeScreenshot: Joi.boolean().default(false).optional(),
});

export default getSetContentBodySchema;
