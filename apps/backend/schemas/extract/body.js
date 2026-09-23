// schemas/extract/body.js

import Joi from 'joi';

const extractBodySchema = Joi.object({
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector es obligatorio para extraer datos.',
        'string.empty': 'El selector no puede estar vacío.',
    }),

    repeated: Joi.boolean().optional().default(true),

    fields: Joi.alternatives()
        .try(
            Joi.array()
                .items(
                    Joi.object({
                        name: Joi.string().trim().required(),
                        source: Joi.string().valid('text', 'attribute', 'html').optional(),
                        selector: Joi.string().trim().optional().allow(''),
                        attribute: Joi.string().trim().optional().allow(''),
                        optional: Joi.boolean().optional(),
                    }).unknown(true),
                )
                .optional(),
            Joi.object().unknown(true).optional(),
        )
        .optional(),

    outputVariable: Joi.string().trim().optional().default('extractedData'),

    accumulateInto: Joi.string().trim().optional().allow(null, ''),

    dedupeKey: Joi.string().trim().optional().allow(null, ''),

    ifEmpty: Joi.string().valid('ok', 'fail').optional().default('ok'),

    timeoutMs: Joi.number().min(0).optional(),

    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});

export default extractBodySchema;
