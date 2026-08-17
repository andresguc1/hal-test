import Joi from 'joi';

const injectTokensSchema = Joi.object({
    tokens: Joi.alternatives().try(Joi.object(), Joi.array()),
    type: Joi.string().valid('cookies', 'headers', 'localStorage').optional(),
}).unknown(true);

export default injectTokensSchema;
