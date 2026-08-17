import Joi from 'joi';

const domSanitizerSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    rules: Joi.array().optional(),
}).unknown(true);

export default domSanitizerSchema;
