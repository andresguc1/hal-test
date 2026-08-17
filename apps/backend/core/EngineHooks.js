/**
 * EngineHooks
 * Event hook system for the HalTest execution engine.
 * Allows plugins and core modules to intercept and modify behavior
 * at key lifecycle points.
 */

export const HookPhase = {
    // Flow Lifecycle
    FLOW_BEFORE_SAVE: 'flow:beforeSave',
    FLOW_AFTER_SAVE: 'flow:afterSave',
    FLOW_BEFORE_EXECUTE: 'flow:beforeExecute',
    FLOW_AFTER_EXECUTE: 'flow:afterExecute',

    // Node Lifecycle
    NODE_BEFORE_EXECUTE: 'node:beforeExecute',
    NODE_AFTER_EXECUTE: 'node:afterExecute',
    NODE_ON_ERROR: 'node:onError',

    // Export
    EXPORT_BEFORE_GENERATE: 'export:beforeGenerate',
    EXPORT_AFTER_GENERATE: 'export:afterGenerate',

    // AI
    AI_BEFORE_VALIDATION: 'ai:beforeValidation',
    AI_AFTER_GENERATION: 'ai:afterGeneration',

    // Project
    PROJECT_BEFORE_IMPORT: 'project:beforeImport',
    PROJECT_AFTER_EXPORT: 'project:afterExport',

    // Plugin
    PLUGIN_LOADED: 'plugin:loaded',
    PLUGIN_UNLOADED: 'plugin:unloaded',
};

class EngineHooks {
    constructor() {
        this._listeners = new Map();
    }

    /**
     * Registers a hook listener.
     * @param {string} phase - One of HookPhase values
     * @param {Function} callback - Async function to call
     * @param {string} pluginId - ID of the plugin registering the hook
     * @returns {Function} Unregister function
     */
    on(phase, callback, pluginId = 'core') {
        if (!this._listeners.has(phase)) {
            this._listeners.set(phase, []);
        }

        const entry = { callback, pluginId, registeredAt: Date.now() };
        this._listeners.get(phase).push(entry);

        return () => {
            this.off(phase, callback, pluginId);
        };
    }

    /**
     * Removes a hook listener.
     */
    off(phase, callback, pluginId = 'core') {
        const listeners = this._listeners.get(phase);
        if (!listeners) return;

        const idx = listeners.findIndex((l) => l.callback === callback && l.pluginId === pluginId);
        if (idx !== -1) listeners.splice(idx, 1);
    }

    /**
     * Emits a hook event, calling all registered listeners in order.
     * Listeners can modify the context object or abort the chain.
     * @param {string} phase - The hook phase
     * @param {object} context - Data object passed to listeners
     * @returns {Promise<object>} - The (possibly modified) context
     */
    async emit(phase, context = {}) {
        const listeners = this._listeners.get(phase) || [];
        let aborted = false;

        const hookContext = {
            ...context,
            phase,
            timestamp: Date.now(),
            abort() {
                aborted = true;
            },
            get aborted() {
                return aborted;
            },
        };

        for (const listener of listeners) {
            if (aborted) break;

            try {
                await listener.callback(hookContext);
            } catch (error) {
                console.error(
                    `[EngineHooks] Error in hook ${phase} (plugin: ${listener.pluginId}):`,
                    error.message,
                );
            }
        }

        return hookContext;
    }

    /**
     * Returns all hooks registered for a given phase.
     */
    getListeners(phase) {
        return (this._listeners.get(phase) || []).map((l) => ({
            pluginId: l.pluginId,
            registeredAt: l.registeredAt,
        }));
    }

    /**
     * Removes all hooks registered by a specific plugin.
     */
    removePluginHooks(pluginId) {
        for (const [phase, listeners] of this._listeners) {
            const filtered = listeners.filter((l) => l.pluginId !== pluginId);
            this._listeners.set(phase, filtered);
        }
    }

    /**
     * Returns stats about registered hooks.
     */
    stats() {
        const result = {};
        for (const [phase, listeners] of this._listeners) {
            result[phase] = listeners.length;
        }
        return result;
    }
}

export const engineHooks = new EngineHooks();
export default engineHooks;
