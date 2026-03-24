import Joi from 'joi';

const failFlowBodySchema = Joi.object({
    message: Joi.string().optional().default('Flow explicitly aborted'),
    nodeId: Joi.string().optional(),
    runId: Joi.string().optional(),
    browserId: Joi.string().optional().allow(null),
});

export default failFlowBodySchema;
