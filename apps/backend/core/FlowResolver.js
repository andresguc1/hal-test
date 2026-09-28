import { Flow, Node, Edge } from '../database/init.js';
import { projectStorageService } from '../services/ProjectStorageService.js';
import { componentRegistry } from '../services/ComponentRegistry.js';

const MAX_DEPTH = 10;

const CONTAINER_TYPES = ['component', 'loop', 'for_each'];

/**
 * FlowResolver
 * Resolves sub-flows (component, loop, for_each nodes) recursively.
 * Replaces the ad-hoc resolveSubFlows in exporter/index.js.
 * Supports both disk-based (ref) and inline component resolution.
 */
class FlowResolver {
    /**
     * Recursively resolves all container nodes in a flow, populating subNodes.
     *
     * Reuse (F1): the same flowRef used by several sibling containers resolves
     * EVERY instance (shared cache per call, branch-local pathStack).  Failures
     * are annotated on the node as `{ status: 'unresolved', reason }` so the
     * generators can emit a structured warning instead of an empty block.
     * @param {Array} nodes - Array of node objects
     * @param {string} projectId - Project ID for resolving refs
     * @param {number} depth - Current recursion depth (for cycle detection)
     * @param {Set} pathStack - Branch path (cycle detection, per branch)
     * @param {Map} cache - Loaded sub-flows shared across the whole resolution
     * @returns {Promise<Array>} - Nodes with subNodes populated
     */
    async resolve(nodes, projectId, depth = 0, pathStack = new Set(), cache = new Map()) {
        if (!nodes || !Array.isArray(nodes)) return [];
        if (depth > MAX_DEPTH) {
            console.warn(
                `[FlowResolver] Max depth (${MAX_DEPTH}) exceeded. Possible circular reference.`,
            );
            return nodes;
        }

        const resolvedNodes = [];

        for (const node of nodes) {
            const resolved = { ...node };
            const type = node.type || node.data?.type;

            if (CONTAINER_TYPES.includes(type)) {
                const flowRef =
                    node.data?.configuration?.flowId ||
                    node.data?.configuration?.ref ||
                    node.data?.flowId;

                const nodeId = node.id || node.nodeId || '?';
                const inlineCount = node.data?.subNodes?.length || 0;

                if (!flowRef) {
                    console.warn(
                        `[FlowResolver] Container node ${nodeId} (type: ${type}) has no flowId/ref. ` +
                            `${inlineCount > 0 ? `Using ${inlineCount} inline subNode(s).` : 'No subNodes — component will generate as empty.'}`,
                    );
                } else if (pathStack.has(flowRef)) {
                    console.warn(
                        `[FlowResolver] Circular reference detected for sub-flow "${flowRef}" at container node ${nodeId}.`,
                    );
                    if (inlineCount === 0) {
                        resolved.data = {
                            ...resolved.data,
                            flowResolution: { status: 'unresolved', reason: 'cycle_detected' },
                        };
                    }
                } else {
                    let subFlow = cache.get(flowRef);
                    if (subFlow === undefined) {
                        subFlow = await this._loadSubFlow(flowRef, projectId);
                        cache.set(flowRef, subFlow);
                    }

                    if (subFlow) {
                        pathStack.add(flowRef);
                        resolved.data = {
                            ...resolved.data,
                            flowName: subFlow.name || subFlow.flowName || 'Component',
                            subNodes: await this.resolve(
                                subFlow.nodes,
                                projectId,
                                depth + 1,
                                pathStack,
                                cache,
                            ),
                            subEdges: subFlow.edges || [],
                        };
                        pathStack.delete(flowRef);
                    } else {
                        console.warn(
                            `[FlowResolver] Could not resolve sub-flow "${flowRef}" for container node ${nodeId} (project: ${projectId}). ` +
                                `${inlineCount > 0 ? `Preserving ${inlineCount} inline subNode(s).` : 'No inline subNodes available — component will generate as empty.'}`,
                        );
                        if (inlineCount === 0) {
                            resolved.data = {
                                ...resolved.data,
                                flowResolution: {
                                    status: 'unresolved',
                                    reason: 'flow_not_found',
                                },
                            };
                        }
                    }
                }
            }

            // Also resolve nested sub-nodes (already resolved components)
            if (resolved.data?.subNodes?.length > 0) {
                resolved.data.subNodes = await this.resolve(
                    resolved.data.subNodes,
                    projectId,
                    depth + 1,
                    pathStack,
                    cache,
                );
            }

            resolvedNodes.push(resolved);
        }

        return resolvedNodes;
    }

