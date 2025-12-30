// schemas/loop/body.js
import Joi from 'joi';

export default Joi.object({
    mode: Joi.string()
        .valid('count', 'while', 'forEach')
        .required()
        .description('Loop mode: count (N iterations), while (condition), forEach (array)'),

    // For count mode
    iterations: Joi.when('mode', {
        is: 'count',
        then: Joi.number().integer().min(1).max(1000).required(),
        otherwise: Joi.forbidden(),
    }),

    // For while mode
    condition: Joi.when('mode', {
        is: 'while',
        then: Joi.string().required(),
        otherwise: Joi.forbidden(),
    }),

    // For forEach mode
    array: Joi.when('mode', {
        is: 'forEach',
        then: Joi.string().required(),
        otherwise: Joi.forbidden(),
    }),

    itemVar: Joi.when('mode', {
        is: 'forEach',
        then: Joi.string().required(),
        otherwise: Joi.forbidden(),
    }),

    maxIterations: Joi.number()
        .integer()
        .min(1)
        .max(10000)
        .default(1000)
        .description('Safety limit for while loops'),
});
