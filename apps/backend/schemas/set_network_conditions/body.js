// schemas/set_network_conditions/body.js

import Joi from 'joi';

const setNetworkConditionsBodySchema = Joi.object({
    profile: Joi.string()
        .valid(
            'No throttling',
            'WiFi fast',
            'WiFi slow',
            '4G',
            'Fast 3G',
            'Slow 3G',
            '2G',
            'High Latency',
            'Custom',
            'Offline',
        )
        .required(),
    offline: Joi.boolean().optional(),
    latency: Joi.number().min(0).optional(), // Latency cannot be negative
    downloadThroughput: Joi.number().min(-1).optional(), // -1 is often used for 'unlimited' or 'default'
    uploadThroughput: Joi.number().min(-1).optional(),

    browserId: Joi.any().strip(),
    instanceId: Joi.any().strip(), // Allow and remove instanceId to prevent validation errors
    endpoint: Joi.string().optional().allow(''),
});

export default setNetworkConditionsBodySchema;
