import Joi from 'joi';

const schema = Joi.object({
    name: Joi.string().optional(),
    fullPage: Joi.boolean().optional(),
    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    format: Joi.string().valid('png', 'jpeg').optional(),
}).unknown(true);

export default schema;
