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
    description: Joi.string().optional(),
}).unknown(true);

export default schema;
