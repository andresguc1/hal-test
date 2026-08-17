import Joi from 'joi';

const selectOptionSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    value: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    label: Joi.string().optional(),
}).unknown(true);

export default selectOptionSchema;
