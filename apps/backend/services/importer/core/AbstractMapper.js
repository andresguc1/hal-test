/**
 * Clase base para los mappers que convierten AST a acciones Hal_Test.
 */
export class AbstractMapper {
    constructor() {
        if (new.target === AbstractMapper) {
            throw new Error('No se puede instanciar AbstractMapper directamente.');
        }
    }

    /**
     * Convierte una lista de nodos/comandos a acciones Hal_Test.
     * @param {Array<Object>} astNodes - Nodos extraídos por el parser.
     * @returns {Array<Object>} - Lista de acciones en formato Hal_Test.
     */
    map(astNodes) {
        console.log(astNodes);
        throw new Error('Método map() debe ser implementado.');
    }
}
