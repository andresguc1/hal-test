// schemas/variable/body.js
import Joi from 'joi';

/**
 * Variable node schema
 * Unified node for variable operations (set, get, increment, push)
 */
export default Joi.object({
    operation: Joi.string()
        .valid('set', 'get', 'increment', 'push')
        .required()
        .description('Operation to perform: set, get, increment, or push'),

    name: Joi.string()
        .required()
        .min(1)
        .max(100)
        .pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
        .description('Variable name (alphanumeric + underscore, must start with letter)'),

    value: Joi.alternatives()
        .conditional('operation', {
            is: 'set',
            then: Joi.any().required().description('Value to set'),
        })
        .conditional('operation', {
            is: 'push',
            then: Joi.any().required().description('Value to push to array'),
        })
        .conditional('operation', {
            is: 'increment',
            then: Joi.number().default(1).description('Amount to increment (default: 1)'),
        })
        .description('Value for operation'),

    scope: Joi.string()
        .valid('flow', 'global')
        .default('flow')
        .description('Variable scope: flow (current execution) or global (shared)'),
}).meta({
    description:
        'Unified variable operations: set/get/increment/push values with flow or global scope',
    examples: [
        {
            operation: 'set',
            name: 'counter',
            value: 0,
            scope: 'flow',
        },
        {
            operation: 'get',
            name: 'counter',
            scope: 'flow',
        },
        {
            operation: 'increment',
            name: 'counter',
            value: 1,
            scope: 'flow',
        },
        {
            operation: 'push',
            name: 'items',
            value: 'new item',
            scope: 'flow',
        },
    ],
});
