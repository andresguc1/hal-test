import Joi from 'joi';

const schema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string()
        .valid('string', 'number', 'boolean', 'object', 'array')
        .optional()
        .default('string'),
    default: Joi.alternatives()
        .try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object())
        .optional(),
    required: Joi.boolean().optional().default(false),
}).unknown(true);

export default schema;
