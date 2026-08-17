import Joi from 'joi';

const schema = Joi.object({
    condition: Joi.alternatives().try(Joi.string(), Joi.object()),
    trueBranch: Joi.string().optional(),
    falseBranch: Joi.string().optional(),
}).unknown(true);

export default schema;
