import Joi from 'joi';

const schema = Joi.object({
    name: Joi.string().required(),
    value: Joi.alternatives().try(
        Joi.string(),
        Joi.number(),
        Joi.boolean(),
        Joi.object(),
        Joi.array(),
    ),
    operation: Joi.string()
        .valid('set', 'increment', 'decrement', 'append', 'clear')
        .optional()
        .default('set'),
}).unknown(true);

export default schema;
