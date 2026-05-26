// schemas/variable/body.js
import Joi from 'joi';

/**
 * Variable node Joi schema
 * Unified node validation supporting set, get, increment, push, delete, type constraints, and dot-notation paths.
 */
export default Joi.object({
    operation: Joi.string()
        .valid('set', 'get', 'increment', 'push', 'delete')
        .required()
        .description('Operation to perform: set, get, increment, push, or delete'),

    name: Joi.string()
        .required()
        .min(1)
        .max(100)
        .pattern(/^[a-zA-Z_][a-zA-Z0-9_.]*$/)
        .description(
            'Variable name (alphanumeric, underscores, and dots for path drilling; must start with a letter)',
        ),

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
        .conditional('operation', {
            is: 'delete',
            then: Joi.any()
                .forbidden()
                .description('No value should be provided for delete operation'),
        })
        .description('Value for operation'),

    type: Joi.string()
        .valid('string', 'number', 'boolean', 'object', 'array', 'any')
        .default('any')
        .description('Explicit variable type constraint to validate against'),

    scope: Joi.string()
        .valid('flow', 'global')
        .default('flow')
        .description('Variable scope: flow (current execution) or global (shared)'),
}).meta({
    description:
        'Unified variable operations: set/get/increment/push/delete values with scope, types, and dot-notation paths',
    examples: [
        {
            operation: 'set',
            name: 'user.profile.age',
            value: 30,
            type: 'number',
            scope: 'flow',
        },
        {
            operation: 'get',
            name: 'user.profile.age',
            scope: 'flow',
        },
        {
            operation: 'delete',
            name: 'temp_data',
            scope: 'flow',
        },
    ],
});
