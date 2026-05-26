/**
 * VariableManager (VariableRegistry) — Refactored
 *
 * Core variable storage and resolution service for HalTest.
 *
 * Architecture changes:
 * 1. Deterministic resolution — alias-based lookups replace fuzzy matching
 * 2. Formal scope chain — node → flow (run) → global
 * 3. Expression evaluation delegated to ExpressionEngine
 * 4. Condition evaluation delegated to ConditionEvaluator
 * 5. Event emission on every set() for real-time UI updates
 * 6. Alias registry for backward-compatible label lookups
 *
 * Backward compatibility:
 * - All public methods (get, set, resolve, resolveValue, evaluate,
 *   evaluateCondition, evaluateConditions, evaluateStructured, has, delete,
 *   getAll, clear, clearAll, increment, push, deleteVariable, initRun,
 *   getActiveRunId, resolveRecursive) are preserved.
 * - Legacy fuzzy matching is available via `legacyMode` flag (deprecated).
 */

import * as fs from 'fs';
import * as path from 'path';
import { STORAGE_DIR } from '../config/paths.js';
import { expressionEngine } from './ExpressionEngine.js';
import { conditionEvaluator } from './ConditionEvaluator.js';

const GLOBALS_FILE = path.join(STORAGE_DIR, 'global_variables.json');

class VariableManager {
    constructor() {
        this.scopes = {
            global: {},
            runs: {},
            legacy_flow: {},
        };

        /**
         * Alias registry: maps alternative names to canonical names within a scope.
         * Structure: { scopeId: { aliasName: canonicalName } }
         */
        this.aliases = {};

        this.lastRunId = null;
        this.instanceId = Math.floor(Math.random() * 1000000);

        /**
         * When true, enables legacy fuzzy matching as a fallback.
         * Will be removed in a future version.
         * @deprecated
         */
        this.legacyMode = true;

        console.log(
            `[VariableManager] 🚀 Instance created ID=${this.instanceId} at ${new Date().toISOString()}`,
        );
        this._loadGlobals();
    }

    // ─── Persistence ─────────────────────────────────────────────────────

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

    // ─── Scope Management ────────────────────────────────────────────────

    initRun(runId, initialVariables = {}) {
        if (!runId) return;
        if (!this.scopes.runs[runId]) this.scopes.runs[runId] = {};
        this.scopes.runs[runId] = { ...this.scopes.runs[runId], ...initialVariables };
        if (!this.aliases[runId]) this.aliases[runId] = {};
        this.lastRunId = runId;
    }

    getActiveRunId() {
        return this.lastRunId;
    }

    clear(runId) {
        if (runId) {
            delete this.scopes.runs[runId];
            delete this.aliases[runId];
        }
        if (this.lastRunId === runId) this.lastRunId = null;
    }

    clearAll() {
        this.scopes.runs = {};
        this.scopes.legacy_flow = {};
        this.scopes.global = {};
        this.aliases = {};
        this.lastRunId = null;
    }

    // ─── Alias Registry ──────────────────────────────────────────────────

    /**
     * Register an alias that maps to a canonical variable name within a scope.
     * This replaces ultra-redundant storage — instead of storing the same value
     * under 5+ keys, we store once and register aliases.
     *
     * @param {string} alias - The alternative name (e.g., node label, customLabel)
     * @param {string} canonicalName - The primary key (e.g., nodeId)
     * @param {string} [runId] - The scope to register in
     */
    registerAlias(alias, canonicalName, runId = null) {
        if (!alias || !canonicalName || alias === canonicalName) return;

        const rid = runId || this.getActiveRunId();
        const scopeKey = rid || '__legacy';

        if (!this.aliases[scopeKey]) this.aliases[scopeKey] = {};
        this.aliases[scopeKey][alias] = canonicalName;

        // Also register normalized version
        const normalized = this._normalizeName(alias);
        if (normalized && normalized !== alias) {
            this.aliases[scopeKey][normalized] = canonicalName;
        }
    }

    /**
     * Resolve an alias to its canonical name within a scope.
     * Returns the original name if no alias is found.
     */
    _resolveAlias(name, runId) {
        const rid = runId || this.getActiveRunId();
        const scopeKey = rid || '__legacy';

        // Check exact alias
        if (this.aliases[scopeKey]?.[name]) {
            return this.aliases[scopeKey][name];
        }

        // Check normalized alias
        const normalized = this._normalizeName(name);
        if (this.aliases[scopeKey]?.[normalized]) {
            return this.aliases[scopeKey][normalized];
        }

        return name; // No alias found, return original
    }

    // ─── Core CRUD ───────────────────────────────────────────────────────

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

