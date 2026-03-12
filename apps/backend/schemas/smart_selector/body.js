import Joi from 'joi';

const smartSelectorBodySchema = Joi.object({
    browserId: Joi.string().required(),
    originalSelector: Joi.string().required(),
    intent: Joi.string().required(),
    variableName: Joi.string().default('suggestedSelector'),
    maxTokens: Joi.number().integer().min(1).default(2048),
    nodeId: Joi.string().optional(),
}).unknown();

export default smartSelectorBodySchema;
