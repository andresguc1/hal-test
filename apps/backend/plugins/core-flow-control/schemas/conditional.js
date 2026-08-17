import Joi from 'joi';

const schema = Joi.object({
    variable: Joi.alternatives().try(Joi.string(), Joi.object()),
    operator: Joi.string()
        .valid('equals', 'not_equals', 'contains', 'greater', 'less', 'exists', 'matches')
        .required(),
    value: Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean()).optional(),
}).unknown(true);

export default schema;
