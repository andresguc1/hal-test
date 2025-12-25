// middlewares/validateSchema.js

/**
 * Middleware de validación que usa un esquema Joi para validar
 * el cuerpo (body), parámetros (params) y/o consultas (query) de la petición.
 * * @param {object} schema - Un objeto conteniendo los esquemas Joi (ej: { body: mySchema }).
 * @returns {function} Middleware de Express.
 */
const validate = (schema) => (req, res, next) => {
    // Objeto para capturar todos los errores de validación
    const validationErrors = {};

    // 1. Validar el Cuerpo (Body)
    if (schema.body) {
        // Usamos { abortEarly: false } para capturar todos los errores a la vez
        const { error } = schema.body.validate(req.body, { abortEarly: false });

        if (error) {
            validationErrors.body = error.details.map((detail) => ({
                field: detail.context.key,
                message: detail.message.replace(/['"]/g, ''), // Limpia comillas para mejor mensaje
            }));
        }
    }

    // 2. Validar Parámetros (Params) - Se puede extender aquí si es necesario
    // if (schema.params) { ... }

    // 3. Validar Consultas (Query) - Se puede extender aquí si es necesario
    // if (schema.query) { ... }

    // 4. Procesar Errores de Validación
    if (Object.keys(validationErrors).length > 0) {
        // Crea un error que el errorHandler.js puede manejar
        const error = {
            statusCode: 400, // Bad Request
            message: 'Error de validación en la petición.',
            details: validationErrors, // Añade los detalles de los campos fallidos
        };

        // Pasa el error al manejador de errores centralizado (errorHandler.js)
        return next(error);
    }

    // Si todo es válido, continuar al siguiente middleware o controlador
    next();
};

export default validate;
