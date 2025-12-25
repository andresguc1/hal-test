// schemas/block_resource/body.js

import Joi from 'joi';

const blockResourceBodySchema = Joi.object({
    urlPattern: Joi.string().trim().required(),
    resourceType: Joi.string()
        .valid(
            'script',
            'image',
            'stylesheet',
            'font',
            'xhr',
            'fetch',
            'other',
            'media',
            'websocket',
        )
        .default('script'),
    timeout: Joi.number().integer().min(0).default(0),

    browserId: Joi.any().strip(),
    endpoint: Joi.string().optional().allow(''),
});

export default blockResourceBodySchema;
