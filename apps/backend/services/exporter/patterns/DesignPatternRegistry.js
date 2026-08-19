/**
 * DesignPatternRegistry
 * Registry for code generation design patterns (Strategy + Registry patterns).
 * Each pattern transforms flow steps into a different code architecture.
 */
export class DesignPatternRegistry {
    static patterns = new Map();

    /**
     * Register a design pattern
     * @param {Object} pattern - { name, label, description, frameworks, languages, generate }
     */
    static register(pattern) {
        this.patterns.set(pattern.name, pattern);
    }

    /**
     * Get a pattern by name
     * @param {string} name - Pattern name
     * @returns {Object|null} Pattern object
     */
    static get(name) {
        return this.patterns.get(name) || this.patterns.get('flat');
    }

    /**
     * Get all registered patterns
     * @returns {Array} Array of pattern objects
     */
    static getAll() {
        return Array.from(this.patterns.values());
    }

    /**
     * Get patterns available for a given framework and language
     * @param {string} framework - Framework name
     * @param {string} language - Language name
     * @returns {Array} Available patterns
     */
    static getAvailable(framework, language) {
        return this.getAll().filter((p) => {
            if (p.frameworks && !p.frameworks.includes(framework)) return false;
            if (p.languages && !p.languages.includes(language)) return false;
            return true;
        });
    }
}

export default DesignPatternRegistry;
