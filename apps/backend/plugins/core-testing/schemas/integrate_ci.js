import Joi from 'joi';

const integrateCiSchema = Joi.object({
    platform: Joi.string().valid('github', 'gitlab', 'jenkins', 'custom').optional(),
    config: Joi.alternatives().try(Joi.object(), Joi.string()).optional(),
}).unknown(true);

export default integrateCiSchema;
