// swagger/schemaConverter.js

import joiToSwagger from 'joi-to-swagger';

/**
 * Utilidad para convertir un schema de Joi a un objeto de schema de OpenAPI.
 * Asume que el schema de entrada está anidado en la propiedad 'body'.
 *
 * @param {object} joiSchemaObject - Objeto Joi que contiene el schema de la petición (ej: { body: schema }).
 * @returns {object} Objeto de Schema de OpenAPI.
 */
export const convertJoiToOpenApiSchema = (joiSchemaObject) => {
    // 🛠️ Soporte dual: ya sea { body: schema } o el schema directo
    const joiSchema = joiSchemaObject.body || joiSchemaObject;

    if (!joiSchema) {
        console.error("Advertencia de Swagger: Objeto Joi pasado no tiene la propiedad 'body'.");
        return { type: 'object', description: 'Schema de entrada no definido o mal referenciado.' };
    }

    try {
        const { swagger } = joiToSwagger(joiSchema);

        if (swagger && Object.keys(swagger).length > 0) {
            return swagger;
        } else {
            console.error(
                'Advertencia de Swagger: Conversión Joi a Swagger resultó en un objeto vacío.',
            );
            return { type: 'object', description: 'Schema generado vacío.' };
        }
    } catch (error) {
        console.error(`Error crítico al convertir schema Joi: ${error.message}`);
        return {
            type: 'object',
            description: `Error de conversión Joi: ${error.message.substring(0, 50)}...`,
        };
    }
};
