// schemas/inject_tokens/body.js

import Joi from 'joi';

const allowedTargets = ['header', 'cookie', 'query'];

const injectTokensBodySchema = Joi.object({
    // 1. target (Destino de Inyección, Requerido)
    target: Joi.string()
        .valid(...allowedTargets)
        .required()
        .messages({
            'any.required': 'El destino de inyección (target) es obligatorio.',
            'any.only': 'El target debe ser header, cookie o query.',
        }),

    // 2. key (Nombre de la Clave/Cabecera/Cookie, Requerido)
    key: Joi.string().trim().required().messages({
        'any.required': 'El nombre de la clave, cabecera o cookie es obligatorio.',
    }),

    // 3. value (Valor del Token, Requerido)
    value: Joi.string().required().messages({
        'any.required': 'El valor del token a inyectar es obligatorio.',
    }),
});

export default injectTokensBodySchema;
