import Joi from 'joi';
export default Joi.object({
    browser: Joi.string().valid('chromium', 'firefox', 'webkit').optional(),
    debugMode: Joi.boolean().optional(),
    nodeId: Joi.string().optional(),
    runId: Joi.string().optional(),
}).unknown(true);
