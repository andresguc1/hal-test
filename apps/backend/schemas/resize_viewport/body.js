// schemas/resize_viewport/body.js
import Joi from 'joi';

const resizeViewportBodySchema = Joi.object({
    // devicePreset is the new standard
    devicePreset: Joi.string()
        .valid(
            'Desktop',
            'iPhone SE',
            'iPhone XR',
            'iPhone 12 Pro',
            'iPhone 14 Pro Max',
            'Pixel 7',
            'Samsung Galaxy S22',
            'Samsung Galaxy S20 Ultra',
            'iPad Mini',
            'iPad Air',
            'iPad Pro',
            'Tablet',
            'Custom',
            '',
        )
        .default('Custom')
        .optional(),

    // Alias for backward compatibility
    deviceEmulation: Joi.string().optional().allow('', null),

    width: Joi.number()
        .integer()
        .min(1)
        .when('devicePreset', {
            is: Joi.valid('', null, 'Custom'),
            then: Joi.when('deviceEmulation', {
                is: Joi.valid('', null),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }),
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'El ancho es obligatorio para tamaño personalizado.',
            'number.min': 'El ancho debe ser mayor a 1.',
        }),

    height: Joi.number()
        .integer()
        .min(1)
        .when('devicePreset', {
            is: Joi.valid('', null, 'Custom'),
            then: Joi.when('deviceEmulation', {
                is: Joi.valid('', null),
                then: Joi.required(),
                otherwise: Joi.optional(),
            }),
            otherwise: Joi.optional(),
        })
        .messages({
            'any.required': 'El alto es obligatorio para tamaño personalizado.',
            'number.min': 'El alto debe ser mayor a 1.',
        }),

    browserId: Joi.string().allow(null, '').optional(),
}).unknown(true);

export default resizeViewportBodySchema;
