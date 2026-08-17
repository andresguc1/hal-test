/**
 * NodeRegistry
 * Unified registry for all node types across core and plugins.
 * Replaces the static NodeMapperRegistry for runtime node management.
 */
class NodeRegistry {
    constructor() {
        this._nodes = new Map();
        this._categories = new Map();
    }

    /**
     * Registers a node type definition.
     * @param {object} definition - { type, category, label, color, icon, version, schema, handler, mapper, frontend }
     * @param {string} source - 'core' or plugin ID
     */
    register(definition, source = 'core') {
        const nodeType = definition.type;
        if (!nodeType) throw new Error('Node definition must have a type');

        this._nodes.set(nodeType, {
            ...definition,
            source,
            registeredAt: Date.now(),
        });

        if (definition.category) {
            if (!this._categories.has(definition.category)) {
                this._categories.set(definition.category, []);
            }
            const catNodes = this._categories.get(definition.category);
            if (!catNodes.includes(nodeType)) {
                catNodes.push(nodeType);
            }
        }
    }

    /**
     * Unregisters a node type.
     */
    unregister(nodeType) {
        const def = this._nodes.get(nodeType);
        if (def?.category) {
            const catNodes = this._categories.get(def.category);
            if (catNodes) {
                const idx = catNodes.indexOf(nodeType);
                if (idx !== -1) catNodes.splice(idx, 1);
            }
        }
        this._nodes.delete(nodeType);
    }

    /**
     * Gets a node definition by type.
     */
    get(nodeType) {
        return this._nodes.get(nodeType);
    }

    /**
     * Gets the handler function for a node type.
     */
    getHandler(nodeType) {
        return this._nodes.get(nodeType)?.handler;
    }

    /**
     * Gets the Joi schema for a node type.
     */
    getSchema(nodeType) {
        return this._nodes.get(nodeType)?.schema;
    }

    /**
     * Gets the code generation mapper for a node type.
     */
    getMapper(nodeType) {
        return this._nodes.get(nodeType)?.mapper;
    }

    /**
     * Gets all node types for a category.
     */
    getByCategory(category) {
        return (this._categories.get(category) || []).map((t) => this._nodes.get(t));
    }

    /**
     * Returns all registered node types.
     */
    getAllTypes() {
        return Array.from(this._nodes.keys());
    }

    /**
     * Returns all categories with their node types.
     */
    getAllCategories() {
        const result = {};
        for (const [cat, types] of this._categories) {
            result[cat] = types;
        }
        return result;
    }

    /**
     * Returns node definitions formatted for the frontend.
     * Compatible with existing NODE_CATEGORIES structure.
     */
    getFrontendDefinitions() {
        const categories = {};

        for (const [nodeType, def] of this._nodes) {
            const cat = def.category || 'uncategorized';
            if (!categories[cat]) {
                categories[cat] = {
                    icon: def.icon || 'Box',
                    color: def.color || 'slate',
                    label: def.categoryLabel || cat,
                    nodes: [],
                };
            }
            categories[cat].nodes.push(nodeType);
        }

        return categories;
    }

    /**
     * Checks if a node type is registered.
     */
    has(nodeType) {
        return this._nodes.has(nodeType);
    }

    /**
     * Returns the count of registered nodes.
     */
    count() {
        return this._nodes.size;
    }

    /**
     * Clears all registrations (for testing).
     */
    clear() {
        this._nodes.clear();
        this._categories.clear();
    }
}

export const nodeRegistry = new NodeRegistry();
export default nodeRegistry;
