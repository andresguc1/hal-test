import Joi from 'joi';

const saveResultsSchema = Joi.object({
    path: Joi.string().required(),
    data: Joi.alternatives().try(Joi.string(), Joi.object(), Joi.array()),
    format: Joi.string().valid('text', 'json', 'csv').optional(),
}).unknown(true);

export default saveResultsSchema;
