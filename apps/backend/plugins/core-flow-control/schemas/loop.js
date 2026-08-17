import Joi from 'joi';

const schema = Joi.object({
    mode: Joi.string().valid('count', 'each', 'while').optional().default('count'),
    count: Joi.number().optional(),
    collection: Joi.alternatives().try(Joi.string(), Joi.array()).optional(),
    condition: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    variable: Joi.string().optional(),
    maxIterations: Joi.number().optional().default(100),
}).unknown(true);

export default schema;
