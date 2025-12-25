// schemas/upload_file/body.js

import Joi from 'joi';

const uploadFileBodySchema = Joi.object({
    // 1. selector (Requerido)
    selector: Joi.string().trim().required().messages({
        'any.required': 'El selector del input file es obligatorio.',
    }),

    // 2. files (Rutas de Archivos a Subir, Requerido)
    files: Joi.string().trim().required().messages({
        'any.required': 'Las rutas de los archivos a subir son obligatorias.',
        'string.empty': 'Las rutas de los archivos no pueden estar vacías.',
    }),

    // 3. timeout (Número, Mínimo 1)
    timeout: Joi.number().integer().min(1).default(30000).messages({
        'number.min': 'El tiempo de espera (timeout) debe ser al menos 1ms.',
    }),

    // 4. browserId (ID del navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').optional().messages({
        'string.base': 'browserId debe ser una cadena de texto (el ID único del navegador).',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default uploadFileBodySchema;
