import Joi from 'joi';

const hoverSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
}).unknown(true);

export default hoverSchema;
