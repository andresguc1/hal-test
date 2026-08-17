import Joi from 'joi';

const uploadFileSchema = Joi.object({
    selector: Joi.alternatives().try(Joi.string(), Joi.object()),
    filePath: Joi.alternatives().try(Joi.string(), Joi.array()).optional(),
}).unknown(true);

export default uploadFileSchema;
