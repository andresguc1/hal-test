// schemas/generate_data/body.js
import Joi from 'joi';

export default Joi.object({
    description: Joi.string()
        .required()
        .description('Natural language description of data to generate'),

    // Simple field definition for dynamic schema generation
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
        .min(1)
        .required()
        .description('Fields structure to generate'),

    count: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .description('Number of items to generate (if array)'),

    variable: Joi.string().required().description('Variable to store the generated JSON'),
});
