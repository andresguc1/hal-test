// schemas/transform/body.js
import Joi from 'joi';

export default Joi.object({
    operation: Joi.string()
        .valid('map', 'filter', 'reduce', 'merge')
        .required()
        .description('Transform operation'),

    input: Joi.string().required()
        .description('Input array variable (e.g., ${items})'),

    expression: Joi.when('operation', {
        is: Joi.string().valid('map', 'filter'),
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
    }).description('Expression to evaluate for map/filter'),

    mergeWith: Joi.when('operation', {
        is: 'merge',
        then: Joi.string().required(),
        otherwise: Joi.forbidden()
    }).description('Array to merge with'),

    outputVar: Joi.string().required()
        .description('Variable name to store result'),
});
