import Joi from 'joi';

const schema = Joi.object({
    action: Joi.string().valid('try', 'catch', 'finally', 'throw').optional(),
    errorVariable: Joi.string().optional(),
    message: Joi.string().optional(),
}).unknown(true);

export default schema;
