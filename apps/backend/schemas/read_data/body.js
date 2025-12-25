// schemas/read_data/body.js

import Joi from 'joi';

const allowedSourceTypes = ['json', 'csv', 'excel', 'text'];

const readDataBodySchema = Joi.object({
    // 1. sourceType (Tipo de Fuente, Requerido)
    sourceType: Joi.string()
        .valid(...allowedSourceTypes)
        .required()
        .messages({
            'any.required': 'El tipo de fuente de datos (sourceType) es obligatorio.',
            'any.only': 'El tipo de fuente debe ser json, csv, excel o text.',
        }),

    // 2. path (Ruta del Archivo, Requerido)
    path: Joi.string().trim().required().messages({
        'any.required': 'La ruta del archivo (path) es obligatoria.',
    }),

    // 3. variableName (Guardar en Variable, Requerido)
    variableName: Joi.string().trim().required().messages({
        'any.required': 'El nombre de la variable de destino es obligatorio.',
    }),

    // 4. sheetName (Nombre de la Hoja, Condicional)
    sheetName: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('sourceType', {
            is: 'excel',
            then: Joi.string().required().messages({
                'any.required':
                    'El nombre de la hoja (sheetName) es obligatorio para archivos Excel.',
                'string.empty': 'El nombre de la hoja no puede estar vacío.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 5. hasHeader (Contiene Encabezado, Opcional)
    hasHeader: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'hasHeader debe ser booleano.',
    }),

    // 6. encoding (Codificación, Requerido)
    encoding: Joi.string().trim().default('utf-8').required().messages({
        'any.required': 'La codificación del archivo es obligatoria.',
    }),

    // 7. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default readDataBodySchema;
