import Joi from 'joi';

const saveDatasetSchema = Joi.object({
    source: Joi.string().trim().required(),
    format: Joi.string().valid('json', 'csv', 'ndjson').optional().default('json'),
    filename: Joi.string().trim().optional().allow(null, ''),
    outputVariable: Joi.string().trim().optional().allow(null, ''),
    pretty: Joi.boolean().optional().default(false),
    csvDelimiter: Joi.string().valid(',', ';', '\t', '|').optional().default(','),
}).unknown(true);

export default saveDatasetSchema;
