export class GraphValidator {
    /**
     * Validates a flow structure against strict quality rules.
     * @param {Object} flow - The flow object containing { nodes: Array, edges: Array }
     * @returns {Object} { valid: boolean, errors: string[] }
     */
    static validate(flow) {
        if (!flow) return { valid: false, errors: ['Flow object is empty'] };

        const nodes = flow.nodes || [];
        const edges = flow.edges || [];
        const errors = [];

        // 1. Uniqueness / Singleton Rules
        const launches = nodes.filter(
            (n) =>
                (n.type === 'launch_browser' || n.data?.type === 'launch_browser') &&
                !n.data?.disabled,
        );
        const closes = nodes.filter(
            (n) =>
                (n.type === 'close_browser' || n.data?.type === 'close_browser') &&
                !n.data?.disabled,
        );

        if (launches.length === 0) {
            errors.push("Missing mandatory 'launch_browser' node.");
        } else if (launches.length > 1) {
            errors.push(
                "More than one 'launch_browser' node detected. Only 1 is allowed per flow.",
            );
        }

        if (closes.length === 0) {
            errors.push("Missing mandatory 'close_browser' node.");
        } else if (closes.length > 1) {
            errors.push("More than one 'close_browser' node detected. Only 1 is allowed per flow.");
        }

        // Index nodes for fast lookup
        const nodeMap = new Map();
        nodes.forEach((n) => nodeMap.set(n.id, n));

        // Build Adjacency List for graph traversal
        const adj = new Map();
        const inDegree = new Map();
        nodes.forEach((n) => {
            adj.set(n.id, []);
            inDegree.set(n.id, 0);
        });

        const edgeErrors = [];
        edges.forEach((e) => {
            const source = nodeMap.get(e.source);
            const target = nodeMap.get(e.target);

            // Skip edges connected to disabled nodes
            if (source?.data?.disabled || target?.data?.disabled) return;

            if (!source) {
                edgeErrors.push(`Edge references invalid source node: ${e.source}`);
                return;
            }
            if (!target) {
                edgeErrors.push(`Edge references invalid target node: ${e.target}`);
                return;
            }
            adj.get(e.source).push(e.target);
            inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
        });

        if (edgeErrors.length > 0) {
            return { valid: false, errors: [...errors, ...edgeErrors] };
        }

        // 2. Connectivity and Path Verification
        if (launches.length === 1) {
            const root = launches[0];
            const visited = new Set();
            const queue = [root.id];

            while (queue.length > 0) {
                const curr = queue.shift();
                if (!visited.has(curr)) {
                    visited.add(curr);
                    const neighbors = adj.get(curr) || [];
                    queue.push(...neighbors);
                }
            }

            const activeNodes = nodes.filter((n) => !n.data?.disabled);
            if (visited.size < activeNodes.length) {
                const unreachableIds = activeNodes
                    .filter((n) => !visited.has(n.nodeId || n.id))
                    .map((n) => n.nodeId || n.id);
                errors.push(
                    `Found unreachable nodes: [${unreachableIds.join(', ')}]. All nodes must be connected to the main flow starting from 'Launch Browser'.`,
                );
            }
        }

        // 3. Structural Sequence and Hierarchy edge rules
        edges.forEach((e) => {
            const sourceNode = nodeMap.get(e.source);
            if (sourceNode && sourceNode.type === 'close_browser') {
                errors.push(
                    "'close_browser' must be the final node node. It cannot have outgoing edges.",
                );
            }
        });

        // 4. Evidence Constraint - REMOVED PER USER REQUEST
        // Screenshots are now optional for standard execution.

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Attempts to auto-repair non-critical violations (e.g. missing close_browser).
     * @param {Object} flow
     * @returns {Object} { fixed: boolean, flow: Object }
     */
    static repair(flow) {
        const { valid } = this.validate(flow);
        if (valid) return { fixed: false, flow };

        const nodes = [...(flow.nodes || [])];
        const edges = [...(flow.edges || [])];

        const launches = nodes.filter((n) => n.type === 'launch_browser');
        const closes = nodes.filter((n) => n.type === 'close_browser');

        // Auto-Fix: Missing close_browser (only if linear style nodes present)
        if (launches.length === 1 && closes.length === 0 && nodes.length > 0) {
            const lastNodeId = `node_auto_close_${Date.now()}`;
            nodes.push({
                id: lastNodeId,
                type: 'close_browser',
                data: { label: 'Close Browser' },
                position: { x: nodes.length * 250, y: 150 },
            });

            // Find sink node (out-degree 0 in the Original graph)
            const outDegree = new Map();
            nodes.forEach((n) => outDegree.set(n.id, 0));
            edges.forEach((e) => outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1));

            let isolatedEndNode = null;
            for (const [nodeId, count] of outDegree.entries()) {
                if (count === 0 && nodeId !== lastNodeId) {
                    isolatedEndNode = nodeId;
                    break;
                }
            }

            if (isolatedEndNode) {
                edges.push({
                    id: `edge_auto_close_${Date.now()}`,
                    source: isolatedEndNode,
                    target: lastNodeId,
                });
            }

            return { fixed: true, flow: { nodes, edges } };
        }

        return { fixed: false, flow };
    }
}
