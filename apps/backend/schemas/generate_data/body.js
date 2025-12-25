// schemas/generate_data/body.js

import Joi from 'joi';

const allowedModels = ['gemini', 'gpt4', 'custom'];
const allowedFormats = ['string', 'json', 'csv'];

const generateDataBodySchema = Joi.object({
    // 1. model (Modelo de Lenguaje, Requerido)
    model: Joi.string()
        .valid(...allowedModels)
        .required()
        .messages({
            'any.required': 'El modelo de lenguaje (LLM) es obligatorio.',
            'any.only': 'El modelo debe ser gemini, gpt4 o custom.',
        }),

    // 2. prompt (Instrucción, Requerido)
    prompt: Joi.string().trim().required().messages({
        'any.required': 'La instrucción de generación (prompt) es obligatoria.',
        'string.empty': 'La instrucción no puede estar vacía.',
    }),

    // 3. variableName (Guardar Respuesta, Requerido)
    variableName: Joi.string().trim().required().messages({
        'any.required': 'El nombre de la variable de destino es obligatorio.',
        'string.empty': 'El nombre de la variable no puede estar vacío.',
    }),

    // 4. expectedFormat (Formato de Salida, Requerido)
    expectedFormat: Joi.string()
        .valid(...allowedFormats)
        .default('json')
        .required()
        .messages({
            'any.required': 'El formato de salida esperado es obligatorio.',
        }),

    // 5. temperature (Temperatura, Opcional con default y rango)
    temperature: Joi.number().min(0.0).max(1.0).default(0.7).optional().messages({
        'number.min': 'La temperatura debe ser 0.0 o mayor.',
        'number.max': 'La temperatura debe ser 1.0 o menor.',
    }),

    // 6. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default generateDataBodySchema;
