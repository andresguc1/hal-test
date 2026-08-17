import Joi from 'joi';

const headerAuditorSchema = Joi.object({
    url: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    expectedHeaders: Joi.object().optional(),
}).unknown(true);

export default headerAuditorSchema;
