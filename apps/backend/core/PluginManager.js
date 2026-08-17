import fs from 'fs';
import path from 'path';
import { nodeRegistry } from './NodeRegistry.js';
import { engineHooks, HookPhase } from './EngineHooks.js';
import { STORAGE_DIR } from '../config/paths.js';

const GLOBAL_PLUGINS_DIR = path.join(STORAGE_DIR, 'plugins');

/**
 * PluginManager
 * Discovers, loads, validates, and manages the lifecycle of HalTest plugins.
 * Each plugin is a self-contained directory with a manifest.json.
 */
class PluginManager {
    constructor() {
        this._plugins = new Map();
        this._enabled = new Set();
        this._globalPluginDir = GLOBAL_PLUGINS_DIR;
    }

    // ── Discovery ─────────────────────────────────────────────

    /**
     * Discovers all plugin manifests in the global plugins directory.
     * @returns {Promise<Array<object>>} - Array of parsed manifests
     */
    async discoverPlugins() {
        this._ensureDir(this._globalPluginDir);
        const entries = fs.readdirSync(this._globalPluginDir, { withFileTypes: true });
        const manifests = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const manifestPath = path.join(this._globalPluginDir, entry.name, 'manifest.json');

            if (fs.existsSync(manifestPath)) {
                try {
                    const raw = fs.readFileSync(manifestPath, 'utf-8');
                    const manifest = JSON.parse(raw);
                    manifests.push({
                        manifest,
                        basePath: path.join(this._globalPluginDir, entry.name),
                    });
                } catch (error) {
                    console.warn(
                        `[PluginManager] Failed to parse manifest: ${entry.name}: ${error.message}`,
                    );
                }
            }
        }

