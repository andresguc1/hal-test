import Joi from 'joi';

const schema = Joi.object({
    events: Joi.alternatives().try(Joi.array(), Joi.string()),
    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
}).unknown(true);

export default schema;
