import Joi from 'joi';

const pluginRefSchema = Joi.object({
    id: Joi.string().required(),
    version: Joi.string().optional(),
    enabled: Joi.boolean().optional().default(true),
});

const fileRefSchema = Joi.object({
    ref: Joi.string().required(),
    order: Joi.number().integer().optional(),
});

const projectV2BodySchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    version: Joi.string().optional().default('2.0.0'),
    description: Joi.string().allow('', null).optional(),
    config: Joi.object({
        defaultBrowser: Joi.string()
            .valid('chromium', 'firefox', 'webkit')
            .optional()
            .default('chromium'),
        baseURL: Joi.string().uri().optional(),
        auth: Joi.object({
            provider: Joi.string().valid('none', 'supabase', 'custom').optional().default('none'),
        }).optional(),
        ai: Joi.object({
            defaultProvider: Joi.string().optional().default('ollama'),
            defaultModel: Joi.string().optional(),
        }).optional(),
    }).optional(),
    plugins: Joi.array().items(pluginRefSchema).optional().default([]),
    flows: Joi.array().items(fileRefSchema).optional().default([]),
    pages: Joi.array().items(fileRefSchema).optional().default([]),
    components: Joi.array().items(fileRefSchema).optional().default([]),
    testSuites: Joi.array().items(fileRefSchema).optional().default([]),
}).unknown(false);

export default projectV2BodySchema;
