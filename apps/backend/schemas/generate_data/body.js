// schemas/generate_data/body.js
import Joi from 'joi';

export default Joi.object({
    description: Joi.string()
        .allow('', null)
        .optional()
        .description('Natural language description of data to generate'),

    expectedFormat: Joi.string()
        .valid('json', 'csv', 'text')
        .default('json')
        .description('Desired output format'),

    // Fields can be optional if description is clear
    fields: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required(),
                type: Joi.string()
                    .valid('string', 'number', 'boolean', 'array', 'object')
                    .required(),
                description: Joi.string().optional(),
            }),
        )
        .optional()
        .description('Explicit fields structure to generate (optional)'),

    count: Joi.number().integer().min(1).default(1).description('Number of items to generate'),

    variableName: Joi.string().required().description('Variable to store the generated data'),

    variable: Joi.string().optional().description('Alias for variableName'),

    maxTokens: Joi.number().integer().min(1).default(2048),
    nodeId: Joi.string().optional(),
    browserId: Joi.string().optional(),
    injectBrowserContext: Joi.boolean().optional(),
}).unknown();
