import Joi from 'joi';

const schema = Joi.object({
    collection: Joi.alternatives().try(Joi.string(), Joi.array()).required(),
    variable: Joi.string().required(),
    indexVariable: Joi.string().optional(),
}).unknown(true);

export default schema;
