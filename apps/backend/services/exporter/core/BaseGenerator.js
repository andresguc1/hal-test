/**
 * Base class for all code generators.
 */
export class BaseGenerator {
    constructor(language, locale) {
        this.language = language;
        this.locale = locale;
        this.isEn = locale.startsWith('en');
        this.warnings = [];
    }

    /**
     * Generates the header for the specific language/framework.
     * @param {Array} steps
     * @returns {string}
     */
    generateHeader(_steps) {
        throw new Error('generateHeader not implemented');
    }

    /**
     * Generates the footer for the specific language/framework.
     * @returns {string}
     */
    generateFooter() {
        throw new Error('generateFooter not implemented');
    }

    /**
     * Entry point to generate full code.
     * Returns { code, warnings }.
     * @param {Array} steps
     * @returns {{ code: string, warnings: Array }}
     */
    generate(steps) {
        this.warnings = []; // Reset warnings for each generation
        let code = this.generateHeader(steps);
        code += this.generateSteps(steps);
        code += this.generateFooter();
        return { code, warnings: this.warnings };
    }

    /**
     * Recursively generates code for steps.
     * @param {Array} steps
     * @param {number} depth
     * @returns {string}
     */
    generateSteps(steps, depth = 0) {
        if (!steps || !Array.isArray(steps)) return '';
        return steps
            .map((step, index) => this.generateNodeCode(step, index, depth))
            .filter(Boolean)
            .join('\n\n');
    }

    /**
     * Adds a warning for a node that lacks implementation.
     * @param {string} nodeType
     * @param {string} nodeLabel
     * @param {number} index
     */
    addWarning(nodeType, nodeLabel, index) {
        this.warnings.push({
            nodeType,
            nodeLabel: nodeLabel || nodeType,
            index,
            message: this.isEn
                ? `Node type "${nodeType}" has no Playwright implementation. A placeholder comment was generated.`
                : `El tipo de nodo "${nodeType}" no tiene implementación Playwright. Se generó un comentario placeholder.`,
        });
    }

    /**
     * Generates code for a single node.
     * @param {object} step
     * @param {number} index
     * @param {number} depth
     */
    generateNodeCode(_step, _index, _depth) {
        throw new Error('generateNodeCode not implemented');
    }
}
