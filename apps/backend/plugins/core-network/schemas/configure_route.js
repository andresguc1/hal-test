import Joi from 'joi';

const schema = Joi.object({
    url: Joi.alternatives().try(Joi.string(), Joi.object()),
    actions: Joi.array().optional(),
}).unknown(true);

export default schema;
