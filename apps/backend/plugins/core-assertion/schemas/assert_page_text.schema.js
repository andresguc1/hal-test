import Joi from 'joi';

const schema = Joi.object({
    text: Joi.alternatives().try(Joi.string(), Joi.object()),
    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    contains: Joi.boolean().optional(),
    caseSensitive: Joi.boolean().optional(),
}).unknown(true);

export default schema;
