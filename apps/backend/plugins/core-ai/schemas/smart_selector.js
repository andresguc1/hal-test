import Joi from 'joi';
export default Joi.object({
    description: Joi.string().required(),
    variableName: Joi.string().required(),
    model: Joi.any().optional(),
    provider: Joi.any().optional(),
    nodeId: Joi.string().optional(),
    browserId: Joi.string().optional(),
}).unknown(true);
