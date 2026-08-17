import Joi from 'joi';

const schema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    state: Joi.string().valid('attached', 'detached', 'visible', 'hidden').optional(),
    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
}).unknown(true);

export default schema;
