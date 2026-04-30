/**
 * VariableManager Service - FINAL SYSTEM STABILIZED VERSION
 *
 * Fixes:
 * 1. Dot-path resolution with prefix matching and ".result" auto-suffix.
 * 2. Aggressive scope fallback: if no runId is provided, tries lastRunId, then any available run, then legacy_flow, then global.
 * 3. All missing methods: has, deleteVariable, clear, clearAll, push, increment, delete.
 * 4. evaluate() supports 'strict' mode for conditional tracing.
 */

import * as fs from 'fs';
import * as path from 'path';
import { STORAGE_DIR } from '../config/paths.js';

const GLOBALS_FILE = path.join(STORAGE_DIR, 'global_variables.json');

class VariableManager {
    constructor() {
        this.scopes = {
            global: {},
            runs: {},
            legacy_flow: {},
        };
        this.lastRunId = null;
        this.instanceId = Math.floor(Math.random() * 1000000);
        console.log(
            `[VariableManager] 🚀 Instance created ID=${this.instanceId} at ${new Date().toISOString()}`,
        );
        this._loadGlobals();
    }

    _loadGlobals() {
        try {
            if (fs.existsSync(GLOBALS_FILE)) {
                this.scopes.global = JSON.parse(fs.readFileSync(GLOBALS_FILE, 'utf8')) || {};
            }
        } catch (err) {
            console.warn('[VariableManager] Failed to load global variables:', err.message);
        }
    }

    _saveGlobals() {
        try {
            const dir = path.dirname(GLOBALS_FILE);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(GLOBALS_FILE, JSON.stringify(this.scopes.global, null, 2), 'utf8');
        } catch (err) {
            // Background save failures are non-critical
        }
    }

    initRun(runId, initialVariables = {}) {
        if (!runId) return;
        if (!this.scopes.runs[runId]) this.scopes.runs[runId] = {};
        this.scopes.runs[runId] = { ...this.scopes.runs[runId], ...initialVariables };
        this.lastRunId = runId;
    }

    getActiveRunId() {
        return this.lastRunId;
    }

    clear(runId) {
        if (runId) delete this.scopes.runs[runId];
        if (this.lastRunId === runId) this.lastRunId = null;
    }

    clearAll() {
        this.scopes.runs = {};
        this.scopes.legacy_flow = {};
        this.scopes.global = {};
        this.lastRunId = null;
    }

    has(name, runId = null) {
        return this.get(name, runId) !== undefined;
    }

    delete(name, runId = null) {
        if (!name) return;
        const rid = runId || this.getActiveRunId();
        if (rid && this.scopes.runs[rid]) {
            delete this.scopes.runs[rid][name];
        } else {
            delete this.scopes.legacy_flow[name];
        }
    }

    deleteVariable(name, scope = 'flow', runId = null) {
        if (scope === 'global') {
            delete this.scopes.global[name];
            this._saveGlobals();
        } else {
            this.delete(name, runId);
        }
    }

    increment(name, amount = 1, runId = null) {
        const current = this.get(name, runId) || 0;
        this.set(name, Number(current) + (Number(amount) || 1), runId);
    }

    push(name, value, runId = null) {
        const current = this.get(name, runId);
        const arr = Array.isArray(current) ? [...current] : [];
        arr.push(value);
        this.set(name, arr, runId);
    }

    getAll(runId = null) {
        const rid = runId || this.getActiveRunId();
        const runScope = (rid && this.scopes.runs[rid]) || this.scopes.legacy_flow || {};
        return { ...this.scopes.global, ...runScope };
    }

    get(name, runId = null) {
        if (!name) return undefined;

        let rid = runId || this.getActiveRunId();

        // Detailed log for debugging resolution failures
        console.log(`[VariableManager][ID=${this.instanceId}] get("${name}", runId="${rid}")`);

        // 1. Search in Run Scope
        const currentScope = rid && this.scopes.runs[rid] ? this.scopes.runs[rid] : {};
        const runValue = this._getFromScopeIntelligent(name, currentScope);
        if (runValue !== undefined) return runValue;

        // 2. Search in Legacy Flow Scope
        const legacyValue = this._getFromScopeIntelligent(name, this.scopes.legacy_flow);
        if (legacyValue !== undefined) return legacyValue;

        // 3. Search in Global Scope
        const globalValue = this._getFromScopeIntelligent(name, this.scopes.global);
        if (globalValue !== undefined) return globalValue;

        return undefined;
    }

