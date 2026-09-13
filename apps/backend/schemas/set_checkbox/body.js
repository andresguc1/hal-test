// schemas/set_checkbox/body.js

import Joi from 'joi';

const allowedActions = ['check', 'uncheck', 'toggle'];

const checkboxFieldSchema = Joi.object({
    // 1a. strategy (css | label)
    strategy: Joi.string().valid('css', 'label').default('css').messages({
        'any.only': 'La estrategia debe ser "css" (selector) o "label" (texto visible).',
    }),

    // 1b. target — selector CSS en modo css, texto visible en modo label
    target: Joi.string().trim().required().messages({
        'any.required': 'El target del checkbox es obligatorio.',
        'string.empty': 'El target del checkbox no puede estar vacío.',
    }),

    // 1c. action (check | uncheck | toggle)
    action: Joi.string()
        .valid(...allowedActions)
        .default('check')
        .messages({
            'any.only': 'La acción debe ser "check", "uncheck" o "toggle".',
        }),
}).unknown(true);

const setCheckboxBodySchema = Joi.object({
    // Modo único — selector es obligatorio salvo que se use el array fields.
    selector: Joi.string().trim().allow('', null).optional(),

    // action (check | uncheck | toggle) — solo aplica en modo único.
    action: Joi.string()
        .valid(...allowedActions)
        .default('check')
        .messages({
            'any.only': 'La acción debe ser "check", "uncheck" o "toggle".',
        }),

    // Modo múltiple — lista de checkboxes a procesar en un solo paso.
    fields: Joi.array().items(checkboxFieldSchema).min(1).optional().messages({
        'array.min': 'Si usas "fields", debes incluir al menos un checkbox.',
        'array.base': 'fields debe ser una lista de checkboxes.',
    }),

    // timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(0).default(0).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // verifyState — verifica el estado final del checkbox tras la acción
    // (equivalente a expect(locator).toBeChecked()). Deshabilitable.
    verifyState: Joi.boolean().default(true).messages({
        'boolean.base': 'verifyState debe ser un valor booleano.',
    }),

    // browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
})
    .custom((value, helpers) => {
        const hasFields = Array.isArray(value.fields) && value.fields.length > 0;
        const hasSelector = typeof value.selector === 'string' && value.selector.trim() !== '';
        if (!hasFields && !hasSelector) {
            return helpers.error('set_checkbox.selector_or_fields');
        }
        return value;
    })
    .messages({
        'set_checkbox.selector_or_fields':
            'Proporciona un selector del checkbox o una lista de campos (fields).',
    })
    .unknown(true);
// unknown(true) permite extender la configuración sin romper flujos existentes.

export default setCheckboxBodySchema;
