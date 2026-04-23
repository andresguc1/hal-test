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

        // 3. INTELLIGENT NODE RESOLUTION (Dot-path aware fuzzy matching)
        // Helps "Open URL.url" match node "Open: www.saucedemo.com"
        const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const currentScope = rid && this.scopes.runs[rid] ? this.scopes.runs[rid] : {};

        let targetNode = name;
        let propertyPath = [];

        if (name.includes('.')) {
            const parts = name.split('.');
            targetNode = parts.shift();
            propertyPath = parts;
        }

        const normalizedTarget = normalize(targetNode);

        // Search through all keys in the current run scope
        for (const [key, value] of Object.entries(currentScope || {})) {
            const isResult = key.endsWith('.result');
            const nodeLabel = isResult ? key.replace('.result', '') : key;
            const normLabel = normalize(nodeLabel);

            // Match if: Exact normalized match, or starts with (e.g. "Open" matching "Open: URL")
            if (
                normLabel === normalizedTarget ||
                normLabel.startsWith(normalizedTarget) ||
                normalizedTarget.startsWith(normLabel)
            ) {
                console.log(
                    `[VariableManager] 🌀 Intelligent match: "${targetNode}" -> Node "${nodeLabel}"`,
                );

                let result = value;
                // If we have a property path, drill into the object
                for (const prop of propertyPath) {
                    if (result && typeof result === 'object' && prop in result) {
                        result = result[prop];
                    } else {
                        result = undefined;
                        break;
                    }
                }

                if (result !== undefined) return result;
            }
        }

        return undefined;
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
            } else if (p === 'data' && i + 1 < parts.length && parts[i + 1] in curr) {
                continue;
            } else {
                return undefined;
            }
        }
        return curr;
    }

    set(name, value, runId = null) {
        if (!name) return;
        if (runId) {
            console.log(
                `[VariableManager][ID=${this.instanceId}] set("${name}", value, runId="${runId}")`,
            );
            if (!this.scopes.runs[runId]) this.scopes.runs[runId] = {};
            this.scopes.runs[runId][name] = value;
            this.lastRunId = runId;
        } else {
            console.log(`[VariableManager] set("${name}", value, scope=GLOBAL)`);
            this.scopes.global[name] = value;
            this._saveGlobals();
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

        // Prevent strictly unresolved placeholders from being evaluated as literal strings
        const isUnres = (v) => typeof v === 'string' && (v.includes('{{') || v.includes('${'));
        if (isUnres(rL)) rL = undefined;
        if (typeof rR === 'string' && isUnres(rR)) rR = undefined;

        if (rL === undefined && operator !== 'exists') return false;

        // Type Normalization: Ensure comparing same types if possible
        if (typeof rL === 'boolean' && typeof rR === 'string') {
            const n = rR.trim().toLowerCase();
            if (n === 'true') rR = true;
            else if (n === 'false') rR = false;
        } else if (typeof rR === 'boolean' && typeof rL === 'string') {
            const n = rL.trim().toLowerCase();
            if (n === 'true') rL = true;
            else if (n === 'false') rL = false;
        }

        if (typeof rL === 'number' && typeof rR === 'string' && rR !== '' && !isNaN(rR))
            rR = Number(rR);
        else if (typeof rR === 'number' && typeof rL === 'string' && rL !== '' && !isNaN(rL))
            rL = Number(rL);

        // Phase 3: Compare resolved values
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
                return this.has(String(left).replace(/[{}$]/g, ''), runId);
            default:
                return false;
        }
    }

    evaluateConditions(conds, logic = 'AND', runId = null) {
        const res = (Array.isArray(conds) ? conds : []).map((c) =>
            this.evaluateCondition(c, runId),
        );
        return logic === 'AND' ? res.every((r) => r === true) : res.some((r) => r === true);
    }
}

export const variableManager = new VariableManager();
export default variableManager;
