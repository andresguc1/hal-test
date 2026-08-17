import Joi from 'joi';

const cspValidatorSchema = Joi.object({
    url: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    policy: Joi.string().optional(),
}).unknown(true);

export default cspValidatorSchema;
