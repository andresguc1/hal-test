/**
 * ConditionEvaluator - Structured condition evaluation service
 *
 * Extracted from VariableManager to provide a dedicated, testable condition
 * evaluation engine. Handles structured conditions (left/operator/right),
 * AND/OR logic groups, and type normalization for comparisons.
 *
 * Design principles:
 * - Pure functions: no side effects, no internal state
 * - Type normalization is explicit and documented
 * - No implicit boolean coercion beyond JS standard coercion
 */

class ConditionEvaluator {
    /**
     * Evaluate a single structured condition { left, operator, right }.
     *
     * @param {Object} condition - { left: any, operator: string, right: any }
     * @param {Function} resolver - A function(varName) => value for resolving template references
     * @param {Function} [hasVar] - A function(varName) => boolean for 'exists' operator
     * @returns {boolean} The evaluation result
     */
    evaluateCondition(condition, resolver, hasVar = () => false) {
        const { left, operator, right } = condition;

        // Phase 1: Resolve variable references in operands
        let rL = this._resolveOperand(left, resolver);
        let rR = right !== undefined ? this._resolveOperand(right, resolver) : undefined;

        // Phase 2: Detect unresolved placeholders
        if (this._isUnresolved(rL)) {
            rL = undefined;
        }
        if (typeof rR === 'string' && this._isUnresolved(rR)) {
            rR = undefined;
        }

        // Phase 3: Short-circuit for undefined left (except 'exists')
        if (rL === undefined && operator !== 'exists') {
            return false;
        }

        // Phase 4: Type normalization for comparisons
        ({ left: rL, right: rR } = this._normalizeTypes(rL, rR));

        // Phase 5: Operator dispatch
        return this._compare(rL, rR, operator, left, hasVar);
    }

    /**
     * Evaluate multiple conditions with AND/OR logic.
     *
     * @param {Array} conditions - Array of { left, operator, right } objects
     * @param {string} logic - 'AND' or 'OR'
     * @param {Function} resolver - Resolver function
     * @param {Function} [hasVar] - Has-variable function
     * @returns {boolean}
     */
    evaluateConditions(conditions, logic = 'AND', resolver, hasVar) {
        const results = (Array.isArray(conditions) ? conditions : []).map((c) =>
            this.evaluateCondition(c, resolver, hasVar),
        );
        return logic === 'AND' ? results.every((r) => r === true) : results.some((r) => r === true);
    }

    /**
     * Evaluate a structured rule (shorthand for evaluateCondition with an object check).
     *
     * @param {Object} rule - A condition object
     * @param {Function} resolver - Resolver function
     * @param {Function} [hasVar] - Has-variable function
     * @returns {boolean}
     */
    evaluateStructured(rule, resolver, hasVar) {
        return rule && typeof rule === 'object'
            ? this.evaluateCondition(rule, resolver, hasVar)
            : false;
    }

    // ─── Internal Helpers ────────────────────────────────────────────────

    /**
     * Resolve a single operand value. If it looks like a template reference,
     * resolve it via the resolver function. Otherwise return as-is.
     *
     * The resolver is expected to handle bare variable names (e.g. "status")
     * and return their values. This method handles stripping template syntax
     * ({{...}} or ${...}) before calling the resolver.
     */
    _resolveOperand(value, resolver) {
        if (typeof value !== 'string') return value;

        // Check if it's a single-value template ({{var}} or ${var})
        const trimmed = value.trim();
        const singleMatch = trimmed.match(/^(?:\$\{([^}]+)\}|\{\{([^}]+)\}\})$/);
        if (singleMatch) {
            const varName = (singleMatch[1] || singleMatch[2]).trim();
            // Pass the FULL template to resolver — let it handle both
            // bare names and template strings
            const resolved = resolver(value);
            if (resolved !== undefined && resolved !== value) return resolved;
            // Fallback: try bare name
            const bareResolved = resolver(varName);
            if (bareResolved !== undefined) return bareResolved;
        }

        // Check if it contains any template syntax at all
        if (value.includes('{{') || value.includes('${')) {
            // Try resolving the full template string
            const resolved = resolver(value);
            if (resolved !== undefined && resolved !== value) return resolved;
        }

        // Plain value (no template syntax) — return as-is
        return value;
    }

    /**
     * Check if a value still contains unresolved placeholders.
     */
    _isUnresolved(v) {
        return typeof v === 'string' && (v.includes('{{') || v.includes('${'));
    }

    /**
     * Normalize types for comparison. Rules:
     * - If one operand is a number and the other is a numeric string, convert to number
     * - If one operand is boolean, normalize common boolean strings
     */
    _normalizeTypes(left, right) {
        let rL = left;
        let rR = right;

        // Numeric normalization
        if (typeof rL === 'number' && typeof rR === 'string' && rR !== '' && !isNaN(rR)) {
            rR = Number(rR);
        } else if (typeof rR === 'number' && typeof rL === 'string' && rL !== '' && !isNaN(rL)) {
            rL = Number(rL);
        }

        // Boolean normalization
        const isTrueStr = (val) =>
            typeof val === 'string' && ['true', 'success'].includes(val.toLowerCase());
        const isFalseStr = (val) =>
            typeof val === 'string' && ['false', 'error', 'fail'].includes(val.toLowerCase());

        if (typeof rL === 'boolean') {
            if (isTrueStr(rR)) rR = true;
            else if (isFalseStr(rR)) rR = false;
        } else if (typeof rR === 'boolean') {
            if (isTrueStr(rL)) rL = true;
            else if (isFalseStr(rL)) rL = false;
        }

        return { left: rL, right: rR };
    }

    /**
     * Execute the comparison operator.
     */
    _compare(rL, rR, operator, rawLeft, hasVar) {
        switch (operator) {
            case '===':
            case '==':
                return rL == rR;
            case '!==':
            case '!=':
                return rL != rR;
            case '>':
                return Number(rL) > Number(rR);
            case '<':
                return Number(rL) < Number(rR);
            case '>=':
                return Number(rL) >= Number(rR);
            case '<=':
                return Number(rL) <= Number(rR);
            case 'contains':
                return rL !== undefined && rR !== undefined && String(rL).includes(String(rR));
            case 'exists':
                return hasVar(String(rawLeft).replace(/[{}$]/g, ''));
            default:
                return false;
        }
    }
}

export const conditionEvaluator = new ConditionEvaluator();
export default ConditionEvaluator;
