import Joi from 'joi';

const domSanitizerBodySchema = Joi.object({
    browserId: Joi.string().trim().allow(null, '').optional(),
}).unknown(true);

export default domSanitizerBodySchema;
