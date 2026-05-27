// schemas/loop/body.js
import Joi from 'joi';

export default Joi.object({
    loopType: Joi.string()
        .valid('for', 'while')
        .default('for')
        .description('Loop type: for (expression/count), while (condition)'),

    // For backward-compatibility with older tests
    mode: Joi.string()
        .valid('count', 'while', 'array', 'forEach', 'each')
        .optional()
        .description('Legacy loop mode'),

    iterations: Joi.alternatives()
        .try(Joi.number().integer().min(0).max(10000), Joi.string().allow('', null))
        .optional()
        .description('Number of iterations or template/expression'),

    condition: Joi.string().allow('', null).optional().description('While loop expression'),

    executionMode: Joi.string()
        .valid('sequential', 'parallel')
        .default('sequential')
        .description('Iteration execution strategy'),

    concurrencyLimit: Joi.number().integer().min(1).max(100).default(5),

    breakOnError: Joi.boolean().default(true),
    collectResults: Joi.boolean().default(true),

    maxIterations: Joi.number()
        .integer()
        .min(1)
        .max(10000)
        .default(1000)
        .description('Safety limit for execution loops'),

    flowId: Joi.string().optional().allow('', null).description('Encapsulated sub-flow ID'),

    // Keep optional legacy keys to ensure zero backward compatibility break
    array: Joi.any().optional(),
    itemVar: Joi.string().optional(),
    indexVar: Joi.string().optional(),
});
