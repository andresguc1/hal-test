import Joi from 'joi';

const callLlmBodySchema = Joi.object({
    prompt: Joi.string().required().messages({
        'string.empty': 'User prompt is required',
    }),
    system: Joi.string().allow('').optional(),
    model: Joi.string().optional().default('gpt-4o-mini'),
    maxTokens: Joi.number().integer().min(1).optional(),
    temperature: Joi.number().min(0).max(1).optional(),
    variableName: Joi.string().required(),
    provider: Joi.string()
        .valid('openai', 'grok', 'anthropic', 'google')
        .optional()
        .default('openai'),
});

export default callLlmBodySchema;
