import Joi from 'joi';

const schema = Joi.object({
    headers: Joi.alternatives().try(Joi.object(), Joi.array()),
    mode: Joi.string().valid('set', 'merge', 'remove').optional().default('merge'),
}).unknown(true);

export default schema;
