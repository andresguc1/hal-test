import Joi from 'joi';

const schema = Joi.object({
    url: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    method: Joi.string().optional(),
    timeout: Joi.number().optional(),
}).unknown(true);

export default schema;
