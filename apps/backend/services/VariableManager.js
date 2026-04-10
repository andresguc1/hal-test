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
     * Check if a variable exists
     * @param {string} name - Variable name
     * @param {string} scope - 'flow' or 'global'
     * @returns {boolean} True if exists
     */
    has(name, scope = 'flow') {
        if (!this.scopes[scope]) return false;
        return Object.prototype.hasOwnProperty.call(this.scopes[scope], name);
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

        // Match both ${varName} and {{varName}}
        return template.replace(/(?:\$\{([^}]+)\})|(?:\{\{([^}]+)\}\})/g, (match, p1, p2) => {
            const varName = (p1 || p2).trim();

            // Try flow scope first, then global
            let value = this.scopes.flow[varName];
            if (value === undefined) {
                value = this.scopes.global[varName];
            }

            return value !== undefined ? value : match;
        });
    }

    /**
     * Resolve variable references keeping the original type if the template is just a variable
     * Example: "${count}" -> 10 (number)
     *
     * @param {string} template - String with ${var} placeholders
     * @returns {any} Resolved value or original template
     */
    resolveValue(template) {
        if (typeof template !== 'string') return template;

        // Check if the entire string is exactly one variable reference: ${varName} or {{varName}}
        const singleVarRegex = /^(?:\$\{([^}]+)\}|\{\{([^}]+)\}\})$/;
        const match = template.trim().match(singleVarRegex);

        if (match) {
            const varName = (match[1] || match[2]).trim();
            // Try flow scope first, then global
            let value = this.scopes.flow[varName];
            if (value === undefined) {
                value = this.scopes.global[varName];
            }
            if (value !== undefined) return value;
        }

        // If not a single variable, or variable not found, use standard string resolution
        return this.resolve(template);
    }

    /**
     * Recursively resolve variable references in an object or array
     * @param {any} obj - Object, array, or string to resolve
     * @returns {any} Resolved object
     */
    resolveRecursive(obj) {
        if (typeof obj === 'string') return this.resolveValue(obj);
        if (Array.isArray(obj)) return obj.map((item) => this.resolveRecursive(item));
        if (obj && typeof obj === 'object') {
            const newObj = {};
            for (const [k, v] of Object.entries(obj)) {
                newObj[k] = this.resolveRecursive(v);
            }
            return newObj;
        }
        return obj;
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

        // First resolve variable references keeping types if possible
        const resolved = this.resolveValue(expression);

        // If it's already resolved to a non-string value, return it
        if (typeof resolved !== 'string') {
            return resolved;
        }

        // If it's just a variable reference (but was not found/resolved to non-string), return it
        const hasContext = Object.keys(additionalContext).length > 0;
        if (!resolved.includes('${') && resolved === expression && !hasContext) {
            // If it's a boolean/null/undefined literal, evaluate it properly
            if (resolved === 'true') return true;
            if (resolved === 'false') return false;
            if (resolved === 'null') return null;
            if (resolved === 'undefined') return undefined;

            // If it looks like an expression (has operators, parentheses, or dots), proceed to evaluate
            // Added (.) for property access like Math.round and () for function calls like Date.now()
            if (/[><=!&|().]/.test(resolved)) {
                // proceed to evaluate
            } else {
                return resolved;
            }
        }

        // Create safe evaluation context
        const context = {
            Math,
            Date,
            JSON,
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

        // Resolve variable interpolations with type safety
        let resolvedLeft = this.resolveValue(left);
        let resolvedRight = right !== undefined ? this.resolveValue(right) : undefined;

        // Type coercion for comparison: if one is boolean, try to convert other to boolean
        if (typeof resolvedLeft === 'boolean' && typeof resolvedRight === 'string') {
            if (resolvedRight === 'true') resolvedRight = true;
            if (resolvedRight === 'false') resolvedRight = false;
        } else if (typeof resolvedRight === 'boolean' && typeof resolvedLeft === 'string') {
            if (resolvedLeft === 'true') resolvedLeft = true;
            if (resolvedLeft === 'false') resolvedLeft = false;
        }

        // Type coercion for numbers
        if (
            typeof resolvedLeft === 'number' &&
            typeof resolvedRight === 'string' &&
            !isNaN(Number(resolvedRight))
        ) {
            resolvedRight = Number(resolvedRight);
        } else if (
            typeof resolvedRight === 'number' &&
            typeof resolvedLeft === 'string' &&
            !isNaN(Number(resolvedLeft))
        ) {
            resolvedLeft = Number(resolvedLeft);
        }

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
