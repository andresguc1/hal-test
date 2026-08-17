import Joi from 'joi';

const schema = Joi.object({
    url: Joi.alternatives().try(Joi.string(), Joi.object()),
    status: Joi.number().optional().default(200),
    body: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    contentType: Joi.string().optional(),
}).unknown(true);

export default schema;
