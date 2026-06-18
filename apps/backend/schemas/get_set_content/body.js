// schemas/get_set_content/body.js

import Joi from 'joi';

const allowedActions = ['get', 'set'];
const allowedContentTypes = ['text', 'html', 'attribute'];

const getSetContentBodySchema = Joi.object({
    // 1. selector (Required)
    selector: Joi.string().trim().required().messages({
        'any.required': 'Element selector is required.',
        'string.empty': 'Selector cannot be empty.',
    }),

    // 2. action (Required)
    action: Joi.string()
        .valid(...allowedActions)
        .default('get')
        .messages({
            'any.required': 'Action (get/set) is required.',
            'any.only': 'Action must be "get" or "set".',
        }),

    // 3. contentType (Optional) - Type of content to get/set
    contentType: Joi.string()
        .valid(...allowedContentTypes)
        .default('text')
        .optional()
        .messages({
            'any.only': 'Content type must be "text", "html", or "attribute".',
        }),

    // 4. attribute (Conditional) - Specific attribute name
    attribute: Joi.string()
        .trim()
        .when('contentType', {
            is: 'attribute',
            then: Joi.required(),
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'Attribute name is required when contentType is "attribute".',
            'string.empty': 'Attribute name cannot be empty.',
        }),

    // 5. value (Conditional Required)
    value: Joi.string()
        .allow('')
        .when('action', {
            // If action is 'set', 'value' field is mandatory (can be empty string)
            is: 'set',
            then: Joi.required(),
            // If action is 'get', 'value' is optional and ignored.
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': '"value" is required when action is "set".',
        }),

    // 6. clearBeforeSet (Optional)
    clearBeforeSet: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'clearBeforeSet field must be boolean.',
    }),

    // 7. browserId (Target browser ID)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId must be a string.',
    }),

    // 8. takeScreenshot (Optional)
    takeScreenshot: Joi.boolean().default(false).optional(),
});

export default getSetContentBodySchema;
