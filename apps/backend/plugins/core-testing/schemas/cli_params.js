import Joi from 'joi';

const cliParamsSchema = Joi.object({
    params: Joi.alternatives().try(Joi.object(), Joi.array()).optional(),
}).unknown(true);

export default cliParamsSchema;