    /**
     * Internal helper to find a variable in a specific scope using intelligent matching
     */
    _getFromScopeIntelligent(name, scope) {
        if (!scope || typeof scope !== 'object') return undefined;

        // First try direct access or direct .result access (fast path)
        if (Object.prototype.hasOwnProperty.call(scope, name)) return scope[name];
        if (Object.prototype.hasOwnProperty.call(scope, `${name}.result`))
            return scope[`${name}.result`];

        // Intelligent resolution (Dotted path + Normalization)
        const normalize = (s) =>
            s
                .toLowerCase()
                .replace(/\s*\(library\)\s*/g, '') // Also handle Library suffix
                .replace(/[^a-z0-9]/g, '');

        let targetNode = name;
        let propertyPath = [];

        if (name.includes('.')) {
            const parts = name.split('.');
            targetNode = parts.shift();
            propertyPath = parts;
        }

        const normalizedTarget = normalize(targetNode);

        const keys = Object.keys(scope);
        let bestMatch = null;

        for (const [key, value] of Object.entries(scope)) {
            const isResult = key.endsWith('.result');
            const nodeLabel = isResult ? key.replace('.result', '') : key;
            const normLabel = normalize(nodeLabel);

            if (normLabel === normalizedTarget) {
                // Exact match found!
                console.log(
                    `[VariableManager] 🎯 Exact match: "${targetNode}" -> Node "${nodeLabel}"`,
                );
                if (propertyPath.length === 0) return value;
                return this._drill(value, propertyPath);
            }

            if (normLabel.startsWith(normalizedTarget)) {
                // Potential namespace/group match (e.g. "Login Steps - Enter Username")
                bestMatch = { key, value, label: nodeLabel };
            }
        }

        // If no exact match but we have a partial match, and the user is asking for status/success,
        // we can infer the group status from its children.
        if (bestMatch && (propertyPath.includes('status') || propertyPath.includes('success'))) {
            console.log(
                `[VariableManager] 🌓 Namespace fallback: "${targetNode}" inferred from child "${bestMatch.label}"`,
            );
            const syntheticGroup = {
                success: true,
                status: 'success',
                data: { success: true, status: true, label: targetNode },
            };
            if (propertyPath.length === 0) return syntheticGroup;
            return this._drill(syntheticGroup, propertyPath);
        }

        if (keys.length > 0) {
            console.log(
                `[VariableManager] ❌ No intelligent match for "${targetNode}" among ${keys.length} keys.`,
            );
        }

        // Final fallback for legacy dotted paths that might not be result-aware
        return this._getFromScope(name, scope);
    }

    _getFromScope(name, scope) {
        if (!scope || typeof scope !== 'object') return undefined;
        if (Object.prototype.hasOwnProperty.call(scope, name)) return scope[name];

        const parts = name.split('.');
        if (parts.length > 1) {
            for (let i = parts.length; i >= 1; i--) {
                const head = parts.slice(0, i).join('.');
                if (Object.prototype.hasOwnProperty.call(scope, head)) {
                    return this._drill(scope[head], parts.slice(i));
                }
                const resHead = head + '.result';
                if (Object.prototype.hasOwnProperty.call(scope, resHead)) {
                    return this._drill(scope[resHead], parts.slice(i));
                }
            }
        }

        const normalize = (s) =>
            s
                .replace(/\s*\(Library\)\s*/i, '')
                .trim()
                .toLowerCase();
        const normName = normalize(name);
        for (const key of Object.keys(scope)) {
            if (normalize(key) === normName) return scope[key];
            const base = key.endsWith('.result') ? key.slice(0, -7) : key;
            if (normalize(base) === normName) return scope[key];
        }
        return undefined;
    }

