import Joi from 'joi';

const fillFormSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    values: Joi.alternatives().try(Joi.array(), Joi.object()).optional(),
}).unknown(true);

export default fillFormSchema;
