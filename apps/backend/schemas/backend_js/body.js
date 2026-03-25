import Joi from 'joi';

const backendJsBodySchema = Joi.object({
    expression: Joi.string().required().messages({
        'string.empty': 'Expression is required',
        'any.required': 'Expression is required',
    }),
    outputVar: Joi.string().optional().default('backendResult'),
    nodeId: Joi.string().optional(),
    runId: Joi.string().optional(),
    browserId: Joi.string().optional().allow(null),
});

export default backendJsBodySchema;
