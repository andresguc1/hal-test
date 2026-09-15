import Joi from 'joi';

const assertionSchema = Joi.object({
    type: Joi.string()
        .valid(
            'existence',
            'visibility',
            'text',
            'value',
            'attribute',
            'count',
            'state',
            'css_property',
            'page',
            'mutability',
        )
        .required(),
    operator: Joi.string().optional(),
    expected: Joi.any().optional(),
    attribute: Joi.string().allow(null, '').optional(),
    caseSensitive: Joi.boolean().optional(),
    regex: Joi.boolean().optional(),
    regexFlags: Joi.string().allow(null, '').optional(),
    min: Joi.number().optional(),
    max: Joi.number().optional(),
    // Mutability-specific fields
    snapshotKey: Joi.string().optional(),
    property: Joi.string().valid('text', 'value', 'html').optional(),
    trimWhitespace: Joi.boolean().optional(),
    cssProperty: Joi.string().allow(null, '').optional(),
}).unknown(true);

const schema = Joi.object({
    target: Joi.object({
        selector: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
        scope: Joi.string().valid('element', 'collection', 'page').default('element').optional(),
        selectorType: Joi.string().optional(),
        candidates: Joi.object().optional(),
    })
        .unknown(true)
        .required(),
    assertion: assertionSchema.optional(),
    assertions: Joi.array().items(assertionSchema).optional(),
    timeout: Joi.number().integer().min(0).optional(),
    softFail: Joi.boolean().default(false).optional(),
}).unknown(true);

export default schema;
