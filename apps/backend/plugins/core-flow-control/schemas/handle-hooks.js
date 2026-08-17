import Joi from 'joi';

const schema = Joi.object({
    event: Joi.string()
        .valid('before', 'after', 'onError', 'onSuccess')
        .optional()
        .default('after'),
    action: Joi.string().optional(),
}).unknown(true);

export default schema;
