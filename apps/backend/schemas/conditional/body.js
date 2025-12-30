// schemas/conditional/body.js
import Joi from 'joi';

/**
 * Conditional node schema
 * Evaluates conditions and routes execution based on true/false result
 */
export default Joi.object({
    conditions: Joi.array()
        .items(
            Joi.object({
                left: Joi.alternatives()
                    .try(Joi.string(), Joi.number(), Joi.boolean())
                    .required()
                    .description('Left operand (can include ${variable} interpolation)'),

                operator: Joi.string()
                    .valid('===', '!==', '>', '<', '>=', '<=', 'contains', 'exists')
                    .required()
                    .description('Comparison operator'),

                right: Joi.when('operator', {
                    is: 'exists',
                    then: Joi.forbidden(),
                    otherwise: Joi.alternatives()
                        .try(Joi.string(), Joi.number(), Joi.boolean())
                        .required(),
                }).description('Right operand (not required for "exists" operator)'),
            }),
        )
        .min(1)
        .required()
        .description('Array of conditions to evaluate'),

    logic: Joi.string()
        .valid('AND', 'OR')
        .default('AND')
        .description(
            'Logic operator for multiple conditions: AND (all must be true) or OR (at least one must be true)',
        ),
}).meta({
    description: 'Evaluates conditions and determines true/false execution path',
    examples: [
        {
            conditions: [{ left: '${counter}', operator: '>', right: 10 }],
            logic: 'AND',
        },
        {
            conditions: [
                { left: '${status}', operator: '===', right: 'success' },
                { left: '${retries}', operator: '<', right: 3 },
            ],
            logic: 'AND',
        },
        {
            conditions: [{ left: '${name}', operator: 'contains', right: 'test' }],
        },
        {
            conditions: [{ left: '${optionalVar}', operator: 'exists' }],
        },
    ],
});
