import Joi from 'joi';

const persistSessionSchema = Joi.object({
    action: Joi.string().valid('save', 'load', 'list', 'delete').optional(),
    name: Joi.string().optional(),
}).unknown(true);

export default persistSessionSchema;
