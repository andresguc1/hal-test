import Joi from 'joi';

const schema = Joi.object({
    componentId: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
    inputs: Joi.object().optional(),
}).unknown(true);

export default schema;
