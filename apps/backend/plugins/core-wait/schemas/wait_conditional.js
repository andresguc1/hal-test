import Joi from 'joi';

const schema = Joi.object({
    condition: Joi.alternatives().try(Joi.string(), Joi.object()),
    timeout: Joi.number().optional(),
    interval: Joi.number().optional(),
}).unknown(true);

export default schema;
