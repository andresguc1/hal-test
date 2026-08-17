import Joi from 'joi';

const inputSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('string', 'number', 'boolean', 'any').required(),
    required: Joi.boolean().optional().default(false),
    description: Joi.string().optional(),
    defaultValue: Joi.any().optional(),
});

const outputSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('string', 'number', 'boolean', 'any', 'object', 'array').required(),
    description: Joi.string().optional(),
});

const componentV1BodySchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    version: Joi.string().optional().default('1.0.0'),
    description: Joi.string().allow('', null).optional(),
    category: Joi.string().optional().default('general'),
    author: Joi.string().optional(),
    inputs: Joi.array().items(inputSchema).optional().default([]),
    outputs: Joi.array().items(outputSchema).optional().default([]),
    nodes: Joi.array().required(),
    edges: Joi.array().required(),
    metadata: Joi.object({
        tags: Joi.array().items(Joi.string()).optional(),
        usageCount: Joi.number().integer().optional().default(0),
        lastUsedAt: Joi.date().optional(),
    }).optional(),
}).unknown(false);

export default componentV1BodySchema;
