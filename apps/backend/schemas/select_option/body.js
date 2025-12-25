// schemas/select_option/body.js

import Joi from 'joi';

// Valores permitidos para selectionCriteria
const allowedCriteria = [
    'value', // Por valor (value="" en <option>)
    'label', // Por etiqueta (Texto visible)
    'index', // Por índice (Posición numérica)
];

const selectOptionBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del dropdown (<select>) es obligatorio.',
    }),

    // 2. selectionCriteria (Requerido, Select)
    selectionCriteria: Joi.string()
        .valid(...allowedCriteria)
        .default('value')
        .required()
        .messages({
            'any.required': 'El criterio de selección (value, label, index) es obligatorio.',
            'any.only': 'El criterio de selección debe ser value, label o index.',
        }),

    // 3. selectionValue (Requerido, String)
    selectionValue: Joi.string().trim().allow('').required().messages({
        'any.required': 'El valor, etiqueta o índice a seleccionar es obligatorio.',
    }),

    // 4. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 5. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default selectOptionBodySchema;
