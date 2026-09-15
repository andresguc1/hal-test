import Joi from 'joi';

const schema = Joi.object({
    target: Joi.object({
        selector: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
        scope: Joi.string().valid('element', 'collection').default('element').optional(),
        selectorType: Joi.string().optional(),
        candidates: Joi.object().optional(),
    })
        .unknown(true)
        .required(),
    snapshotKey: Joi.string().required(),
    property: Joi.string().valid('text', 'value', 'html').default('text').optional(),
    timeout: Joi.number().integer().min(0).optional(),
}).unknown(true);

export default schema;
