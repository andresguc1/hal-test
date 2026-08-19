/**
 * FlatPattern — Default linear code generation.
 * Produces a single test file with sequential steps.
 * This is the current default behavior.
 */
import { DesignPatternRegistry } from './DesignPatternRegistry.js';

export const FlatPattern = {
    name: 'flat',
    label: 'Flat / Linear',
    description: 'Sequential test code in a single file. Simple and direct.',
    frameworks: ['playwright', 'cypress', 'selenium'],
    languages: ['javascript', 'typescript', 'python', 'java', 'csharp'],

    /**
     * Transform steps for flat pattern (no transformation needed)
     * @param {Array} steps - Flow steps
     * @returns {Array} Same steps
     */
    transform(steps) {
        return steps;
    },

    /**
     * Generate header code
     * @param {Object} params - { language, framework, locale }
     * @returns {string} Header code
     */
    generateHeader(_params) {
        return '';
    },

    /**
     * Generate footer code
     * @param {Object} params - { language, framework }
     * @returns {string} Footer code
     */
    generateFooter(_params) {
        return '';
    },

    /**
     * Returns false — flat pattern produces single-file output
     */
    isMultiFile() {
        return false;
    },
};

DesignPatternRegistry.register(FlatPattern);
