import Joi from 'joi';

const schema = Joi.object({
    name: Joi.string().optional(),
    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    format: Joi.string().valid('html', 'json').optional(),
}).unknown(true);

export default schema;
