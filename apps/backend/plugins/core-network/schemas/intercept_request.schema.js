import Joi from 'joi';

const schema = Joi.object({
    url: Joi.alternatives().try(Joi.string(), Joi.object()),
    route: Joi.string().optional(),
    handler: Joi.string().valid('fulfill', 'abort', 'continue').optional(),
}).unknown(true);

export default schema;
