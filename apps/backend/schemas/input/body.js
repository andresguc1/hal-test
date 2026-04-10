// schemas/input/body.js
import Joi from 'joi';

/**
 * Input node schema
 */
export default Joi.object({
    name: Joi.string().required().description('Name of the input parameter'),
    defaultValue: Joi.any().optional().description('Default value if not provided by parent'),
    description: Joi.string().optional().description('Description of the parameter'),
}).meta({
    description: 'Define an input parameter for a subflow',
    examples: [
        {
            name: 'userName',
            defaultValue: 'Guest',
        },
    ],
});
