// schemas/assert/body.js

import Joi from 'joi';

const assertionSchema = Joi.object({
    type: Joi.string().required().messages({
        'any.required': 'La propiedad "assertions[].type" es obligatoria.',
        'string.empty': 'La propiedad "assertions[].type" no puede estar vacía.',
    }),
    operator: Joi.string().optional(),
    expected: Joi.any().optional(),
    attribute: Joi.string().allow(null, '').optional(),
    caseSensitive: Joi.boolean().optional(),
    regex: Joi.boolean().optional(),
    regexFlags: Joi.string().allow(null, '').optional(),
    min: Joi.number().optional(),
    max: Joi.number().optional(),
}).unknown(true);

const assertBodySchema = Joi.object({
    target: Joi.object({
        selector: Joi.alternatives().try(Joi.string(), Joi.object()).required().messages({
            'any.required': 'La propiedad "target.selector" es obligatoria.',
        }),
        scope: Joi.string().valid('element', 'collection', 'page').default('element').optional(),
        selectorType: Joi.string().allow(null, '').optional(),
        candidates: Joi.object().optional(),
    })
        .unknown(true)
        .required(),

    assertion: assertionSchema.optional(),
    assertions: Joi.array().items(assertionSchema).min(1).optional(),

    timeout: Joi.number().integer().min(0).default(0).optional(),
    softFail: Joi.boolean().default(false).optional(),
    continueOnError: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
    takeScreenshotOnFailure: Joi.boolean().optional(),

    browserId: Joi.string().allow(null, '').optional(),
}).unknown(true);

export default assertBodySchema;
