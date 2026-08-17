import Joi from 'joi';

const schema = Joi.object({
    variable: Joi.alternatives().try(Joi.string(), Joi.object()),
    cases: Joi.array().optional(),
    defaultCase: Joi.string().optional(),
}).unknown(true);

export default schema;
