import Joi from 'joi';

const readDataSchema = Joi.object({
    path: Joi.string().required(),
    encoding: Joi.string().optional(),
    format: Joi.string().valid('text', 'json', 'csv').optional(),
}).unknown(true);

export default readDataSchema;
