import Joi from 'joi';

const headerAuditorBodySchema = Joi.object({
    browserId: Joi.string().trim().allow(null, '').optional(),
}).unknown(true);

export default headerAuditorBodySchema;
