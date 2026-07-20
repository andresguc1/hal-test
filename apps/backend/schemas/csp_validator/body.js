import Joi from 'joi';

const cspValidatorBodySchema = Joi.object({
    browserId: Joi.string().trim().allow(null, '').optional(),
}).unknown(true);

export default cspValidatorBodySchema;
