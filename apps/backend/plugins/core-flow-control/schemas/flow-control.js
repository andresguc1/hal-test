import Joi from 'joi';

const schema = Joi.object({
    action: Joi.string()
        .valid('start', 'end', 'pause', 'resume', 'skip')
        .optional()
        .default('start'),
}).unknown(true);

export default schema;
