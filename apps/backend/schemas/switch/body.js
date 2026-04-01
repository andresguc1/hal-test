// schemas/switch/body.js

import Joi from 'joi';

const switchBodySchema = Joi.object({
    variableName: Joi.string().trim().required().messages({
        'any.required': 'El nombre de la variable es obligatorio.',
    }),
    cases: Joi.alternatives()
        .try(Joi.object(), Joi.string(), Joi.array().items(Joi.any()))
        .required()
        .messages({
            'any.required': 'Los casos del switch son obligatorios.',
        }),
    scope: Joi.string().valid('flow', 'global').default('flow'),
});

export default switchBodySchema;
