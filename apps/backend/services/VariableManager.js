/**
 * VariableManager Service
 *
 * Manages variables across different scopes (flow, global)
 * Provides safe expression evaluation for conditions and values
 *
 * Scoping Architecture:
 *   - Global: Persisted to disk, shared across all flows and sessions
 *   - Runs: Isolated per execution run (runId), ephemeral
 *   - Legacy Flow: Backward compatibility for interactive sessions without runId
 */

import * as fs from 'fs';
import * as path from 'path';
import { STORAGE_DIR } from '../config/paths.js';

const GLOBALS_FILE = path.join(STORAGE_DIR, 'global_variables.json');

class VariableManager {
    constructor() {
        this.scopes = {
            global: {}, // Persisted: shared across all flows
            runs: {}, // Ephemeral: Map of runId -> { variables }
            legacy_flow: {}, // Backward compatibility fallback
        };
        this._loadGlobals();
    }

    // ─── Persistence ────────────────────────────────────────────────────────

    /**
     * Load global variables from disk
     */
    _loadGlobals() {
        try {
            if (fs.existsSync(GLOBALS_FILE)) {
                const raw = fs.readFileSync(GLOBALS_FILE, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    this.scopes.global = parsed;
                    console.log(
                        `[VariableManager] Loaded ${Object.keys(parsed).length} global variables from disk.`,
                    );
                }
            }
        } catch (err) {
            console.warn('[VariableManager] Failed to load global variables:', err.message);
        }
    }

    /**
     * Persist global variables to disk
     */
    _saveGlobals() {
        try {
            // Ensure storage directory exists
            const dir = path.dirname(GLOBALS_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(GLOBALS_FILE, JSON.stringify(this.scopes.global, null, 2), 'utf8');
        } catch (err) {
            console.error('[VariableManager] Failed to save global variables:', err.message);
        }
    }

    // ─── Core CRUD ──────────────────────────────────────────────────────────

    /**
     * Initializes a scope for a specific run
     * @param {string} runId
     * @param {object} initialVariables - Variables to seed the run with
     */
    initRun(runId, initialVariables = {}) {
        if (!runId) return;
        if (!this.scopes.runs[runId]) {
            this.scopes.runs[runId] = { ...initialVariables };
            console.log(
                `[VariableManager] Run ${runId} initialized with ${Object.keys(initialVariables).length} variables.`,
            );
        }
    }

    /**
     * Set a variable value
     * @param {string} name - Variable name
     * @param {any} value - Variable value
     * @param {string} runId - Run ID for isolation
     * @param {string} scope - 'flow', 'global', or 'run'
     */
    set(name, value, runId = null, scope = 'flow') {
        if (scope === 'global') {
            this.scopes.global[name] = value;
            this._saveGlobals();
            return;
        }

        if (runId) {
            this.initRun(runId);
            this.scopes.runs[runId][name] = value;
        } else {
            // Default to legacy_flow if no runId and not global
            this.scopes.legacy_flow[name] = value;
        }
    }

    /**
     * Get a variable value with cascading resolution:
     *   1. Run-specific scope (isolation)
     *   2. Global scope (shared constants)
     *   3. Legacy/Session scope (backward compat)
     */
    get(name, runId = null) {
        // 1. Try Run-specific scope first (Isolation)
        if (runId && this.scopes.runs[runId] && this.scopes.runs[runId][name] !== undefined) {
            return this.scopes.runs[runId][name];
        }

        // 2. Try Global scope (Constants / Config)
        if (this.scopes.global && this.scopes.global[name] !== undefined) {
            return this.scopes.global[name];
        }

        // 3. Fallback to Legacy/Session scope
        if (this.scopes.legacy_flow[name] !== undefined) {
            return this.scopes.legacy_flow[name];
        }

        return undefined;
    }

    /**
     * Check if a variable exists
     */
    has(name, scope = 'flow') {
        if (scope === 'global') return name in this.scopes.global;
        return name in this.scopes.legacy_flow;
    }

    /**
     * Increment a numeric variable
     */
    increment(name, amount = 1, runId = null) {
        const current = this.get(name, runId) || 0;
        if (typeof current !== 'number') {
            throw new Error(`Cannot increment non-numeric variable: ${name}`);
        }
        this.set(name, current + amount, runId);
    }

    /**
     * Push value to array variable
     */
    push(name, value, runId = null) {
        const current = this.get(name, runId);
        if (!Array.isArray(current)) {
            throw new Error(`Cannot push to non-array variable: ${name}`);
        }
        current.push(value);
        this.set(name, current, runId);
    }

    /**
     * Get all variables in a scope
     */
    getAll(runId = null) {
        if (runId === 'global') {
            return { ...this.scopes.global };
        }
        if (runId && this.scopes.runs[runId]) {
            return { ...this.scopes.runs[runId] };
        }
        // Return legacy_flow for null runId (interactive sessions)
        return { ...this.scopes.legacy_flow };
    }

    /**
     * Delete a specific variable
     * @param {string} name - Variable name
     * @param {string} scope - 'global' or 'flow'
     * @param {string} runId - Run ID (for run-scoped deletion)
     */
    deleteVariable(name, scope = 'flow', runId = null) {
        if (scope === 'global') {
            delete this.scopes.global[name];
            this._saveGlobals();
            return true;
        }
        if (runId && this.scopes.runs[runId]) {
            delete this.scopes.runs[runId][name];
            return true;
        }
        delete this.scopes.legacy_flow[name];
        return true;
    }

    /**
     * Clear all variables in a scope
     */
    clear(runId = null) {
        if (runId) {
            delete this.scopes.runs[runId];
        } else {
            this.scopes.legacy_flow = {};
        }
    }

    /**
     * Clear all variables in all scopes
     */
    clearAll() {
        this.scopes.runs = {};
        this.scopes.legacy_flow = {};
        this.scopes.global = {};
        this._saveGlobals();
    }

    // ─── Resolution Engine ──────────────────────────────────────────────────

    /**
     * Resolve variable references in a string
     * Example: "Hello ${name}" -> "Hello John"
     */
    resolve(template, runId = null) {
        if (typeof template !== 'string') return template;

        // Match both ${varName} and {{varName}}
        const resolved = template.replace(
            /(?:\$\{([^}]+)\})|(?:\{\{([^}]+)\}\})/g,
            (match, p1, p2) => {
                const varName = (p1 || p2).trim();
                const value = this.get(varName, runId);
                return value !== undefined ? value : match;
            },
        );

