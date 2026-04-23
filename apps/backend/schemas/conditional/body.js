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
        .description('Array of conditions to evaluate (Legacy)'),

    logic: Joi.string()
        .valid('AND', 'OR')
        .default('AND')
        .description(
            'Logic operator for multiple conditions: AND (all must be true) or OR (at least one must be true)',
        ),

    branches: Joi.array()
        .items(
            Joi.object({
                id: Joi.string().required().description('Route Identifier (e.g. "auth_success")'),
                label: Joi.string()
                    .required()
                    .description('Display label for the UI (e.g. "Is Logged In")'),
                expression: Joi.alternatives([
                    Joi.string().allow(''),
                    Joi.object({
                        left: Joi.alternatives()
                            .try(Joi.string(), Joi.number(), Joi.boolean())
                            .allow('')
                            .required(),
                        operator: Joi.string()
                            .valid(
                                '===',
                                '==',
                                '!==',
                                '!=',
                                '>',
                                '<',
                                '>=',
                                '<=',
                                'contains',
                                'exists',
                            )
                            .required(),
                        right: Joi.alternatives()
                            .try(Joi.string(), Joi.number(), Joi.boolean())
                            .allow('')
                            .optional(),
                    }),
                ]).description(
                    'Javascript expression (string) or Structured Rule (object). Leave empty for Default branch.',
                ),
            }),
        )
        .min(1)
        .required()
        .description('Dynamic output branches mapping conditions to route paths'),

    fallbackPath: Joi.string()
        .default('false')
        .description('Fallback destination ID to use if no branch matches (default: "false")'),
})
    .or('conditions', 'branches')
    .unknown(true)
    .meta({
        description:
            'Evaluates conditions and determines execution path (supports dual or multiple dynamic branches)',
        examples: [
            {
                conditions: [{ left: '${counter}', operator: '>', right: 10 }],
                logic: 'AND',
            },
            {
                branches: [
                    { id: 'admin', label: 'Is Admin', expression: '${role} === "admin"' },
                    { id: 'user', label: 'Is User', expression: '${role} === "user"' },
                ],
                fallbackPath: 'false',
            },
        ],
    });
