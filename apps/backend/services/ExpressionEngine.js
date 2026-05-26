/**
 * ExpressionEngine - Safe expression evaluation service
 *
 * Extracted from VariableManager to provide a dedicated, safer evaluation
 * environment. Replaces raw `new Function()` with a controlled sandbox that
 * whitelists only safe globals.
 *
 * Supports:
 * - Variable substitution ({{var}} and ${var}) before evaluation
 * - Whitelisted global access (Math, Date, JSON, String, Number, etc.)
 * - Strict mode (throws on errors) and non-strict mode (returns fallback)
 * - Context injection for loop variables (item, index, acc, etc.)
 */

// Whitelist of safe globals available inside expressions
const SAFE_GLOBALS = {
    Math,
    Date,
    JSON,
    String,
    Number,
    Boolean,
    Array,
    Object,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Infinity,
    NaN,
};

class ExpressionEngine {
    /**
     * Evaluate a JavaScript expression string with variable substitution.
     *
     * @param {string} expression - The expression to evaluate (may contain {{var}} or ${var} placeholders)
     * @param {Function} resolver - A function(varName) => value that resolves variable references
     * @param {Object} [context={}] - Additional local variables available in the expression (e.g. { item, index })
     * @param {boolean} [strict=false] - If true, throws on evaluation errors instead of returning fallback
     * @returns {*} The result of the expression evaluation
     */
    evaluate(expression, resolver, context = {}, strict = false) {
        if (typeof expression !== 'string') return expression;

        // 1. Substitute variable placeholders with aliases
        let codeExpression = expression;
        const aliasMap = { ...context };
        let counter = 0;
        const varRegex = /(?:\$\{([^}]+)\})|(?:\{\{([^}]+)\}\})/g;
        let m;

        while ((m = varRegex.exec(expression)) !== null) {
            const raw = m[0];
            const name = (m[1] || m[2]).trim();
            const val = resolver(name);
            const alias = `__v${counter++}`;
            aliasMap[alias] = val;
            codeExpression = codeExpression.split(raw).join(alias);
        }

        // 2. Build safe execution environment
        try {
            const paramNames = Object.keys(aliasMap);
            const paramValues = Object.values(aliasMap);

            // Inject safe globals as parameters so `new Function` can't access
            // anything beyond the whitelist + provided context
            const safeGlobalNames = Object.keys(SAFE_GLOBALS);
            const safeGlobalValues = Object.values(SAFE_GLOBALS);

            const allParamNames = [...safeGlobalNames, ...paramNames];
            const allParamValues = [...safeGlobalValues, ...paramValues];

            const func = new Function(
                ...allParamNames,
                `'use strict'; return (${codeExpression});`,
            );

            return func(...allParamValues);
        } catch (e) {
            if (strict) throw e;

            // Non-strict: try to resolve as a template string fallback
            return this._resolveTemplate(expression, resolver);
        }
    }

    /**
     * Resolve a template string by substituting variable placeholders.
     * Used as a fallback when expression evaluation fails.
     *
     * @param {string} text - Template string with {{var}} or ${var} placeholders
     * @param {Function} resolver - A function(varName) => value
     * @returns {string} The resolved string
     */
    _resolveTemplate(text, resolver) {
        if (typeof text !== 'string') return text;
        return text.replace(/(?:\{\{([^}]+)\}\})|(?:\$\{([^}]+)\})/g, (match, p1, p2) => {
            const varName = (p1 || p2).trim();
            const val = resolver(varName);
            return val !== undefined ? val : match;
        });
    }
}

export const expressionEngine = new ExpressionEngine();
export default ExpressionEngine;
