import Joi from 'joi';

const schema = Joi.object({
    enable: Joi.boolean().optional().default(true),
    patterns: Joi.array().optional(),
}).unknown(true);

export default schema;
