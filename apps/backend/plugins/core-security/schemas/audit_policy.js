import Joi from 'joi';

const auditPolicySchema = Joi.object({
    policy: Joi.string().optional(),
    url: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
}).unknown(true);

export default auditPolicySchema;
