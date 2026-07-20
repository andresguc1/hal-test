import Joi from 'joi';

const auditPolicyBodySchema = Joi.object({
    browserId: Joi.string().trim().allow(null, '').optional(),
    checkCSP: Joi.boolean().default(true),
    checkHeaders: Joi.boolean().default(true),
}).unknown(true);

export default auditPolicyBodySchema;
