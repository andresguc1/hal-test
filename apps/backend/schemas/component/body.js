// schemas/component/body.js
import Joi from 'joi';

/**
 * Component (Subflow) node schema
 */
export default Joi.object({
    flowId: Joi.string().required().description('ID of the subflow to execute'),

    // Additional parameters for subflow could be added here in the future
    parameters: Joi.object().optional().description('Input parameters for the subflow'),
}).meta({
    description: 'Execute a subflow (component) recursively',
    examples: [
        {
            flowId: 'some-guid-id',
        },
    ],
});
