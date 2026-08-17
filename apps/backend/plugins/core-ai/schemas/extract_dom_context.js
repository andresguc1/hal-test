import Joi from 'joi';
export default Joi.object({
    strategy: Joi.string().valid('accessibility', 'html').optional().default('accessibility'),
    variableName: Joi.string().required(),
    nodeId: Joi.string().optional(),
    browserId: Joi.string().optional(),
}).unknown(true);
