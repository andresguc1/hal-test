import Joi from 'joi';

const schema = Joi.object({
    url: Joi.alternatives().try(Joi.string().uri(), Joi.object()),
    waitUntil: Joi.string().valid('load', 'domcontentloaded', 'networkidle').optional(),
    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
}).unknown(true);

export default schema;
