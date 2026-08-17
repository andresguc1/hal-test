import Joi from 'joi';

const manageStorageSchema = Joi.object({
    action: Joi.string().valid('get', 'set', 'clear').optional(),
    key: Joi.string().optional(),
    value: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    type: Joi.string().valid('localStorage', 'sessionStorage').optional(),
}).unknown(true);

export default manageStorageSchema;