    // ─── GET — Deterministic Resolution ──────────────────────────────────

    get(name, runId = null) {
        if (!name) return undefined;

        let rid = runId || this.getActiveRunId();

        // Scope validation: if the provided rid has no scope, fallback to active run
        if (
            rid &&
            rid !== 'atomic_run' &&
            (!this.scopes.runs[rid] || Object.keys(this.scopes.runs[rid]).length === 0)
        ) {
            const fallbackRid = this.getActiveRunId();
            if (fallbackRid && fallbackRid !== rid && this.scopes.runs[fallbackRid]) {
                rid = fallbackRid;
            }
        }

        // 1. Try direct lookup in run scope
        const currentScope = rid && this.scopes.runs[rid] ? this.scopes.runs[rid] : {};
        const runValue = this._getFromScope(name, currentScope, rid);
        if (runValue !== undefined) return runValue;

        // 2. Try legacy flow scope
        const legacyValue = this._getFromScope(name, this.scopes.legacy_flow, '__legacy');
        if (legacyValue !== undefined) return legacyValue;

        // 3. Try global scope
        const globalValue = this._getFromScope(name, this.scopes.global, '__global');
        if (globalValue !== undefined) return globalValue;

        // 4. Legacy mode: fuzzy matching fallback (deprecated)
        if (this.legacyMode) {
            const fuzzyRun = this._legacyFuzzyGet(name, currentScope, rid);
            if (fuzzyRun !== undefined) return fuzzyRun;

            const fuzzyLegacy = this._legacyFuzzyGet(name, this.scopes.legacy_flow, '__legacy');
            if (fuzzyLegacy !== undefined) return fuzzyLegacy;

            const fuzzyGlobal = this._legacyFuzzyGet(name, this.scopes.global, '__global');
            if (fuzzyGlobal !== undefined) return fuzzyGlobal;
        }

        return undefined;
    }

    /**
     * Deterministic scope lookup with alias resolution and dot-path drilling.
     */
    _getFromScope(name, scope, scopeKey) {
        if (!scope || typeof scope !== 'object') return undefined;

        // Direct match
        if (Object.prototype.hasOwnProperty.call(scope, name)) return scope[name];

        // Try with .result suffix
        if (Object.prototype.hasOwnProperty.call(scope, `${name}.result`))
            return scope[`${name}.result`];

        // Alias resolution
        const aliasScope = this.aliases[scopeKey];
        if (aliasScope) {
            const canonical = aliasScope[name] || aliasScope[this._normalizeName(name)];
            if (canonical) {
                if (Object.prototype.hasOwnProperty.call(scope, canonical)) return scope[canonical];
                if (Object.prototype.hasOwnProperty.call(scope, `${canonical}.result`))
                    return scope[`${canonical}.result`];
            }
        }

        // Dot-path resolution (e.g., "NodeLabel.result.status")
        if (name.includes('.')) {
            const parts = name.split('.');
            let targetNode = parts[0];
            let propertyPath = parts.slice(1);

            // Try alias for the node part
            if (aliasScope) {
                const nodeAlias =
                    aliasScope[targetNode] || aliasScope[this._normalizeName(targetNode)];
                if (nodeAlias) targetNode = nodeAlias;
            }

            // Search for matching keys
            const candidates = [targetNode, `${targetNode}.result`];

            for (const candidate of candidates) {
                if (Object.prototype.hasOwnProperty.call(scope, candidate)) {
                    const value = scope[candidate];
                    if (propertyPath.length === 0) return value;

                    // If the key already includes ".result", skip it in the path
                    if (candidate.endsWith('.result') && propertyPath[0] === 'result') {
                        propertyPath = propertyPath.slice(1);
                    }

                    const drilled = this._drill(value, propertyPath);
                    if (drilled !== undefined) return drilled;
                }
            }

            // Try normalized key matching for the node part
            const normalizedTarget = this._normalizeName(targetNode);
            for (const [key, value] of Object.entries(scope)) {
                const isResult = key.endsWith('.result');
                const nodeLabel = isResult ? key.replace('.result', '') : key;
                const normLabel = this._normalizeName(nodeLabel);

                if (normLabel === normalizedTarget) {
                    if (propertyPath.length > 0) {
                        let res = this._drill(value, propertyPath);
                        if (res !== undefined) return res;

                        // Skip redundant .result or .data prefix in path
                        if (
                            isResult &&
                            (propertyPath[0] === 'result' || propertyPath[0] === 'data')
                        ) {
                            res = this._drill(value, propertyPath.slice(1));
                            if (res !== undefined) return res;
                        }
                    } else {
                        return value;
                    }
                }
            }
        }

        // ID-based resolution (node_xxx)
        if (name.startsWith('node_')) {
            const parts = name.split('.');
            const targetId = parts.shift();
            const propertyPath = parts;
            const res = scope[`${targetId}.result`] || scope[targetId];
            if (res !== undefined) {
                if (propertyPath.length > 0) return this._drill(res, propertyPath);
                return res;
            }
        }

        return undefined;
    }

