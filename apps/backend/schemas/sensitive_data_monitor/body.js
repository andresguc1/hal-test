import Joi from 'joi';

const sensitiveDataMonitorBodySchema = Joi.object({
    browserId: Joi.string().trim().allow(null, '').optional(),
    checkInputs: Joi.boolean().default(true),
    checkRequests: Joi.boolean().default(true),
}).unknown(true);

export default sensitiveDataMonitorBodySchema;
