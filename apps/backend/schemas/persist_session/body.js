// schemas/persist_session/body.js

import Joi from 'joi';

const allowedActions = ['save', 'load', 'clear'];

const persistSessionBodySchema = Joi.object({
    // 1. action (Acción de Persistencia, Requerido)
    action: Joi.string()
        .valid(...allowedActions)
        .required()
        .messages({
            'any.required': 'La acción de persistencia (save, load, clear) es obligatoria.',
        }),

    // 2. path (Ruta del Archivo de Estado, Requerido)
    path: Joi.string().trim().required().messages({
        'any.required': 'La ruta del archivo de estado (path) es obligatoria.',
        'string.empty': 'La ruta del archivo de estado no puede estar vacía.',
    }),

    // 3. includeLocalStorage (Booleano/Checkbox)
    includeLocalStorage: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'includeLocalStorage debe ser booleano.',
    }),

    // 4. includeSessionStorage (Booleano/Checkbox)
    includeSessionStorage: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'includeSessionStorage debe ser booleano.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default persistSessionBodySchema;
