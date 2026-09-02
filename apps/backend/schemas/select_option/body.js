// schemas/select_option/body.js

import Joi from 'joi';

// Valores permitidos para selectionCriteria
const allowedCriteria = [
    'value', // Por valor (value="" en <option>)
    'label', // Por etiqueta (Texto visible)
    'index', // Por índice (Posición numérica)
];

const allowedActions = ['NO_CHANGE', 'CHECK', 'UNCHECK'];

const selectOptionBodySchema = Joi.object({
    // 1. selector (Opcional en modo legacy; requerido si no se usa containerSelector)
    selector: Joi.string().trim().optional().messages({
        'string.base': 'El selector debe ser una cadena de texto.',
    }),

    // 1b. containerSelector (NUEVO modo): locator del contenedor de opciones
    containerSelector: Joi.string().trim().optional().allow('').messages({
        'string.base': 'containerSelector debe ser una cadena de texto.',
    }),

    // 1c. selectedOptions (NUEVO modo): lista de acciones por opción a aplicar
    selectedOptions: Joi.array()
        .items(
            Joi.object({
                label: Joi.string().optional().allow(''),
                value: Joi.alternatives().try(Joi.string(), Joi.number()).optional().allow(''),
                action: Joi.string()
                    .valid(...allowedActions)
                    .default('CHECK')
                    .optional()
                    .messages({
                        'any.only': 'La acción debe ser NO_CHANGE, CHECK o UNCHECK.',
                    }),
            }).unknown(true),
        )
        .optional()
        .messages({
            'array.base': 'selectedOptions debe ser un arreglo de opciones.',
        }),

    // 1d. expandMenu (NUEVO): expandir menú/combobox antes de detectar
    expandMenu: Joi.boolean().optional().default(false).messages({
        'boolean.base': 'expandMenu debe ser un booleano.',
    }),

    // 2. selectionCriteria (Requerido, Select) - modo legacy
    selectionCriteria: Joi.string()
        .valid(...allowedCriteria)
        .default('value')
        .optional()
        .messages({
            'any.only': 'El criterio de selección debe ser value, label o index.',
        }),

    // 3. selectionValue (Requerido, String) - modo legacy
    selectionValue: Joi.string().trim().allow('').optional().messages({
        'string.base': 'selectionValue debe ser una cadena de texto.',
    }),

    // 4. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 5. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
}).unknown(true);
// unknown(true) permite extender la configuración sin romper flujos existentes.

export default selectOptionBodySchema;
