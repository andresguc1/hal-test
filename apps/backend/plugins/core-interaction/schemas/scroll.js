import Joi from 'joi';

const scrollSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    direction: Joi.string().valid('up', 'down', 'left', 'right').optional(),
    amount: Joi.number().optional(),
}).unknown(true);

export default scrollSchema;
