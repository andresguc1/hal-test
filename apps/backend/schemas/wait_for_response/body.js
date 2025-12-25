// schemas/wait_for_response/body.js

import Joi from 'joi';

const waitForResponseBodySchema = Joi.object({
    urlPattern: Joi.string().required(),
    statusCode: Joi.number().integer().optional(),
    timeout: Joi.number().integer().min(0).default(30000),
    saveToVariable: Joi.string().optional().allow(''),

    browserId: Joi.any().strip(),
    endpoint: Joi.string().optional().allow(''),
});

export default waitForResponseBodySchema;
