// schemas/output/body.js
import Joi from 'joi';

/**
 * Output node schema
 */
export default Joi.object({
    name: Joi.string().required().description('Name of the output field to return to parent'),
    value: Joi.any().required().description('Value to return (supports variable interpolation)'),
}).meta({
    description: 'Define an output value for a subflow',
    examples: [
        {
            name: 'totalPrice',
            value: '${sum}',
        },
    ],
});
