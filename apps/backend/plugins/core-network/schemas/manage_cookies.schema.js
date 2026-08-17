import Joi from 'joi';

const schema = Joi.object({
    action: Joi.string().valid('add', 'get', 'delete', 'clear').optional(),
    cookies: Joi.array().optional(),
    url: Joi.string().optional(),
    name: Joi.string().optional(),
}).unknown(true);

export default schema;
