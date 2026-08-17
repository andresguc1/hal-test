import Joi from 'joi';

const manageSessionSchema = Joi.object({
    action: Joi.string().valid('create', 'restore', 'clear').optional(),
    sessionId: Joi.string().optional(),
}).unknown(true);

export default manageSessionSchema;
