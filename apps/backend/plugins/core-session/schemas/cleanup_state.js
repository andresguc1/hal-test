import Joi from 'joi';

const cleanupStateSchema = Joi.object({
    cookies: Joi.boolean().optional().default(true),
    storage: Joi.boolean().optional().default(true),
}).unknown(true);

export default cleanupStateSchema;
