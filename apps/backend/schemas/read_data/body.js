// schemas/read_data/body.js

import Joi from 'joi';

const allowedSourceTypes = ['json', 'csv', 'excel', 'text'];

const readDataBodySchema = Joi.object({
    // 1. sourceType (Tipo de Fuente, Opcional)
    sourceType: Joi.string()
        .valid(...allowedSourceTypes)
        .optional()
        .messages({
            'any.only': 'El tipo de fuente debe ser json, csv, excel o text.',
        }),

    // 2. path (Ruta del Archivo, Opcional)
    path: Joi.string().trim().optional().messages({
        'string.empty': 'La ruta del archivo no puede estar vacía.',
    }),

    // 3. selector (Selector DOM para lectura directa, Requerido si no hay path) 🆙
    selector: Joi.string().trim().optional().messages({
        'string.empty': 'El selector no puede estar vacío.',
    }),

    // 4. type (Tipo de contenido DOM a leer: text/html) 🆙
    type: Joi.string().valid('text', 'html').default('text').optional(),

    // 5. variableName (Guardar en Variable, Opcional)
    variableName: Joi.string().trim().optional().messages({
        'string.empty': 'El nombre de la variable no puede estar vacío.',
    }),

    // 6. sheetName (Nombre de la Hoja, Opcional)
    sheetName: Joi.string().trim().optional().allow(null, ''),

    // 7. hasHeader (Contiene Encabezado, Opcional)
    hasHeader: Joi.boolean().default(true).optional(),

    // 8. encoding (Codificación, Opcional)
    encoding: Joi.string().trim().default('utf-8').optional(),

    // 9. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default readDataBodySchema;
