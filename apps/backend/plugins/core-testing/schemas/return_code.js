import Joi from 'joi';

const returnCodeSchema = Joi.object({
    code: Joi.number().optional().default(0),
    message: Joi.string().optional(),
}).unknown(true);

export default returnCodeSchema;
