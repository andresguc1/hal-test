import Joi from 'joi';

const schema = Joi.object({
    input: Joi.alternatives().try(Joi.string(), Joi.object()),
    expression: Joi.alternatives().try(Joi.string(), Joi.object()),
    output: Joi.string().optional(),
}).unknown(true);

export default schema;
