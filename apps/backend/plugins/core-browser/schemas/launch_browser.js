import Joi from 'joi';

const launchBrowserSchema = Joi.object({
    browserType: Joi.string()
        .valid('chromium', 'firefox', 'webkit', 'lightpanda')
        .optional()
        .default('chromium'),
    browser: Joi.string().valid('chromium', 'firefox', 'webkit', 'lightpanda').optional(), // legacy alias
    headless: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional().default(false),
    slowMo: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    width: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    height: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    isMobile: Joi.boolean().optional(),
    maximizeWindow: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
    devicePreset: Joi.string().optional(),
    debugMode: Joi.boolean().optional(),
    traceEnabled: Joi.boolean().optional(),
    nodeId: Joi.string().optional(),
    runId: Joi.string().optional(),
}).unknown(true);

export default launchBrowserSchema;
