import Joi from 'joi';

const clickSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    waitAfter: Joi.number().optional(),
}).unknown(true);

export default clickSchema;
