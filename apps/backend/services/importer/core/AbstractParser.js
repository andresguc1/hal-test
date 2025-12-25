/**
 * Clase base para los parsers de diferentes frameworks.
 */
export class AbstractParser {
    constructor() {
        if (new.target === AbstractParser) {
            throw new Error('No se puede instanciar AbstractParser directamente.');
        }
    }

    /**
     * Parsea el contenido del archivo y extrae los tests.
     * @param {string} fileContent - Contenido del archivo de prueba.
     * @returns {Array<Object>} - Lista de tests parseados (AST o estructura intermedia).
     */
    parse(fileContent) {
        console.log(fileContent);
        throw new Error('Método parse() debe ser implementado.');
    }
}
