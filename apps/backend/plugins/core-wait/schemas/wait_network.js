import Joi from 'joi';

const schema = Joi.object({
    idle: Joi.boolean().optional().default(true),
    timeout: Joi.number().optional(),
}).unknown(true);

export default schema;
