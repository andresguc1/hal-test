import Joi from 'joi';

const runTestsSchema = Joi.object({
    command: Joi.string().optional(),
    path: Joi.string().optional(),
    framework: Joi.string().optional(),
}).unknown(true);

export default runTestsSchema;