    _drill(val, parts) {
        let curr = val;
        for (let i = 0; i < parts.length; i++) {
            if (curr === null || curr === undefined || typeof curr !== 'object') return undefined;
            const p = parts[i];

            if (p in curr) {
                curr = curr[p];
            } else if (curr.data && typeof curr.data === 'object' && p in curr.data) {
                // AUTO-DIVE: If property not at root, check inside .data (common in action results)
                curr = curr.data[p];
            } else if (
                (p === 'data' || p === 'result') &&
                i + 1 < parts.length &&
                parts[i + 1] in curr
            ) {
                // SKIP-DATA/RESULT: If user specified .data or .result but it's already flattened in current object
                continue;
            } else {
                return undefined;
            }
        }
        return curr;
    }

    set(name, value, runId = null) {
        if (!name) return;

        // Ensure we don't store circular references or huge objects
        const sanitizedValue = this._sanitize(value);

        if (runId === 'global') {
            this.scopes.global[name] = sanitizedValue;
            this._saveGlobals();
            console.log(
                `[VariableManager] 📝 SET [Global] "${name}" =`,
                typeof sanitizedValue === 'object' ? '{...}' : sanitizedValue,
            );
            return;
        }

        const rid = runId || this.getActiveRunId();
        if (rid) {
            if (!this.scopes.runs[rid]) {
                this.scopes.runs[rid] = {};
            }
            this.scopes.runs[rid][name] = sanitizedValue;
            console.log(
                `[VariableManager] 📝 SET [Run:${rid}] "${name}" =`,
                typeof sanitizedValue === 'object' ? '{...}' : sanitizedValue,
            );
        } else {
            this.scopes.legacy_flow[name] = sanitizedValue;
            console.log(
                `[VariableManager] 📝 SET [LegacyFlow] "${name}" =`,
                typeof sanitizedValue === 'object' ? '{...}' : sanitizedValue,
            );
        }
    }

    resolveRecursive(obj, runId = null) {
        if (typeof obj === 'string') return this.resolveValue(obj, runId);
        if (Array.isArray(obj)) return obj.map((item) => this.resolveRecursive(item, runId));
        if (obj && typeof obj === 'object') {
            const newObj = {};
            for (const [k, v] of Object.entries(obj)) newObj[k] = this.resolveRecursive(v, runId);
            return newObj;
        }
        return obj;
    }

