import Joi from 'joi';

const waitNetworkMatchBodySchema = Joi.object({
    type: Joi.string().valid('request', 'response').default('response'),
    urlPattern: Joi.string().required(),
    method: Joi.string().uppercase().optional().allow('', null, 'ALL'),
    statusCode: Joi.number().integer().optional(),
    timeout: Joi.number().integer().optional().default(30000),
});

export default waitNetworkMatchBodySchema;
