// schemas/browser_dialog/body.js
import Joi from 'joi';

const browserDialogBodySchema = Joi.object({
    // How to respond to the captured native dialog (accept/dismiss).
    action: Joi.string().valid('accept', 'dismiss').default('accept').optional(),
    // Optional assertion over the recorded dialog message.
    expectText: Joi.string().allow('').optional(),
    matchType: Joi.string().valid('contains', 'exact', 'regex').default('contains').optional(),
    caseSensitive: Joi.boolean().default(false).optional(),
    // Optional text used when answering a prompt() dialog.
    promptText: Joi.string().allow('').optional(),
    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    browserId: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, '').optional(),
}).unknown(true);

export default browserDialogBodySchema;
