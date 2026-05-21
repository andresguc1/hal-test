import Joi from 'joi';

const backendJsBodySchema = Joi.object({
    expression: Joi.string().optional(),
    script: Joi.string().optional(),
    outputVar: Joi.string().optional().default('backendResult'),
    nodeId: Joi.string().optional(),
    runId: Joi.string().optional(),
    browserId: Joi.string().optional().allow(null),
}).or('expression', 'script');

export default backendJsBodySchema;
