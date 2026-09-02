import Joi from 'joi';

const browserDialogSchema = Joi.object({
    action: Joi.string().valid('accept', 'dismiss').default('accept').optional(),
    // Optional assertion over the dialog message captured in page._dialogQueue.
    expectText: Joi.string().allow('').optional(),
    matchType: Joi.string().valid('contains', 'exact', 'regex').default('contains').optional(),
    caseSensitive: Joi.boolean().default(false).optional(),
    // Used when handling a prompt() dialog.
    promptText: Joi.string().allow('').optional(),
    timeout: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    browserId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
}).unknown(true);

export default browserDialogSchema;
