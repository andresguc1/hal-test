// schemas/validate_semantic/body.js
import Joi from 'joi';

export default Joi.object({
    content: Joi.string().required().description('Content to validate (e.g. ${last_response})'),
    criteria: Joi.string()
        .required()
        .description('Validation criteria (e.g. "Is the tone polite?")'),
    variable: Joi.string()
        .required()
        .description('Variable to store result object {isValid, reasoning}'),
    model: Joi.any().optional(),
    provider: Joi.any().optional(),
    nodeId: Joi.string().optional(),
});
