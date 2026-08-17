import Joi from 'joi';
export default Joi.object({
    width: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
    height: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
    nodeId: Joi.string().optional(),
    runId: Joi.string().optional(),
}).unknown(true);
