import Joi from 'joi';

const schema = Joi.object({
    downloadThroughput: Joi.number().optional(),
    uploadThroughput: Joi.number().optional(),
    latency: Joi.number().optional(),
}).unknown(true);

export default schema;
