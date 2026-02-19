// schemas/save_results/body.js

import Joi from 'joi';

const allowedDestinationTypes = ['json', 'csv', 'excel', 'text'];

const saveResultsBodySchema = Joi.object({
    // 1. data (Contenido a guardar, Requerido) 🆙
    data: Joi.any().required().messages({
        'any.required': 'El contenido (data) a guardar es obligatorio.',
    }),

    // 2. path (Ruta del Archivo de Salida, Requerido)
    path: Joi.string().trim().required().messages({
        'any.required': 'La ruta del archivo de salida (path) es obligatoria.',
        'string.empty': 'La ruta del archivo no puede estar vacía.',
    }),

    // 3. destinationType (Formato de Salida, Opcional)
    destinationType: Joi.string()
        .valid(...allowedDestinationTypes)
        .optional()
        .messages({
            'any.only': 'El formato debe ser json, csv, excel o text.',
        }),

    // 4. variableName (Nombre de variable para capturar resultado, Opcional) 🆕
    variableName: Joi.string().trim().optional(),

    // 5. dataVariableName (Keep for compatibility)
    dataVariableName: Joi.string().trim().optional(),

    // 5. includeHeader (Incluir Encabezados, Opcional)
    includeHeader: Joi.boolean().default(true).optional(),

    // 6. encoding (Codificación, Opcional)
    encoding: Joi.string().trim().default('utf-8').optional(),

    // 7. sheetName (Nombre de la Hoja, Opcional)
    sheetName: Joi.string().trim().optional().allow(null, ''),

    // 8. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default saveResultsBodySchema;
