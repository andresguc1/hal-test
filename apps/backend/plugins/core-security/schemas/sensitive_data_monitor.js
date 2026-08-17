import Joi from 'joi';

const sensitiveDataMonitorSchema = Joi.object({
    patterns: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
    action: Joi.string().valid('log', 'block', 'alert').optional().default('log'),
}).unknown(true);

export default sensitiveDataMonitorSchema;