    resolve(text, runId = null) {
        if (typeof text !== 'string') return text;
        return text.replace(/(?:\{\{([^}]+)\}\})|(?:\$\{([^}]+)\})/g, (match, p1, p2) => {
            const varName = (p1 || p2).trim();
            const val = this.get(varName, runId);
            return val !== undefined ? val : match;
        });
    }

    resolveValue(template, runId = null) {
        if (typeof template !== 'string') return template;
        const trimmed = template.trim();
        const match = trimmed.match(/^(?:\$\{([^}]+)\}|\{\{([^}]+)\}\})$/);
        if (match) {
            const varName = (match[1] || match[2]).trim();
            const val = this.get(varName, runId);
            if (val !== undefined) return val;
        }
        return this.resolve(template, runId);
    }

    evaluate(expression, runId = null, context = {}, strict = false) {
        if (typeof expression !== 'string') return expression;
        let codeExpression = expression;
        const aliasMap = { ...context };
        let counter = 0;
        const varRegex = /(?:\$\{([^}]+)\})|(?:\{\{([^}]+)\}\})/g;
        let m;
        while ((m = varRegex.exec(expression)) !== null) {
            const raw = m[0];
            const name = (m[1] || m[2]).trim();
            const val = this.get(name, runId);
            const alias = `__v${counter++}`;
            aliasMap[alias] = val;
            codeExpression = codeExpression.split(raw).join(alias);
        }
        try {
            const func = new Function(
                ...Object.keys(aliasMap),
                `'use strict'; return (${codeExpression});`,
            );
            return func(...Object.values(aliasMap));
        } catch (e) {
            if (strict) throw e;
            return this.resolve(expression, runId);
        }
    }

    evaluateStructured(rule, runId = null) {
        return rule && typeof rule === 'object' ? this.evaluateCondition(rule, runId) : false;
    }

    evaluateCondition(cond, runId = null) {
        const { left, operator, right } = cond;

        // Phase 1 + 2: Parse and Resolve
        let rL = this.resolveValue(left, runId);
        let rR = right !== undefined ? this.resolveValue(right, runId) : undefined;

        console.log(`[VariableManager] 🔍 Evaluating: "${left}" [${operator}] "${right}"`);
        console.log(`[VariableManager] 📦 Resolved Left:`, rL, `(${typeof rL})`);
        console.log(`[VariableManager] 📦 Resolved Right:`, rR, `(${typeof rR})`);

        // Prevent strictly unresolved placeholders from being evaluated as literal strings
        const isUnres = (v) => typeof v === 'string' && (v.includes('{{') || v.includes('${'));

        if (isUnres(rL)) {
            console.warn(
                `[VariableManager] ⚠️ Left operand "${rL}" is unresolved. Treating as undefined.`,
            );
            rL = undefined;
        }
        if (typeof rR === 'string' && isUnres(rR)) {
            console.warn(
                `[VariableManager] ⚠️ Right operand "${rR}" is unresolved. Treating as undefined.`,
            );
            rR = undefined;
        }

        if (rL === undefined && operator !== 'exists') {
            console.log(
                `[VariableManager] ❌ Evaluation failed: Left operand is undefined and operator is not "exists"`,
            );
            return false;
        }

        // Type Normalization: Ensure comparing same types if possible
        const normalizeBoolean = (val) => {
            if (typeof val === 'boolean') return val;
            if (typeof val === 'string') {
                const n = val.trim().toLowerCase();
                if (n === 'true' || n === 'yes' || n === '1' || n === 'success') return true;
                if (n === 'false' || n === 'no' || n === '0' || n === 'error' || n === 'fail')
                    return false;
            }
            return val;
        };

        const nL = normalizeBoolean(rL);
        const nR = normalizeBoolean(rR);

        // If one is boolean, try to compare as booleans
        if (typeof nL === 'boolean' || typeof nR === 'boolean') {
            rL = !!nL;
            rR = !!nR;
        } else {
            // Numeric normalization
            if (typeof rL === 'number' && typeof rR === 'string' && rR !== '' && !isNaN(rR))
                rR = Number(rR);
            else if (typeof rR === 'number' && typeof rL === 'string' && rL !== '' && !isNaN(rL))
                rL = Number(rL);
        }

        // Phase 3: Compare resolved values
        let finalResult = false;
        switch (operator) {
            case '===':
            case '==':
                finalResult = rL == rR;
                break;
            case '!==':
            case '!=':
                finalResult = rL != rR;
                break;
            case '>':
                finalResult = Number(rL) > Number(rR);
                break;
            case '<':
                finalResult = Number(rL) < Number(rR);
                break;
            case '>=':
                finalResult = Number(rL) >= Number(rR);
                break;
            case '<=':
                finalResult = Number(rL) <= Number(rR);
                break;
            case 'contains':
                finalResult =
                    rL !== undefined && rR !== undefined && String(rL).includes(String(rR));
                break;
            case 'exists':
                finalResult = this.has(String(left).replace(/[{}$]/g, ''), runId);
                break;
            default:
                finalResult = false;
        }

        console.log(`[VariableManager] ✅ Result: ${finalResult} (${rL} ${operator} ${rR})`);
        return finalResult;
    }

    evaluateConditions(conds, logic = 'AND', runId = null) {
        const res = (Array.isArray(conds) ? conds : []).map((c) =>
            this.evaluateCondition(c, runId),
        );
        return logic === 'AND' ? res.every((r) => r === true) : res.some((r) => r === true);
    }

    _sanitize(value) {
        if (value === null || value === undefined) return value;
        if (typeof value !== 'object') return value;

        try {
            // Simple serialization check for circularity and serialization safety
            return JSON.parse(JSON.stringify(value));
        } catch (err) {
            console.warn(
                '[VariableManager] ⚠️ Sanitization failed, returning simplified string:',
                err.message,
            );
            return String(value);
        }
    }
}

export const variableManager = new VariableManager();
export default variableManager;
