// schemas/pick_list_option/body.js

import Joi from 'joi';

const pickListOptionBodySchema = Joi.object({
    // 1. selector (Requerido) — trigger del menú/combobox o su contenedor visible
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del dropdown/menú es obligatorio.',
        'string.empty': 'El selector del dropdown/menú no puede estar vacío.',
    }),

    // 1b. menuSelector (Opcional) — contenedor del panel/overlay donde viven las
    //     opciones (menús abiertos como portal al <body>, selects virtualizados).
    menuSelector: Joi.string().trim().allow('', null).optional().messages({
        'string.base': 'menuSelector debe ser una cadena de texto.',
    }),

    // 1c. mode (text | index) — método declarado de selección (UX/validación).
    mode: Joi.string().valid('text', 'index').allow('').optional().messages({
        'any.only': 'mode debe ser "text" o "index".',
    }),

    // 2. optionText (Requerido si no se usa optionIndex) — texto exacto de la opción
    optionText: Joi.string().trim().allow('').optional().messages({
        'string.base': 'optionText debe ser una cadena de texto.',
    }),

    // 3. optionIndex (Alternativa a optionText) — posición numérica de la opción
    optionIndex: Joi.number().integer().min(0).optional().messages({
        'number.base': 'optionIndex debe ser un número entero.',
        'number.min': 'optionIndex debe ser mayor o igual a 0.',
    }),

    // 4. expandMenu (Booleano) — clickear el trigger para abrir el menú primero
    expandMenu: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'expandMenu debe ser un valor booleano (true/false).',
    }),

    // 5. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 6. browserId (ID del navegador objetivo)
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
}).unknown(true);
// unknown(true) permite extender la configuración sin romper flujos existentes.

export default pickListOptionBodySchema;
