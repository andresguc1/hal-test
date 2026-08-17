import Joi from 'joi';
export default Joi.object({
    content: Joi.string().allow('', null).optional(),
    criteria: Joi.string().allow('', null).optional(),
    model: Joi.any().optional(),
    variableName: Joi.string().required(),
    nodeId: Joi.string().optional(),
    browserId: Joi.string().optional(),
}).unknown(true);
