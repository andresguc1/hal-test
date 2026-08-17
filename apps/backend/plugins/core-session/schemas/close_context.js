import Joi from 'joi';

const closeContextSchema = Joi.object({}).unknown(true);

export default closeContextSchema;
