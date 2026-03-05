/**
 * Base class for all code generators.
 */
export class BaseGenerator {
    constructor(language, locale) {
        this.language = language;
        this.locale = locale;
        this.isEn = locale.startsWith('en');
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
     * @param {Array} steps
     * @returns {string}
     */
    generate(steps) {
        let code = this.generateHeader(steps);
        code += this.generateSteps(steps);
        code += this.generateFooter();
        return code;
    }

    /**
     * Recursively generates code for steps.
     * @param {Array} steps
     * @param {number} depth
     * @returns {string}
     */
    generateSteps(steps, depth = 0) {
        if (!steps || !Array.isArray(steps)) return '';
        // This will be handled by a more sophisticated manager/registry later
        // or by a simple mapping here as a fallback/MVP.
        return steps
            .map((step, index) => this.generateNodeCode(step, index, depth))
            .filter(Boolean)
            .join('\n\n');
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
