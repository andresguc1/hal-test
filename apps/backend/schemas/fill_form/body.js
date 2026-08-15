// schemas/fill_form/body.js

import Joi from 'joi';

const formFieldSchema = Joi.object({
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del campo es obligatorio.',
        'string.empty': 'El selector del campo no puede estar vacío.',
    }),
    value: Joi.alternatives()
        .try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object(), Joi.array())
        .default('')
        .optional(),
    clearBeforeType: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo clearBeforeType debe ser un valor booleano (true/false).',
    }),
    delay: Joi.number().integer().min(0).default(0).optional().messages({
        'number.base': 'El retardo (delay) debe ser un número entero.',
        'number.min': 'El retardo no puede ser negativo.',
    }),
}).required();

const fillFormBodySchema = Joi.object({
    formSelector: Joi.string().trim().required().messages({
        'any.required': 'El selector del formulario es obligatorio.',
        'string.empty': 'El selector del formulario no puede estar vacío.',
    }),
    fields: Joi.array().items(formFieldSchema).min(1).required().messages({
        'any.required': 'Los campos del formulario son obligatorios.',
        'array.base': 'Los campos del formulario deben ser un array de objetos.',
        'array.min': 'Se requiere al menos un campo para rellenar el formulario.',
    }),
    clearBeforeType: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo clearBeforeType debe ser un valor booleano (true/false).',
    }),
    submitAfterFill: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'El campo submitAfterFill debe ser un valor booleano (true/false).',
    }),
    submitSelector: Joi.string().trim().allow('', null).optional().messages({
        'string.base': 'submitSelector debe ser una cadena de texto.',
    }),
    waitForNavigation: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'El campo waitForNavigation debe ser un valor booleano (true/false).',
    }),
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
});

export default fillFormBodySchema;