        return manifests;
    }

    /**
     * Discovers plugins in a project's local plugins directory.
     */
    async discoverProjectPlugins(projectDir) {
        const localDir = path.join(projectDir, 'plugins');
        if (!fs.existsSync(localDir)) return [];

        const entries = fs.readdirSync(localDir, { withFileTypes: true });
        const manifests = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const manifestPath = path.join(localDir, entry.name, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                try {
                    const raw = fs.readFileSync(manifestPath, 'utf-8');
                    const manifest = JSON.parse(raw);
                    manifests.push({ manifest, basePath: path.join(localDir, entry.name) });
                } catch (error) {
                    console.warn(
                        `[PluginManager] Failed to parse project plugin: ${entry.name}: ${error.message}`,
                    );
                }
            }
        }

        return manifests;
    }

    // ── Loading ───────────────────────────────────────────────

    /**
     * Loads a single plugin from its manifest and basePath.
     * Registers all its nodes into the NodeRegistry.
     */
    async loadPlugin(manifest, basePath) {
        const pluginId = manifest.id;
        if (this._plugins.has(pluginId)) {
            console.warn(`[PluginManager] Plugin ${pluginId} already loaded, skipping`);
            return this._plugins.get(pluginId);
        }

        // Validate manifest
        const validation = this._validateManifest(manifest);
        if (!validation.valid) {
            throw new Error(`Invalid manifest for ${pluginId}: ${validation.errors.join(', ')}`);
        }

        const loadedPlugin = {
            manifest,
            basePath,
            nodes: new Map(),
            hooks: new Map(),
            loadedAt: Date.now(),
        };

        // Load each node definition
        for (const nodeDef of manifest.nodes || []) {
            try {
                const resolved = await this._loadNodeDefinition(nodeDef, basePath);
                loadedPlugin.nodes.set(nodeDef.type, resolved);

                // Register in global NodeRegistry
                nodeRegistry.register(
                    {
                        ...resolved,
                        type: nodeDef.type,
                        category: nodeDef.category,
                        label: nodeDef.label,
                        color: nodeDef.color,
                        icon: nodeDef.icon,
                        version: nodeDef.version,
                    },
                    pluginId,
                );
            } catch (error) {
                console.warn(
                    `[PluginManager] Failed to load node ${nodeDef.type} from ${pluginId}: ${error.message}`,
                );
            }
        }

        // Load hooks
        for (const [phase, hookPath] of Object.entries(manifest.hooks || {})) {
            try {
                const hookModule = await import(path.join(basePath, hookPath));
                const hookFn = hookModule.default || hookModule;
                loadedPlugin.hooks.set(phase, hookFn);
                engineHooks.on(phase, hookFn, pluginId);
            } catch (error) {
                console.warn(
                    `[PluginManager] Failed to load hook ${phase} from ${pluginId}: ${error.message}`,
                );
            }
        }

        this._plugins.set(pluginId, loadedPlugin);
        this._enabled.add(pluginId);

        await engineHooks.emit(HookPhase.PLUGIN_LOADED, { pluginId, manifest });
        console.log(
            `[PluginManager] ✅ Loaded plugin ${pluginId} v${manifest.version} (${loadedPlugin.nodes.size} nodes)`,
        );

        return loadedPlugin;
    }

    /**
     * Loads all discovered plugins.
     */
    async loadAllPlugins() {
        const discovered = await this.discoverPlugins();
        let loaded = 0;

        for (const { manifest, basePath } of discovered) {
            try {
                await this.loadPlugin(manifest, basePath);
                loaded++;
            } catch (error) {
                console.error(
                    `[PluginManager] Failed to load plugin ${manifest.id}: ${error.message}`,
                );
            }
        }

        console.log(`[PluginManager] Loaded ${loaded}/${discovered.length} plugins`);
        return loaded;
    }

    /**
     * Loads project-local plugins.
     */
    async loadProjectPlugins(projectDir) {
        const discovered = await this.discoverProjectPlugins(projectDir);
        for (const { manifest, basePath } of discovered) {
            try {
                await this.loadPlugin(manifest, basePath);
            } catch (error) {
                console.error(
                    `[PluginManager] Failed to load project plugin ${manifest.id}: ${error.message}`,
                );
            }
        }
    }

    // ── Plugin Management ─────────────────────────────────────

    /**
     * Enables a plugin.
     */
    async enablePlugin(pluginId) {
        if (!this._plugins.has(pluginId)) {
            throw new Error(`Plugin ${pluginId} not loaded`);
        }
        this._enabled.add(pluginId);
        await engineHooks.emit(HookPhase.PLUGIN_LOADED, { pluginId });
    }

    /**
     * Disables a plugin and unregisters its nodes.
     */
    async disablePlugin(pluginId) {
        const plugin = this._plugins.get(pluginId);
        if (!plugin) return;

        this._enabled.delete(pluginId);

        for (const nodeType of plugin.nodes.keys()) {
            nodeRegistry.unregister(nodeType);
        }

        engineHooks.removePluginHooks(pluginId);
        await engineHooks.emit(HookPhase.PLUGIN_UNLOADED, { pluginId });
    }

    /**
     * Unloads a plugin completely.
     */
    async unloadPlugin(pluginId) {
        await this.disablePlugin(pluginId);
        this._plugins.delete(pluginId);
    }

    // ── Accessors ─────────────────────────────────────────────

    getPlugin(pluginId) {
        return this._plugins.get(pluginId);
    }

    isLoaded(pluginId) {
        return this._plugins.has(pluginId);
    }

    isEnabled(pluginId) {
        return this._enabled.has(pluginId);
    }

    getAllPlugins() {
        return Array.from(this._plugins.values()).map((p) => ({
            id: p.manifest.id,
            name: p.manifest.name,
            version: p.manifest.version,
            nodeCount: p.nodes.size,
            enabled: this._enabled.has(p.manifest.id),
        }));
    }

    // ── Private Helpers ───────────────────────────────────────

    async _loadNodeDefinition(nodeDef, basePath) {
        const resolved = {
            type: nodeDef.type,
            category: nodeDef.category,
            label: nodeDef.label,
            color: nodeDef.color,
            icon: nodeDef.icon,
            version: nodeDef.version,
        };

        if (nodeDef.schema) {
            const schemaPath = path.join(basePath, nodeDef.schema);
            const schemaModule = await import(schemaPath);
            resolved.schema = schemaModule.default || schemaModule;
        }

        if (nodeDef.handler) {
            const handlerPath = path.join(basePath, nodeDef.handler);
            const handlerModule = await import(handlerPath);
            resolved.handler = handlerModule.default || handlerModule;
        }

        if (nodeDef.mapper) {
            const mapperPath = path.join(basePath, nodeDef.mapper);
            const mapperModule = await import(mapperPath);
            resolved.mapper = mapperModule.default || mapperModule;
        }

        return resolved;
    }

    _validateManifest(manifest) {
        const errors = [];

        if (!manifest.id) errors.push('Missing "id"');
        if (!manifest.name) errors.push('Missing "name"');
        if (!manifest.version) errors.push('Missing "version"');

        if (manifest.nodes && !Array.isArray(manifest.nodes)) {
            errors.push('"nodes" must be an array');
        }

        return { valid: errors.length === 0, errors };
    }

    _ensureDir(dir) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}

export const pluginManager = new PluginManager();
export default pluginManager;
