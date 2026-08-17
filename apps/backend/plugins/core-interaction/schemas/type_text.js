import Joi from 'joi';

const typeTextSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    text: Joi.alternatives().try(Joi.string(), Joi.object()),
    clear: Joi.boolean().optional(),
    delay: Joi.number().optional(),
    pressEnter: Joi.boolean().optional(),
}).unknown(true);

export default typeTextSchema;
