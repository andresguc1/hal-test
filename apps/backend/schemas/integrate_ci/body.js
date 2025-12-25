// schemas/integrate_ci/body.js

import Joi from 'joi';

const allowedProviders = ['auto', 'github', 'gitlab', 'jenkins', 'azure', 'custom'];

const integrateCIBodySchema = Joi.object({
    // 1. provider (Proveedor de CI, Requerido)
    provider: Joi.string()
        .valid(...allowedProviders)
        .default('auto')
        .required()
        .messages({
            'any.required': 'El proveedor de CI es obligatorio.',
            'any.only': 'El proveedor de CI debe ser uno de los valores permitidos.',
        }),

    // 2. saveArtifacts (Guardar Artefactos/Reportes, Opcional)
    saveArtifacts: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'saveArtifacts debe ser booleano.',
    }),

    // 3. outputPath (Ruta de Artefactos, Opcional)
    outputPath: Joi.string().trim().default('./artifacts').optional().allow(null, '').messages({
        'string.base': 'outputPath debe ser una cadena de texto.',
    }),

    // 4. uploadReports (Subir Reportes a Dashboard Remoto, Opcional)
    uploadReports: Joi.boolean().default(false).optional().messages({
        'boolean.base': 'uploadReports debe ser booleano.',
    }),

    // 5. envVariables (Variables de Entorno Adicionales (JSON), Opcional)
    envVariables: Joi.string().trim().optional().allow(null, '').default('{}').messages({
        'string.base': 'envVariables debe ser una cadena de texto (JSON).',
    }),

    // 6. retryOnFail (Reintentos por Fallo Global, Opcional)
    retryOnFail: Joi.number().integer().min(0).default(0).optional().messages({
        'number.min': 'El número de reintentos debe ser 0 o mayor.',
    }),

    // 7. verbose (Modo Detallado, Opcional)
    verbose: Joi.boolean().default(true).optional().messages({
        'boolean.base': 'verbose debe ser booleano.',
    }),

    // 8. browserId (ID del contexto/navegador objetivo) 🆕
    browserId: Joi.string().allow(null, '').required().messages({
        'any.required':
            'El ID del navegador/contexto (browserId) es obligatorio para el contexto de ejecución.',
        'string.base': 'browserId debe ser una cadena de texto.',
    }),
});
// Bloquea cualquier campo extra que no esté definido.
export default integrateCIBodySchema;
