import { describe, it, expect } from 'vitest';
import { GraphValidator } from '../services/GraphValidator.js';

// =============================================================================
// HELPERS
// =============================================================================
function makeNode(id, type = 'click', opts = {}) {
    return {
        id,
        nodeId: id,
        type,
        data: { label: type, ...opts.data },
        position: { x: 0, y: 0 },
        ...opts,
    };
}

function makeEdge(source, target, opts = {}) {
    return {
        id: `${source}-${target}`,
        edgeId: `${source}-${target}`,
        source,
        target,
        ...opts,
    };
}

// =============================================================================
// VALIDATION RULES
// =============================================================================
describe('GraphValidator - Validation Rules', () => {
    it('should pass a valid flow with launch_browser and close_browser', () => {
        const flow = {
            nodes: [
                makeNode('n1', 'launch_browser'),
                makeNode('n2', 'open_url'),
                makeNode('n3', 'close_browser'),
            ],
            edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')],
        };

        const result = GraphValidator.validate(flow);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should fail when launch_browser is missing', () => {
        const flow = {
            nodes: [makeNode('n1', 'open_url'), makeNode('n2', 'close_browser')],
            edges: [makeEdge('n1', 'n2')],
        };

        const result = GraphValidator.validate(flow);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('launch_browser'))).toBe(true);
    });

    it('should fail when close_browser is missing', () => {
        const flow = {
            nodes: [makeNode('n1', 'launch_browser'), makeNode('n2', 'open_url')],
            edges: [makeEdge('n1', 'n2')],
        };

        const result = GraphValidator.validate(flow);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('close_browser'))).toBe(true);
    });

    it('should fail when there are duplicate launch_browser nodes', () => {
        const flow = {
            nodes: [
                makeNode('n1', 'launch_browser'),
                makeNode('n2', 'launch_browser'),
                makeNode('n3', 'close_browser'),
            ],
            edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')],
        };

        const result = GraphValidator.validate(flow);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('More than one'))).toBe(true);
    });

    it('should fail when close_browser has outgoing edges', () => {
        const flow = {
            nodes: [
                makeNode('n1', 'launch_browser'),
                makeNode('n2', 'close_browser'),
                makeNode('n3', 'click'),
            ],
            edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')],
        };

        const result = GraphValidator.validate(flow);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('final node'))).toBe(true);
    });
});

// =============================================================================
// CONNECTIVITY
// =============================================================================
describe('GraphValidator - Connectivity', () => {
    it('should detect unreachable nodes', () => {
        const flow = {
            nodes: [
                makeNode('n1', 'launch_browser'),
                makeNode('n2', 'open_url'),
                makeNode('n3', 'close_browser'),
                makeNode('n4', 'click'), // Disconnected
            ],
            edges: [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')],
        };

        const result = GraphValidator.validate(flow);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('unreachable'))).toBe(true);
    });

    it('should exclude disabled nodes from unreachable check', () => {
        const flow = {
            nodes: [
                makeNode('n1', 'launch_browser'),
                makeNode('n2', 'close_browser'),
                makeNode('n3', 'click', { data: { disabled: true } }), // Disabled, not connected
            ],
            edges: [makeEdge('n1', 'n2')],
        };

        const result = GraphValidator.validate(flow);
        expect(result.valid).toBe(true);
    });
});

// =============================================================================
// EDGE VALIDATION
// =============================================================================
describe('GraphValidator - Edge Validation', () => {
    it('should fail for edges referencing non-existent source nodes', () => {
        const flow = {
            nodes: [makeNode('n1', 'launch_browser'), makeNode('n2', 'close_browser')],
            edges: [makeEdge('n1', 'n2'), makeEdge('ghost', 'n2')],
        };

        const result = GraphValidator.validate(flow);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('invalid source'))).toBe(true);
    });
});

// =============================================================================
// AUTO-REPAIR
// =============================================================================
describe('GraphValidator - Auto-Repair', () => {
    it('should auto-add close_browser when missing', () => {
        const flow = {
            nodes: [makeNode('n1', 'launch_browser'), makeNode('n2', 'open_url')],
            edges: [makeEdge('n1', 'n2')],
        };

        const result = GraphValidator.repair(flow);
        expect(result.fixed).toBe(true);

        const closeNode = result.flow.nodes.find((n) => n.type === 'close_browser');
        expect(closeNode).toBeDefined();

        // Should have added an edge from the last node to close_browser
        const closeEdge = result.flow.edges.find((e) => e.target === closeNode.id);
        expect(closeEdge).toBeDefined();
    });

    it('should not modify an already valid flow', () => {
        const flow = {
            nodes: [makeNode('n1', 'launch_browser'), makeNode('n2', 'close_browser')],
            edges: [makeEdge('n1', 'n2')],
        };

        const result = GraphValidator.repair(flow);
        expect(result.fixed).toBe(false);
    });
});

// =============================================================================
// NULL / EMPTY INPUT
// =============================================================================
describe('GraphValidator - Null/Empty Input', () => {
    it('should handle null flow gracefully', () => {
        const result = GraphValidator.validate(null);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty flow object', () => {
        const result = GraphValidator.validate({});
        expect(result.valid).toBe(false);
    });
});
