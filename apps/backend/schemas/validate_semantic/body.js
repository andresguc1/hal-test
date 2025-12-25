// schemas/validate_semantic/body.js

import Joi from 'joi';

const allowedModels = ['gemini', 'gpt4', 'custom'];

const validateSemanticBodySchema = Joi.object({
    // 1. model (Modelo de Lenguaje, Requerido)
    model: Joi.string()
        .valid(...allowedModels)
        .required()
        .messages({
            'any.required': 'El modelo de lenguaje (LLM) es obligatorio.',
            'any.only': 'El modelo debe ser gemini, gpt4 o custom.',
        }),

    // 2. sourceTextVariable (Variable de Texto a Validar, Requerido)
    sourceTextVariable: Joi.string().trim().required().messages({
        'any.required': 'El nombre de la variable de texto fuente es obligatorio.',
        'string.empty': 'El nombre de la variable no puede estar vacío.',
    }),

    // 3. validationPrompt (Instrucción de Validación, Requerido)
    validationPrompt: Joi.string().trim().required().messages({
        'any.required': 'La instrucción de validación (validationPrompt) es obligatoria.',
        'string.empty': 'La instrucción no puede estar vacía.',
    }),

    // 4. expectedAnswer (Respuesta Esperada, Requerido)
    expectedAnswer: Joi.string().trim().required().messages({
        'any.required': 'La respuesta esperada del LLM es obligatoria.',
        'string.empty': 'La respuesta esperada no puede estar vacía.',
    }),

    // 5. validationTimeout (Timeout de Validación, Opcional con default y min)
    validationTimeout: Joi.number().integer().min(100).default(10000).optional().messages({
        'number.min': 'El timeout debe ser al menos 100ms.',
    }),

    // 6. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default validateSemanticBodySchema;