        return resolved;
    }

    /**
     * Resolve variable references keeping the original type if the template is just a variable
     * Example: "${count}" -> 10 (number)
     */
    resolveValue(template, runId = null) {
        if (typeof template !== 'string') return template;

        // Check if the entire string is exactly one variable reference
        const singleVarRegex = /^(?:\$\{([^}]+)\}|\{\{([^}]+)\}\})$/;
        const match = template.trim().match(singleVarRegex);

        if (match) {
            const varName = (match[1] || match[2]).trim();
            const value = this.get(varName, runId);
            if (value !== undefined) return value;
        }

        // If not a single variable, use standard string resolution
        return this.resolve(template, runId);
    }

    /**
     * Recursively resolve variable references in an object or array
     */
    resolveRecursive(obj, runId = null) {
        if (typeof obj === 'string') return this.resolveValue(obj, runId);
        if (Array.isArray(obj)) return obj.map((item) => this.resolveRecursive(item, runId));
        if (obj && typeof obj === 'object') {
            const newObj = {};
            for (const [k, v] of Object.entries(obj)) {
                newObj[k] = this.resolveRecursive(v, runId);
            }
            return newObj;
        }
        return obj;
    }

    /**
     * Safely evaluate an expression with variables
     */
    evaluate(expression, runId = null, additionalContext = {}) {
        if (typeof expression !== 'string') {
            return expression;
        }

        // First resolve variable references keeping types if possible
        const resolved = this.resolveValue(expression, runId);

        // If it's already resolved to a non-string value, return it
        if (typeof resolved !== 'string') {
            return resolved;
        }

        const hasContext = Object.keys(additionalContext).length > 0;
        if (!resolved.includes('${') && resolved === expression && !hasContext) {
            if (resolved === 'true') return true;
            if (resolved === 'false') return false;
            if (resolved === 'null') return null;
            if (resolved === 'undefined') return undefined;

            if (/[><&=!|().]/.test(resolved)) {
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
            ...this.scopes.global,
            ...(runId ? this.scopes.runs[runId] : this.scopes.legacy_flow),
            ...additionalContext,
        };

        try {
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
     * Evaluate a single condition
     */
    evaluateCondition(condition, runId = null) {
        const { left, operator, right } = condition;

        let resolvedLeft = this.resolveValue(left, runId);
        let resolvedRight = right !== undefined ? this.resolveValue(right, runId) : undefined;

        // Type coercion for booleans
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
                const varName = String(left).replace(/\${(.+)}/, '$1');
                return this.has(varName, 'flow') || this.has(varName, 'global');
            }
            default:
                throw new Error(`Unknown operator: ${operator}`);
        }
    }

    /**
     * Evaluate multiple conditions with AND/OR logic
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
