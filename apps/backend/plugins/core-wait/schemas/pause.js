import Joi from 'joi';

const schema = Joi.object({
    duration: Joi.number().optional().default(1000),
}).unknown(true);

export default schema;
