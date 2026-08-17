import Joi from 'joi';

const handleDownloadsSchema = Joi.object({
    url: Joi.alternatives().try(Joi.string(), Joi.object()),
    savePath: Joi.string().optional(),
    timeout: Joi.number().optional(),
}).unknown(true);

export default handleDownloadsSchema;
