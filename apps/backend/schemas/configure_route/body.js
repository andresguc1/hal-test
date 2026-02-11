import Joi from 'joi';

const configureRouteBodySchema = Joi.object({
    urlPattern: Joi.string().required(),
    routeAction: Joi.string()
        .valid('abort', 'mock', 'modify_headers', 'log', 'continue')
        .default('abort'),
    method: Joi.string().uppercase().optional().allow('', null, 'ALL'),
    statusCode: Joi.number().integer().optional().default(200),
    responseBody: Joi.any().optional(),
    headers: Joi.string().optional().allow('', null),
    timeout: Joi.number().integer().optional().default(0),
});

export default configureRouteBodySchema;
