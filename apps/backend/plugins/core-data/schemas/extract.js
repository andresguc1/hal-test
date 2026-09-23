import Joi from 'joi';

const extractSchema = Joi.object({
    selector: Joi.string().trim().required(),
    repeated: Joi.boolean().optional().default(true),
    fields: Joi.alternatives()
        .try(
            Joi.array().items(
                Joi.object({
                    name: Joi.string().trim().required(),
                    source: Joi.string().valid('text', 'attribute', 'html').optional(),
                    selector: Joi.string().trim().optional(),
                    attribute: Joi.string().trim().optional(),
                    optional: Joi.boolean().optional(),
                }),
            ),
            Joi.object().unknown(true),
        )
        .optional(),
    outputVariable: Joi.string().trim().optional(),
    accumulateInto: Joi.string().trim().optional().allow(null, ''),
    dedupeKey: Joi.string().trim().optional().allow(null, ''),
    ifEmpty: Joi.string().valid('ok', 'fail').optional().default('ok'),
    timeoutMs: Joi.number().min(0).optional(),
}).unknown(true);

export default extractSchema;
