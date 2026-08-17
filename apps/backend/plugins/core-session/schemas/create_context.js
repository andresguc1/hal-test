import Joi from 'joi';

const createContextSchema = Joi.object({
    storageState: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    viewport: Joi.object().optional(),
}).unknown(true);

export default createContextSchema;