    /**
     * Resolves a sub-flow from disk or component registry.
     * Tries disk first, then falls back to component registry.
     */
    async _loadSubFlow(flowRef, projectId) {
        if (!projectId) return null;

        // Strategy 1: Try as a disk file reference (e.g., "components/navbar.json")
        if (flowRef.endsWith('.json')) {
            try {
                const data = await projectStorageService.readFile(projectId, flowRef);
                return {
                    name: data.name,
                    nodes: data.nodes || [],
                    edges: data.edges || [],
                };
            } catch {
                // Fall through to Strategy 2
            }
        }

        // Strategy 2: Try as a flow ID from the database
        try {
            const flow = await Flow.findOne({
                where: { id: flowRef, projectId },
                include: [
                    { model: Node, as: 'nodes', order: [['order', 'ASC']] },
                    { model: Edge, as: 'edges' },
                ],
            });

            if (flow) {
                const flowObj = flow.toJSON();
                return {
                    name: flowObj.name,
                    nodes: (flowObj.nodes || []).map((n) => ({
                        id: n.nodeId || n.id,
                        type: n.type,
                        data: n.data,
                        position: n.position,
                    })),
                    edges: (flowObj.edges || []).map((e) => ({
                        id: e.edgeId || e.id,
                        source: e.source,
                        target: e.target,
                        sourceHandle: e.sourceHandle,
                        targetHandle: e.targetHandle,
                    })),
                };
            }
        } catch {
            // Fall through to Strategy 3
        }

        // Strategy 3: Try as a component ID from the registry
        try {
            const component = await componentRegistry.resolve(projectId, {
                configuration: { ref: `components/${flowRef}.json` },
            });

            if (component) {
                return {
                    name: component.name,
                    nodes: component.nodes,
                    edges: component.edges,
                };
            }
        } catch {
            // Give up
        }

        console.warn(
            `[FlowResolver] Could not resolve sub-flow "${flowRef}" in project ${projectId}`,
        );
        return null;
    }

    /**
     * Lists all components referenced by a flow (without resolving them).
     * Useful for dependency analysis.
     */
    listDependencies(nodes) {
        const deps = [];
        if (!nodes) return deps;

        for (const node of nodes) {
            const type = node.type || node.data?.type;
            if (CONTAINER_TYPES.includes(type)) {
                const ref =
                    node.data?.configuration?.flowId ||
                    node.data?.configuration?.ref ||
                    node.data?.flowId;
                if (ref) {
                    deps.push({
                        nodeId: node.id,
                        ref,
                        type,
                    });
                }
            }

            if (node.data?.subNodes) {
                deps.push(...this.listDependencies(node.data.subNodes));
            }
        }

        return deps;
    }

    /**
     * Detects circular references in component dependencies.
     * @param {Array} nodes
     * @param {string} projectId
     * @returns {Promise<{hasCycle: boolean, cyclePath: string[]}>}
     */
    async detectCycles(nodes, projectId) {
        const visited = new Set();
        const stack = new Set();

        const dfs = async (nodeId, nodesList) => {
            if (stack.has(nodeId)) {
                return { hasCycle: true, cyclePath: [nodeId] };
            }
            if (visited.has(nodeId)) {
                return { hasCycle: false, cyclePath: [] };
            }

            visited.add(nodeId);
            stack.add(nodeId);

            const node = nodesList.find((n) => n.id === nodeId);
            if (node) {
                const type = node.type || node.data?.type;
                if (CONTAINER_TYPES.includes(type)) {
                    const ref = node.data?.configuration?.flowId || node.data?.configuration?.ref;
                    if (ref) {
                        const subFlow = await this._loadSubFlow(ref, projectId);
                        if (subFlow?.nodes) {
                            for (const subNode of subFlow.nodes) {
                                const result = await dfs(subNode.id, subFlow.nodes);
                                if (result.hasCycle) {
                                    return {
                                        hasCycle: true,
                                        cyclePath: [nodeId, ...result.cyclePath],
                                    };
                                }
                            }
                        }
                    }
                }

                if (node.data?.subNodes) {
                    for (const subNode of node.data.subNodes) {
                        const result = await dfs(subNode.id, node.data.subNodes);
                        if (result.hasCycle) {
                            return {
                                hasCycle: true,
                                cyclePath: [nodeId, ...result.cyclePath],
                            };
                        }
                    }
                }
            }

            stack.delete(nodeId);
            return { hasCycle: false, cyclePath: [] };
        };

        for (const node of nodes) {
            const result = await dfs(node.id, nodes);
            if (result.hasCycle) return result;
        }

        return { hasCycle: false, cyclePath: [] };
    }
}

export const flowResolver = new FlowResolver();
export default flowResolver;
