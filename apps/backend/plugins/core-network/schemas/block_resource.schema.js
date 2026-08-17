import Joi from 'joi';

const schema = Joi.object({
    types: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
    url: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
}).unknown(true);

export default schema;
