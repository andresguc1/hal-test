import Joi from 'joi';

const pauseBodySchema = Joi.object({
    duration: Joi.number().integer().min(0).default(1000).messages({
        'number.base': 'Duration must be a number (ms)',
        'number.min': 'Duration cannot be negative',
    }),
});

export default pauseBodySchema;
