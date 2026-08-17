import Joi from 'joi';

const schema = Joi.object({
    waitUntil: Joi.string().valid('load', 'domcontentloaded', 'networkidle').optional(),
    timeout: Joi.number().optional(),
}).unknown(true);

export default schema;
