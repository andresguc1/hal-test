// schemas/save_dataset/body.js

import Joi from 'joi';

const saveDatasetBodySchema = Joi.object({
    source: Joi.string().trim().required().messages({
        'any.required': 'El nombre de la variable de dataset (source) es obligatorio.',
        'string.empty': 'El nombre de la variable de dataset no puede estar vacío.',
    }),

    format: Joi.string().valid('json', 'csv', 'ndjson').optional().default('json'),

    filename: Joi.string().trim().optional().allow(null, ''),

    outputVariable: Joi.string().trim().optional().allow(null, ''),

    pretty: Joi.boolean().optional().default(false),

    csvDelimiter: Joi.string().valid(',', ';', '\t', '|').optional().default(','),

    browserId: Joi.string().allow(null, '').optional(),
});

export default saveDatasetBodySchema;
