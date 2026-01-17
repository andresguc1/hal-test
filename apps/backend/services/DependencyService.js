import { globalStateManager } from './stateManager.js';

class DependencyService {
    /**
     * Recursively resolve all dependencies (components) for a given set of nodes.
     * @param {Array} nodes - The nodes of the main flow.
     * @param {string} projectId - The project ID.
     * @param {boolean} sanitize - Whether to strip secrets.
     * @param {Set} visited - internal set to prevent cycles.
     * @returns {Promise<Array>} - List of component flow objects.
     */
    async resolveDependencies(nodes, projectId, sanitize = true, visited = new Set()) {
        const components = [];

        // Find all component nodes
        const componentNodes = nodes.filter((n) => n.type === 'component');

        for (const node of componentNodes) {
            const flowId = node.data?.flowId;
            if (!flowId) continue;

            if (visited.has(flowId)) continue;
            visited.add(flowId);

            // Fetch the flow definition from State Manager
            const flow = await globalStateManager.getFlow(projectId, flowId);

            if (flow) {
                // Clone to avoid mutating state
                const flowClone = JSON.parse(JSON.stringify(flow));

                // Sanitize secrets in this component (Conditional)
                if (sanitize) {
                    this.sanitizeSecrets(flowClone.nodes);
                }

                components.push(flowClone);

                // RECURSION: Check if this component uses other components
                const subComponents = await this.resolveDependencies(
                    flowClone.nodes,
                    projectId,
                    sanitize,
                    visited,
                );
                components.push(...subComponents);
            }
        }

        return components;
    }

    /**
     * Sanitize nodes by stripping secret values.
     * @param {Array} nodes
     */
    sanitizeSecrets(nodes) {
        if (!nodes) return;

        const SECRET_PATTERNS = [/pass/i, /key/i, /token/i, /secret/i, /auth/i, /pwd/i];

        nodes.forEach((node) => {
            const config = node.data?.configuration;
            if (!config) return;

            Object.keys(config).forEach((key) => {
                // Check if key matches secret pattern
                if (SECRET_PATTERNS.some((p) => p.test(key))) {
                    // Check if value is not empty/null
                    if (config[key] && typeof config[key] === 'string') {
                        // REPLACEMENT POLICY: Empty string + Flag (if we had a metadata field,
                        // but here we just clear it. The Import logic will see empty required fields).
                        // If we want to be explicit, we could set a special value or metadata.
                        // For now, let's just clear values that look like secrets.

                        // NOTE: If the user toggled "Show Password", it's still a secret logically.
                        config[key] = '';
                    }
                }
            });
        });
    }
}

export const dependencyService = new DependencyService();
