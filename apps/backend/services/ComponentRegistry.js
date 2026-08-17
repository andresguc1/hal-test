import { projectStorageService } from './ProjectStorageService.js';

/**
 * ComponentRegistry
 * Manages reusable sub-flow components stored as JSON files.
 * Components are referenced from flows via the "component" node type.
 */
class ComponentRegistry {
    /**
     * Registers a new reusable component.
     * @param {string} projectId
     * @param {object} componentData - { id, name, description, category, inputs, outputs, nodes, edges }
     * @returns {Promise<object>} - The saved component
     */
    async register(projectId, componentData) {
        const componentJson = {
            $schema: 'https://haltest.dev/schemas/component-v1.json',
            id: componentData.id,
            name: componentData.name,
            version: '1.0.0',
            description: componentData.description || '',
            category: componentData.category || 'general',
            author: componentData.author || '',
            inputs: componentData.inputs || [],
            outputs: componentData.outputs || [],
            nodes: componentData.nodes || [],
            edges: componentData.edges || [],
            metadata: {
                tags: componentData.metadata?.tags || [],
                usageCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };

        const relativePath = `components/${componentJson.id}.json`;
        await projectStorageService.writeFile(projectId, relativePath, componentJson);
        await projectStorageService.addFileRef(projectId, 'components', relativePath);

        return componentJson;
    }

    /**
     * Loads a component by ID.
     */
    async get(projectId, componentId) {
        const relativePath = `components/${componentId}.json`;
        return projectStorageService.readFile(projectId, relativePath);
    }

    /**
     * Updates a component (partial update).
     */
    async update(projectId, componentId, updates) {
        const component = await this.get(projectId, componentId);
        const updated = {
            ...component,
            ...updates,
            id: component.id,
            metadata: {
                ...component.metadata,
                ...updates.metadata,
                updatedAt: new Date().toISOString(),
            },
        };

        const relativePath = `components/${componentId}.json`;
        await projectStorageService.writeFile(projectId, relativePath, updated);
        return updated;
    }

    /**
     * Deletes a component.
     */
    async delete(projectId, componentId) {
        const relativePath = `components/${componentId}.json`;
        projectStorageService.deleteFile(projectId, relativePath);
        await projectStorageService.removeFileRef(projectId, 'components', relativePath);
    }

    /**
     * Lists all components, optionally filtered by category.
     */
    async list(projectId, category) {
        const files = projectStorageService.listFiles(projectId, 'components');
        const components = [];

        for (const file of files) {
            try {
                const componentId = file.replace('.json', '');
                const component = await this.get(projectId, componentId);
                if (!category || component.category === category) {
                    components.push(component);
                }
            } catch {
                console.warn(`[ComponentRegistry] Skipping corrupted component: ${file}`);
            }
        }

        return components;
    }

    /**
     * Increments the usage count for a component.
     */
    async trackUsage(projectId, componentId) {
        const component = await this.get(projectId, componentId);
        component.metadata.usageCount = (component.metadata.usageCount || 0) + 1;
        component.metadata.lastUsedAt = new Date().toISOString();
        await this.update(projectId, componentId, { metadata: component.metadata });
    }

    /**
     * Resolves a component reference to its full definition with sub-nodes.
     * Handles both inline (data.subNodes) and file-based (data.configuration.ref) references.
     * @param {string} projectId
     * @param {object} nodeData - The component node's data
     * @returns {Promise<object|null>} - Resolved component with nodes and edges
     */
    async resolve(projectId, nodeData) {
        const config = nodeData?.configuration || {};

        if (config.inline && nodeData.subNodes) {
            return {
                nodes: nodeData.subNodes,
                edges: nodeData.subEdges || [],
                name: nodeData.flowName || 'Inline Component',
            };
        }

        const ref = config.ref;
        if (!ref) return null;

        try {
            const component = await projectStorageService.readFile(projectId, ref);
            return {
                nodes: component.nodes || [],
                edges: component.edges || [],
                name: component.name,
                inputs: component.inputs || [],
                outputs: component.outputs || [],
            };
        } catch (error) {
            console.warn(
                `[ComponentRegistry] Failed to resolve component ref "${ref}": ${error.message}`,
            );
            return null;
        }
    }
}

export const componentRegistry = new ComponentRegistry();
export default componentRegistry;
