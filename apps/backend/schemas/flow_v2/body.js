import Joi from 'joi';

const nodeConfigSchema = Joi.object().pattern(Joi.string(), Joi.any());

const nodeSchema = Joi.object({
    id: Joi.string().required(),
    type: Joi.string().required(),
    version: Joi.string().optional().default('1.0.0'),
    position: Joi.object({
        x: Joi.number().required(),
        y: Joi.number().required(),
    }).required(),
    data: Joi.object({
        configuration: nodeConfigSchema.optional(),
        label: Joi.string().optional(),
        subType: Joi.string().optional(),
        disabled: Joi.boolean().optional(),
    }).required(),
    parentId: Joi.string().optional(),
});

const edgeSchema = Joi.object({
    id: Joi.string().required(),
    source: Joi.string().required(),
    target: Joi.string().required(),
    sourceHandle: Joi.string().optional().default('default'),
    targetHandle: Joi.string().optional().default('default'),
});

const flowV2BodySchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    version: Joi.string().optional().default('2.0.0'),
    description: Joi.string().allow('', null).optional(),
    author: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    viewport: Joi.object({
        x: Joi.number().required(),
        y: Joi.number().required(),
        zoom: Joi.number().required(),
    })
        .optional()
        .default({ x: 0, y: 0, zoom: 1 }),
    config: Joi.object({
        browser: Joi.object({
            headless: Joi.boolean().optional(),
            slowMo: Joi.number().optional(),
        }).optional(),
        timeout: Joi.number().optional(),
        retries: Joi.number().integer().optional(),
    }).optional(),
    nodes: Joi.array().items(nodeSchema).required(),
    edges: Joi.array().items(edgeSchema).required(),
    variables: Joi.object().pattern(Joi.string(), Joi.any()).optional(),
    metadata: Joi.object({
        pluginVersion: Joi.string().optional(),
        nodeTypeVersions: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    }).optional(),
}).unknown(false);

export default flowV2BodySchema;
