import Joi from 'joi';
export default Joi.object({
    action: Joi.string().valid('new', 'switch', 'close', 'close_others', 'list').required(),
    tabIndex: Joi.number().integer().optional(),
    url: Joi.string().optional(),
    nodeId: Joi.string().optional(),
    runId: Joi.string().optional(),
}).unknown(true);
