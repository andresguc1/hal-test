// schemas/close_context/body.js

import Joi from 'joi';

const closeContextBodySchema = Joi.object({
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required': 'El ID del contexto (browserId) a cerrar es obligatorio.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});

export default closeContextBodySchema;
