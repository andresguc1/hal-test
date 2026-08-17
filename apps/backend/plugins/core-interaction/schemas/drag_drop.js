import Joi from 'joi';

const dragDropSchema = Joi.object({
    source: Joi.alternatives().try(Joi.string(), Joi.object()),
    target: Joi.alternatives().try(Joi.string(), Joi.object()),
}).unknown(true);

export default dragDropSchema;