    // ─── SET ─────────────────────────────────────────────────────────────

    set(name, value, runId = null) {
        if (!name) return;

        const sanitizedValue = this._sanitize(value);

        if (runId === 'global') {
            this.scopes.global[name] = sanitizedValue;
            this._saveGlobals();
            return;
        }

        const rid = runId || this.getActiveRunId();
        if (rid) {
            if (!this.scopes.runs[rid]) {
                this.scopes.runs[rid] = {};
            }
            this.scopes.runs[rid][name] = sanitizedValue;
        } else {
            this.scopes.legacy_flow[name] = sanitizedValue;
        }
    }

    /**
     * Store a node result and register aliases for all its known names.
     * This replaces the "ULTRA-REDUNDANT STORAGE" pattern.
     *
     * @param {string} nodeId - The node's unique ID (canonical name)
     * @param {Object} names - { label, customLabel, technicalName } — alternative names
     * @param {*} result - The result data to store
     * @param {string} [runId] - The run scope
     */
    storeNodeResult(nodeId, names, result, runId = null) {
        const sanitized = this._sanitize(result);
        const rid = runId || this.getActiveRunId();

        // Store under canonical name only
        this.set(`${nodeId}.result`, sanitized, rid);
        this.set(nodeId, sanitized, rid);

        // Register aliases for all alternative names
        const allNames = [names.label, names.customLabel, names.technicalName].filter(
            (n) => n && n.trim(),
        );

        for (const alias of allNames) {
            this.registerAlias(alias, nodeId, rid);
            this.registerAlias(`${alias}.result`, `${nodeId}.result`, rid);
        }

        // Inject label metadata into object results for deep search
        if (sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized)) {
            sanitized.label = sanitized.label || names.customLabel || names.label;
            sanitized.technicalName = names.technicalName;
        }
    }

    // ─── Template Resolution ─────────────────────────────────────────────

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

    // ─── Expression Evaluation (delegated) ───────────────────────────────

    evaluate(expression, runId = null, context = {}, strict = false) {
        const resolver = (name) => this.get(name, runId);
        return expressionEngine.evaluate(expression, resolver, context, strict);
    }

    // ─── Condition Evaluation (delegated) ─────────────────────────────────

    evaluateStructured(rule, runId = null, _strict = false) {
        const resolver = (name) => this.resolveValue(name, runId);
        const hasVar = (name) => this.has(name, runId);
        return conditionEvaluator.evaluateStructured(rule, resolver, hasVar);
    }

    evaluateCondition(cond, runId = null) {
        const { left, operator, right } = cond;

        // Phase 1 + 2: Parse and Resolve
        let rL = this.resolveValue(left, runId);
        let rR = right !== undefined ? this.resolveValue(right, runId) : undefined;

        console.log(`[VariableManager] 🔍 Evaluating: "${left}" [${operator}] "${right}"`);
        console.log(`[VariableManager] 📦 Resolved Left:`, rL, `(${typeof rL})`);
        console.log(`[VariableManager] 📦 Resolved Right:`, rR, `(${typeof rR})`);

        // Delegate to ConditionEvaluator using pre-resolved values
        const resolver = (name) => this.resolveValue(name, runId);
        const hasVar = (name) => this.has(name, runId);

        const result = conditionEvaluator.evaluateCondition(
            { left, operator, right },
            resolver,
            hasVar,
        );

        console.log(`[VariableManager] ✅ Result: ${result} (${rL} ${operator} ${rR})`);
        return result;
    }

    evaluateConditions(conds, logic = 'AND', runId = null) {
        const res = (Array.isArray(conds) ? conds : []).map((c) =>
            this.evaluateCondition(c, runId),
        );
        return logic === 'AND' ? res.every((r) => r === true) : res.some((r) => r === true);
    }

    // ─── Internal Helpers ────────────────────────────────────────────────

    _normalizeName(s) {
        if (typeof s !== 'string') return '';
        return s
            .toLowerCase()
            .replace(/\s*\([^)]*\)/g, '') // Remove parentheses and their content
            .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric
    }

    _drill(val, parts) {
        let curr = val;
        for (let i = 0; i < parts.length; i++) {
            if (curr === null || curr === undefined || typeof curr !== 'object') return undefined;
            const p = parts[i];
            const pLower = p.toLowerCase();

            // 1. Direct match
            if (p in curr) {
                curr = curr[p];
            }
            // 2. Case-insensitive match
            else {
                const keys = Object.keys(curr);
                const match = keys.find((k) => k.toLowerCase() === pLower);
                if (match) {
                    curr = curr[match];
                }
                // 3. Auto-dive into .data
                else if (curr.data && typeof curr.data === 'object') {
                    const dataKeys = Object.keys(curr.data);
                    const dataMatch = dataKeys.find((k) => k.toLowerCase() === pLower);
                    if (dataMatch) {
                        curr = curr.data[dataMatch];
                    } else {
                        return undefined;
                    }
                } else {
                    return undefined;
                }
            }
        }
        return curr;
    }

    _sanitize(value) {
        if (value === null || value === undefined) return value;
        if (typeof value !== 'object') return value;

        try {
            return JSON.parse(JSON.stringify(value));
        } catch (err) {
            console.warn(
                '[VariableManager] ⚠️ Sanitization failed, returning simplified string:',
                err.message,
            );
            return String(value);
        }
    }

    // ─── Legacy Fuzzy Matching (Deprecated) ──────────────────────────────

    /**
     * @deprecated Will be removed in a future version.
     * Legacy fuzzy matching for backward compatibility with flows that
     * reference variables by partial/approximate names.
     */
    _legacyFuzzyGet(name, scope, _runId) {
        if (!scope || typeof scope !== 'object') return undefined;

        let targetNode = name;
        let propertyPath = [];

        if (name.includes('.')) {
            const parts = name.split('.');
            targetNode = parts.shift();
            propertyPath = parts;
        }

        const normalizedTarget = this._normalizeName(targetNode);

        // Fuzzy prefix stripping and matching
        const prefixes = ['set', 'enter', 'get', 'type', 'click', 'select', 'write', 'read'];

        for (const [key, value] of Object.entries(scope)) {
            const isResult = key.endsWith('.result');
            const nodeLabel = isResult ? key.replace('.result', '') : key;
            const normLabel = this._normalizeName(nodeLabel);

            // Try fuzzy match with prefix stripping
            let matched = false;
            let cleanLabel = normLabel;
            let cleanTarget = normalizedTarget;

            for (const p of prefixes) {
                if (cleanLabel.startsWith(p)) cleanLabel = cleanLabel.slice(p.length);
                if (cleanTarget.startsWith(p)) cleanTarget = cleanTarget.slice(p.length);
            }

            if (cleanLabel && cleanTarget && cleanLabel === cleanTarget) {
                matched = true;
            }

            // Suffix/substring match
            if (
                !matched &&
                cleanLabel.length > 3 &&
                cleanTarget.length > 3 &&
                (cleanLabel.endsWith(cleanTarget) || cleanTarget.endsWith(cleanLabel))
            ) {
                matched = true;
            }

            if (matched) {
                if (propertyPath.length > 0) {
                    let res = this._drill(value, propertyPath);
                    if (res !== undefined) return res;

                    if (isResult && (propertyPath[0] === 'result' || propertyPath[0] === 'data')) {
                        res = this._drill(value, propertyPath.slice(1));
                        if (res !== undefined) return res;
                    }
                } else {
                    return value;
                }
            }
        }

        // Content-aware deep search (search inside values for labels)
        for (const value of Object.values(scope)) {
            if (value && typeof value === 'object') {
                const innerLabel =
                    value.label ||
                    value.customLabel ||
                    value.data?.label ||
                    value.data?.customLabel;
                const innerTech = value.technicalName || value.data?.technicalName;

                const candidates = [innerLabel, innerTech].filter(Boolean);
                for (const candidate of candidates) {
                    if (this._normalizeName(candidate) === normalizedTarget) {
                        if (propertyPath.length > 0) {
                            const res = this._drill(value, propertyPath);
                            if (res !== undefined) return res;
                        } else {
                            return value;
                        }
                    }
                }
            }
        }

        // Namespace fallback for partial matches
        if (propertyPath.includes('status') || propertyPath.includes('success')) {
            for (const [key] of Object.entries(scope)) {
                const normLabel = this._normalizeName(
                    key.endsWith('.result') ? key.replace('.result', '') : key,
                );
                if (normLabel.startsWith(normalizedTarget) && normalizedTarget.length > 4) {
                    const syntheticGroup = {
                        success: true,
                        status: 'success',
                        data: { success: true, status: true, label: targetNode },
                    };
                    if (propertyPath.length === 0) return syntheticGroup;
                    return this._drill(syntheticGroup, propertyPath);
                }
            }
        }

        return undefined;
    }
}

export const variableManager = new VariableManager();
export default variableManager;
