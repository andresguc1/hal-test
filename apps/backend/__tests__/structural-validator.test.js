import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../core/NodeRegistry.js', () => ({
    nodeRegistry: {
        getAllTypes: vi.fn(() => ['launch_browser', 'click_element', 'fill_form', 'extract_data']),
    },
}));

const { default: structuralValidator } = await import('../core/validators/StructuralValidator.js');

function makeFlow(nodes = [], edges = []) {
    return { nodes, edges };
}

function launchNode(id = 'n1', opts = {}) {
    return { id, type: 'launch_browser', data: {}, ...opts };
}

function regularNode(id, type = 'click_element', opts = {}) {
    return { id, type, data: {}, ...opts };
}

describe('StructuralValidator', () => {
    beforeEach(() => {
        structuralValidator.removeRule('custom_check');
    });

    it('should pass a valid flow with launch_browser, edges, and no issues', async () => {
        const flow = makeFlow(
            [launchNode('n1'), regularNode('n2')],
            [{ source: 'n1', target: 'n2' }],
        );

        const result = await structuralValidator.validate(flow);

        expect(result.passed).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.validator).toBe('structural');
    });

    it('should error when flow is null', async () => {
        const result = await structuralValidator.validate(null);

        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ rule: 'empty_flow', message: 'Flow is empty' }),
            ]),
        );
    });

    it('should error when flow is undefined', async () => {
        const result = await structuralValidator.validate(undefined);

        expect(result.passed).toBe(false);
        expect(result.errors[0].rule).toBe('empty_flow');
    });

    it('should error when flow has no nodes', async () => {
        const result = await structuralValidator.validate(makeFlow([], []));

        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ rule: 'no_nodes', message: 'Flow has no nodes' }),
            ]),
        );
    });

    it('should error when flow has no launch_browser node', async () => {
        const flow = makeFlow(
            [regularNode('n1'), regularNode('n2')],
            [{ source: 'n1', target: 'n2' }],
        );

        const result = await structuralValidator.validate(flow);

        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    rule: 'must_have_launch_browser',
                    message: 'Flow must contain a launch_browser node',
                }),
            ]),
        );
    });

    it('should error when flow has multiple launch_browser nodes', async () => {
        const flow = makeFlow(
            [launchNode('n1'), launchNode('n2')],
            [{ source: 'n1', target: 'n2' }],
        );

        const result = await structuralValidator.validate(flow);

        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    rule: 'must_have_launch_browser',
                    message: 'Flow must have only one launch_browser node',
                }),
            ]),
        );
    });

    it('should error when all launch_browser nodes are disabled', async () => {
        const flow = makeFlow([launchNode('n1', { data: { disabled: true } })], []);

        const result = await structuralValidator.validate(flow);

        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([expect.objectContaining({ rule: 'must_have_launch_browser' })]),
        );
    });

    it('should error when edge references a non-existent node (orphan edge)', async () => {
        const flow = makeFlow([launchNode('n1')], [{ source: 'n1', target: 'nonexistent' }]);

        const result = await structuralValidator.validate(flow);

        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    rule: 'no_orphan_edges',
                    message: expect.stringContaining('edge(s) reference non-existent nodes'),
                }),
            ]),
        );
    });

    it('should error when an edge is a self-loop', async () => {
        const flow = makeFlow(
            [launchNode('n1'), regularNode('n2')],
            [
                { source: 'n1', target: 'n2' },
                { source: 'n2', target: 'n2' },
            ],
        );

        const result = await structuralValidator.validate(flow);

        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    rule: 'no_self_loops',
                    message: 'Flow contains self-loop edges',
                }),
            ]),
        );
    });

    it('should warn when a node is unreachable (disconnected graph)', async () => {
        const flow = makeFlow(
            [launchNode('n1'), regularNode('n2'), regularNode('n3')],
            [{ source: 'n1', target: 'n2' }],
        );

        const result = await structuralValidator.validate(flow);

        expect(result.passed).toBe(true);
        expect(result.warnings).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    rule: 'connected_graph',
                    message: expect.stringContaining('unreachable from the start'),
                }),
            ]),
        );
    });

    it('should error when duplicate node IDs exist', async () => {
        const flow = makeFlow(
            [launchNode('n1'), { id: 'n1', type: 'click_element', data: {} }],
            [],
        );

        const result = await structuralValidator.validate(flow);

        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    rule: 'unique_node_ids',
                    message: 'Flow contains duplicate node IDs',
                }),
            ]),
        );
    });

    it('should support addRule and removeRule for custom validation', async () => {
        structuralValidator.addRule(
            'custom_check',
            (nodes) => {
                if (nodes.length > 3) {
                    return { errors: [{ message: 'Too many nodes' }] };
                }
                return {};
            },
            'Max 3 nodes',
        );

        const flow = makeFlow(
            [launchNode('n1'), regularNode('n2'), regularNode('n3'), regularNode('n4')],
            [],
        );

        let result = await structuralValidator.validate(flow);
        expect(result.passed).toBe(false);
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ rule: 'custom_check', message: 'Too many nodes' }),
            ]),
        );

        structuralValidator.removeRule('custom_check');

        result = await structuralValidator.validate(flow);
        const customErrors = result.errors.filter((e) => e.rule === 'custom_check');
        expect(customErrors).toHaveLength(0);
    });
});
