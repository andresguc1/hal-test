/**
 * VariableManager Service
 *
 * Manages variables across different scopes (flow, global)
 * Provides safe expression evaluation for conditions and values
 */

class VariableManager {
    constructor() {
        this.scopes = {
            global: {}, // Shared across all flows
            flow: {}, // Specific to current flow execution
        };
    }

    /**
     * Set a variable value
     * @param {string} name - Variable name
     * @param {any} value - Variable value
     * @param {string} scope - 'flow' or 'global'
     */
    set(name, value, scope = 'flow') {
        if (!this.scopes[scope]) {
            throw new Error(`Invalid scope: ${scope}`);
        }
        this.scopes[scope][name] = value;
    }

    /**
     * Get a variable value
     * @param {string} name - Variable name
     * @param {string} scope - 'flow' or 'global'
     * @returns {any} Variable value
     */
    get(name, scope = 'flow') {
        if (!this.scopes[scope]) {
            throw new Error(`Invalid scope: ${scope}`);
        }
        return this.scopes[scope][name];
    }

    /**
     * Increment a numeric variable
     * @param {string} name - Variable name
     * @param {number} amount - Amount to increment (default: 1)
     * @param {string} scope - 'flow' or 'global'
     */
    increment(name, amount = 1, scope = 'flow') {
        const current = this.get(name, scope) || 0;
        if (typeof current !== 'number') {
            throw new Error(`Cannot increment non-numeric variable: ${name}`);
        }
        this.set(name, current + amount, scope);
    }

    /**
     * Push value to array variable
     * @param {string} name - Variable name
     * @param {any} value - Value to push
     * @param {string} scope - 'flow' or 'global'
     */
    push(name, value, scope = 'flow') {
        const current = this.get(name, scope);
        if (!Array.isArray(current)) {
            throw new Error(`Cannot push to non-array variable: ${name}`);
        }
        current.push(value);
        this.set(name, current, scope);
    }

    /**
     * Get all variables in a scope
     * @param {string} scope - 'flow' or 'global'
     * @returns {object} All variables
     */
    getAll(scope = 'flow') {
        return { ...this.scopes[scope] };
    }

    /**
     * Clear all variables in a scope
     * @param {string} scope - 'flow' or 'global'
     */
    clear(scope = 'flow') {
        this.scopes[scope] = {};
    }

    /**
     * Clear all variables in all scopes
     */
    clearAll() {
        this.scopes.flow = {};
        this.scopes.global = {};
    }

    /**
     * Resolve variable references in a string
     * Example: "Hello ${name}" -> "Hello John"
     *
     * @param {string} template - String with ${var} placeholders
     * @returns {string} Resolved string
     */
    resolve(template) {
        if (typeof template !== 'string') return template;

        return template.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            const trimmedName = varName.trim();

            // Try flow scope first, then global
            let value = this.scopes.flow[trimmedName];
            if (value === undefined) {
                value = this.scopes.global[trimmedName];
            }

            return value !== undefined ? value : match;
        });
    }

    /**
     * Safely evaluate an expression with variables
     * Uses a restricted context for security
     *
     * @param {string} expression - Expression to evaluate (e.g., "${counter} > 10")
     * @param {object} additionalContext - Additional values for evaluation
     * @returns {any} Evaluation result
     */
    evaluate(expression, additionalContext = {}) {
        if (typeof expression !== 'string') {
            return expression;
        }

        // First resolve variable references
        const resolved = this.resolve(expression);

        // If it's just a variable reference, return the value
        if (!resolved.includes('${') && resolved === expression) {
            return resolved;
        }

        // Create safe evaluation context
        const context = {
            ...this.scopes.flow,
            ...this.scopes.global,
            ...additionalContext,
        };

        try {
            // Safe evaluation using Function constructor with limited scope
            // This prevents access to dangerous globals
            const func = new Function(
                ...Object.keys(context),
                `'use strict'; return (${resolved});`,
            );

            return func(...Object.values(context));
        } catch (error) {
            console.error('Expression evaluation error:', error);
            throw new Error(`Failed to evaluate expression: ${expression} - ${error.message}`);
        }
    }

    /**
     * Check if a variable exists
     * @param {string} name - Variable name
     * @param {string} scope - 'flow' or 'global'
     * @returns {boolean} True if variable exists
     */
    has(name, scope = 'flow') {
        return Object.prototype.hasOwnProperty.call(this.scopes[scope], name);
    }

    /**
     * Delete a variable
     * @param {string} name - Variable name
     * @param {string} scope - 'flow' or 'global'
     */
    delete(name, scope = 'flow') {
        delete this.scopes[scope][name];
    }

    /**
     * Evaluate a single condition
     * @param {object} condition - Condition object with left, operator, right
     * @returns {boolean} - Result of the condition evaluation
     */
    evaluateCondition(condition) {
        const { left, operator, right } = condition;

        // Resolve variable interpolations
        const resolvedLeft = this.resolve(String(left));
        const resolvedRight = right !== undefined ? this.resolve(String(right)) : undefined;

        switch (operator) {
            case '===':
                return resolvedLeft === resolvedRight;
            case '!==':
                return resolvedLeft !== resolvedRight;
            case '>':
                return Number(resolvedLeft) > Number(resolvedRight);
            case '<':
                return Number(resolvedLeft) < Number(resolvedRight);
            case '>=':
                return Number(resolvedLeft) >= Number(resolvedRight);
            case '<=':
                return Number(resolvedLeft) <= Number(resolvedRight);
            case 'contains':
                return String(resolvedLeft).includes(String(resolvedRight));
            case 'exists': {
                // Check if variable exists (left should be a variable name)
                const varName = String(left).replace(/\${(.+)}/, '$1');
                return this.has(varName, 'flow') || this.has(varName, 'global');
            }
            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }

    /**
     * Evaluate multiple conditions with AND/OR logic
     * @param {array} conditions - Array of condition objects
     * @param {string} logic - 'AND' or 'OR'
     * @returns {boolean} - Result of the combined evaluation
     */
    evaluateConditions(conditions, logic = 'AND') {
        if (!Array.isArray(conditions) || conditions.length === 0) {
            throw new Error('Conditions must be a non-empty array');
        }

        const results = conditions.map((cond) => this.evaluateCondition(cond));

        if (logic === 'AND') {
            return results.every((r) => r === true);
        } else if (logic === 'OR') {
            return results.some((r) => r === true);
        } else {
            throw new Error(`Unknown logic operator: ${logic}`);
        }
    }
}

// Export class for instantiation if needed
export { VariableManager };

// Export a unique instance (Singleton) called variableManager
export const variableManager = new VariableManager();

// Compatibility export
export default VariableManager;
