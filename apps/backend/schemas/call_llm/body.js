import Joi from 'joi';

const callLlmBodySchema = Joi.object({
    prompt: Joi.string().allow('', null).optional().messages({
        'string.empty': 'User prompt is required',
    }),
    system: Joi.string().allow('', null).optional(),
    model: Joi.any().optional(),
    maxTokens: Joi.number().integer().min(1).optional(),
    temperature: Joi.number().min(0).max(2).optional(),
    variableName: Joi.string().required(),
    provider: Joi.any().optional(),
    nodeId: Joi.string().optional(),
    browserId: Joi.string().optional(),
    injectBrowserContext: Joi.boolean().optional(),
    debugMode: Joi.boolean().optional(),
}).unknown();

export default callLlmBodySchema;
