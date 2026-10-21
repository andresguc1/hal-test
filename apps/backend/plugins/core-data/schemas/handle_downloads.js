import Joi from 'joi';

const handleDownloadsSchema = Joi.object({
    url: Joi.alternatives().try(Joi.string(), Joi.object()),
    selector: Joi.string().optional(),
    action: Joi.string()
        .valid('wait', 'save', 'validate', 'saveAndValidate', 'validateAndDelete')
        .optional(),
    path: Joi.string().optional(),
    expectedFileName: Joi.string().optional(),
    minSizeKB: Joi.number().optional(),
    maxSizeKB: Joi.number().optional(),
    savePath: Joi.string().optional(),
    timeout: Joi.number().optional(),
    continueOnError: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
    variableName: Joi.string().optional(),
}).unknown(true);

export default handleDownloadsSchema;
