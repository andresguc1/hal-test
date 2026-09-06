import Joi from 'joi';

const clickSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    waitAfter: Joi.number().optional(),
    // Right-click context menu support: text name or Playwright locator for the
    // option to click, plus optional click-outside (blur) close verification.
    contextMenuItem: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
    clickOutside: Joi.boolean().optional(),
}).unknown(true);

export default clickSchema;
