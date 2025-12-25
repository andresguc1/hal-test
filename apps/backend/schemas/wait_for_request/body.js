// schemas/wait_for_request/body.js

import Joi from 'joi';

const waitForRequestBodySchema = Joi.object({
    urlPattern: Joi.string().required(),
    method: Joi.string().optional().uppercase().allow(''),
    timeout: Joi.number().integer().min(0).default(30000),

    browserId: Joi.any().strip(),
    endpoint: Joi.string().optional().allow(''),
});

export default waitForRequestBodySchema;
