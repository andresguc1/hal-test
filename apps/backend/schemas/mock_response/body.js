// schemas/mock_response/body.js

import Joi from 'joi';

const mockResponseBodySchema = Joi.object({
    urlPattern: Joi.string().trim().required(),
    method: Joi.string().default('GET').uppercase().optional(),
    status: Joi.number().integer().min(100).max(599).default(200),
    responseBody: Joi.alternatives().try(Joi.string(), Joi.object(), Joi.array()).required(),
    headers: Joi.string().optional().allow(null, ''), // JSON string
    timeout: Joi.number().integer().min(0).default(120000), // 0 = persistente

    browserId: Joi.any().strip(),
    endpoint: Joi.string().optional().allow(''),
});

export default mockResponseBodySchema;
