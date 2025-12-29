// schemas/branch/body.js
import Joi from 'joi';

export default Joi.object({
    mode: Joi.string()
        .valid('parallel', 'sequential', 'race')
        .required()
        .description('Execution mode: parallel (all), sequential (one by one), race (first to complete)'),

    timeout: Joi.number().integer().min(0).default(30000)
        .description('Timeout in ms (0 = no timeout)'),
});
