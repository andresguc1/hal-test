import Joi from 'joi';
import { nodeRegistry } from '../../core/NodeRegistry.js';

/**
 * StructuralValidator
 * Layer 1 of the Safety Gate pipeline.
 * Validates flow structure against JSON schema rules and node type contracts.
 */
class StructuralValidator {
    constructor() {
        this._rules = new Map();
        this._registerBuiltinRules();
    }

    /**
     * Validates a flow structurally.
     * @param {object} flow - { nodes: Array, edges: Array }
     * @returns {Promise<ValidationResult>}
     */
    async validate(flow) {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];

        if (!flow) {
            return this._result(
                false,
                [{ rule: 'empty_flow', message: 'Flow is empty' }],
                [],
                startTime,
            );
        }

        const nodes = flow.nodes || [];
        const edges = flow.edges || [];

        if (nodes.length === 0) {
            return this._result(
                false,
                [{ rule: 'no_nodes', message: 'Flow has no nodes' }],
                [],
                startTime,
            );
        }

        // Run all registered rules
        for (const [ruleId, rule] of this._rules) {
            const result = rule.fn(nodes, edges, flow);
            if (result.errors) {
                errors.push(...result.errors.map((e) => ({ rule: ruleId, ...e })));
            }
            if (result.warnings) {
                warnings.push(...result.warnings.map((w) => ({ rule: ruleId, ...w })));
            }
        }

        return this._result(errors.length === 0, errors, warnings, startTime);
    }

    /**
     * Registers a custom structural validation rule.
     */
    addRule(ruleId, fn, description) {
        this._rules.set(ruleId, { fn, description });
    }

    /**
     * Removes a validation rule.
     */
    removeRule(ruleId) {
        this._rules.delete(ruleId);
    }

    // ── Built-in Rules ────────────────────────────────────────

    _registerBuiltinRules() {
        // Rule: Must have launch_browser
        this.addRule(
            'must_have_launch_browser',
            (nodes) => {
                const launches = nodes.filter(
                    (n) => (n.type || n.data?.type) === 'launch_browser' && !n.data?.disabled,
                );
                if (launches.length === 0) {
                    return { errors: [{ message: 'Flow must contain a launch_browser node' }] };
                }
                if (launches.length > 1) {
                    return { errors: [{ message: 'Flow must have only one launch_browser node' }] };
                }
                return {};
            },
            'Flow must have exactly one launch_browser node',
        );

        // Rule: No orphan edges
        this.addRule(
            'no_orphan_edges',
            (nodes, edges) => {
                const nodeIds = new Set(nodes.map((n) => n.id));
                const orphans = edges.filter(
                    (e) => !nodeIds.has(e.source) || !nodeIds.has(e.target),
                );
                if (orphans.length > 0) {
                    return {
                        errors: [
                            {
                                message: `${orphans.length} edge(s) reference non-existent nodes`,
                                details: orphans.map((o) => `${o.source} -> ${o.target}`),
                            },
                        ],
                    };
                }
                return {};
            },
            'All edges must reference existing nodes',
        );

        // Rule: No self-loops
        this.addRule(
            'no_self_loops',
            (nodes, edges) => {
                const selfLoops = edges.filter((e) => e.source === e.target);
                if (selfLoops.length > 0) {
                    return {
                        errors: [
                            {
                                message: 'Flow contains self-loop edges',
                                details: selfLoops.map((e) => `Node ${e.source} loops to itself`),
                            },
                        ],
                    };
                }
                return {};
            },
            'No node should loop to itself',
        );

        // Rule: Graph connectivity
        this.addRule(
            'connected_graph',
            (nodes, edges) => {
                const activeNodes = nodes.filter((n) => !n.data?.disabled);
                if (activeNodes.length <= 1) return {};

                const adj = new Map();
                activeNodes.forEach((n) => adj.set(n.id, []));
                edges.forEach((e) => {
                    if (adj.has(e.source)) adj.get(e.source).push(e.target);
                    if (adj.has(e.target)) adj.get(e.target).push(e.source);
                });

                const visited = new Set();
                const queue = [activeNodes[0].id];
                visited.add(activeNodes[0].id);

                while (queue.length > 0) {
                    const current = queue.shift();
                    for (const neighbor of adj.get(current) || []) {
                        if (!visited.has(neighbor)) {
                            visited.add(neighbor);
                            queue.push(neighbor);
                        }
                    }
                }

                if (visited.size < activeNodes.length) {
                    const unreachable = activeNodes
                        .filter((n) => !visited.has(n.id))
                        .map((n) => n.id);
                    return {
                        warnings: [
                            {
                                message: `${unreachable.length} node(s) are unreachable from the start`,
                                details: unreachable,
                            },
                        ],
                    };
                }
                return {};
            },
            'All nodes should be reachable from the start',
        );

        // Rule: No duplicate node IDs
        this.addRule(
            'unique_node_ids',
            (nodes) => {
                const ids = new Set();
                const duplicates = [];
                for (const n of nodes) {
                    if (ids.has(n.id)) duplicates.push(n.id);
                    ids.add(n.id);
                }
                if (duplicates.length > 0) {
                    return {
                        errors: [
                            {
                                message: 'Flow contains duplicate node IDs',
                                details: duplicates,
                            },
                        ],
                    };
                }
                return {};
            },
            'All node IDs must be unique',
        );

        // Rule: Unknown node types
        this.addRule(
            'known_node_types',
            (nodes) => {
                const knownTypes = new Set([
                    ...nodeRegistry.getAllTypes(),
                    'sticky_note',
                    'discussion',
                ]);
                const unknown = nodes.filter((n) => !knownTypes.has(n.type) && !n.data?.disabled);
                if (unknown.length > 0) {
                    return {
                        warnings: [
                            {
                                message: `${unknown.length} node(s) have unrecognized types`,
                                details: unknown.map((n) => `${n.id}: ${n.type}`),
                            },
                        ],
                    };
                }
                return {};
            },
            'All node types should be recognized',
        );
    }

    // ── Helpers ───────────────────────────────────────────────

    _result(passed, errors, warnings, startTime) {
        return {
            validator: 'structural',
            passed,
            errors,
            warnings,
            duration: Date.now() - startTime,
        };
    }
}

export const structuralValidator = new StructuralValidator();
export default structuralValidator;
