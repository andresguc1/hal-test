import Joi from 'joi';

const schema = Joi.object({
    timeout: Joi.number().optional(),
}).unknown(true);

export default schema;
