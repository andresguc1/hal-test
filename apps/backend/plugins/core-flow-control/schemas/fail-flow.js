import Joi from 'joi';

const schema = Joi.object({
    message: Joi.string().optional().default('Flow failed'),
    code: Joi.string().optional(),
    critical: Joi.boolean().optional().default(true),
}).unknown(true);

export default schema;
