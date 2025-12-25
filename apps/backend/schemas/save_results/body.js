// schemas/save_results/body.js

import Joi from 'joi';

const allowedDestinationTypes = ['json', 'csv', 'excel', 'text'];

const saveResultsBodySchema = Joi.object({
    // 1. destinationType (Formato de Salida, Requerido)
    destinationType: Joi.string()
        .valid(...allowedDestinationTypes)
        .required()
        .messages({
            'any.required': 'El formato de archivo de salida (destinationType) es obligatorio.',
            'any.only': 'El formato debe ser json, csv, excel o text.',
        }),

    // 2. path (Ruta del Archivo de Salida, Requerido)
    path: Joi.string().trim().required().messages({
        'any.required': 'La ruta del archivo de salida (path) es obligatoria.',
    }),

    // 3. dataVariableName (Variable de Datos, Requerido)
    dataVariableName: Joi.string().trim().required().messages({
        'any.required': 'El nombre de la variable de datos a guardar es obligatorio.',
    }),

    // 4. includeHeader (Incluir Encabezados, Condicional)
    includeHeader: Joi.boolean()
        .default(true)
        .optional()
        .when('destinationType', {
            is: Joi.valid('csv', 'excel'),
            // No hacemos 'then: Joi.required()' porque tiene un valor por defecto.
            // Esto solo asegura que sea booleano si se proporciona.
            otherwise: Joi.optional().allow(null, false, true), // Permitimos ignorarlo
        })
        .messages({
            'boolean.base': 'includeHeader debe ser booleano.',
        }),

    // 5. encoding (Codificación, Requerido)
    encoding: Joi.string().trim().default('utf-8').required().messages({
        'any.required': 'La codificación del archivo es obligatoria.',
    }),

    // 6. sheetName (Nombre de la Hoja, Condicional)
    sheetName: Joi.string()
        .trim()
        .optional()
        .allow(null, '')
        .when('destinationType', {
            is: 'excel',
            then: Joi.string().required().messages({
                'any.required':
                    'El nombre de la hoja (sheetName) es obligatorio para archivos Excel.',
                'string.empty': 'El nombre de la hoja no puede estar vacío.',
            }),
            otherwise: Joi.optional().allow(null, ''),
        }),

    // 7. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default saveResultsBodySchema;
