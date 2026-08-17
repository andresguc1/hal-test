import Joi from 'joi';
export default Joi.object({
    prompt: Joi.string().allow('', null).optional(),
    schema: Joi.string().allow('', null).optional(),
    variableName: Joi.string().required(),
    model: Joi.any().optional(),
    provider: Joi.any().optional(),
    nodeId: Joi.string().optional(),
    browserId: Joi.string().optional(),
}).unknown(true);
