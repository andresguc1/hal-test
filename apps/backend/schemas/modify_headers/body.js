// schemas/modify_headers/body.js

import Joi from 'joi';

const modifyHeadersBodySchema = Joi.object({
    urlPattern: Joi.string().required(),
    headers: Joi.string().required(), // JSON string con las cabeceras
    method: Joi.string().optional().uppercase().allow(''),
    timeout: Joi.number().integer().min(0).default(0),

    browserId: Joi.any().strip(),
    endpoint: Joi.string().optional().allow(''),
});

export default modifyHeadersBodySchema;
