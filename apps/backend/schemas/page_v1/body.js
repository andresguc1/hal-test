import Joi from 'joi';

const locatorSchema = Joi.object({
    selector: Joi.string().required(),
    strategy: Joi.string()
        .valid('css', 'role', 'text', 'semantic', 'xpath')
        .optional()
        .default('css'),
    role: Joi.string().optional(),
    fallbacks: Joi.array().items(Joi.string()).optional().default([]),
    description: Joi.string().optional(),
});

const sectionLocatorSchema = Joi.object().pattern(Joi.string(), locatorSchema);

const pageV1BodySchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    url: Joi.string().uri().optional(),
    version: Joi.string().optional().default('1.0.0'),
    locators: Joi.object().pattern(Joi.string(), locatorSchema).required(),
    sections: Joi.object()
        .pattern(
            Joi.string(),
            Joi.object({
                root: Joi.string().required(),
                locators: sectionLocatorSchema.optional(),
            }),
        )
        .optional(),
    metadata: Joi.object({
        lastValidated: Joi.date().optional(),
        healthScore: Joi.number().min(0).max(1).optional(),
        tags: Joi.array().items(Joi.string()).optional(),
    }).optional(),
}).unknown(false);

export default pageV1BodySchema;
