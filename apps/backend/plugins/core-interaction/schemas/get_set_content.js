import Joi from 'joi';

const getSetContentSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    action: Joi.string().valid('get', 'set').optional(),
    value: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
}).unknown(true);

export default getSetContentSchema;
