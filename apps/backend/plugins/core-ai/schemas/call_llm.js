import Joi from 'joi';
export default Joi.object({
    prompt: Joi.string().allow('', null).optional(),
    system: Joi.string().allow('', null).optional(),
    model: Joi.any().optional(),
    maxTokens: Joi.number().integer().min(1).optional(),
    temperature: Joi.number().min(0).max(2).optional(),
    variableName: Joi.string().required(),
    provider: Joi.any().optional(),
    nodeId: Joi.string().optional(),
    browserId: Joi.string().optional(),
    injectBrowserContext: Joi.boolean().optional(),
}).unknown(true);
