import Joi from 'joi';

const schema = Joi.object({
    code: Joi.string().required(),
    timeout: Joi.number().optional(),
}).unknown(true);

export default schema;
