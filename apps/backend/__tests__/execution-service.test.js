import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock socket.js
vi.mock('../socket.js', () => ({
    emitExecutionStatus: vi.fn(),
    emitLog: vi.fn(),
    emitScreenshotReady: vi.fn(),
    emitVariableChange: vi.fn(),
    emitEdgeStatus: vi.fn(),
    emitFlowFinished: vi.fn(),
}));

// Mock i18n
vi.mock('../config/i18n.js', () => ({
    default: { t: (key) => key },
}));

// Mock database models (avoid real DB dependency)
vi.mock('../database/init.js', () => ({
    Flow: { findOne: vi.fn(), findByPk: vi.fn() },
    Node: {},
    Edge: {},
    Run: { findByPk: vi.fn() },
    StepResult: {},
}));

// Mock ExecutionLogger
vi.mock('../services/ExecutionLogger.js', () => ({
    executionLogger: {
        startRun: vi.fn().mockResolvedValue('mock-run-id'),
        endRun: vi.fn().mockResolvedValue(true),
        logStep: vi.fn().mockResolvedValue(true),
        deleteRun: vi.fn().mockResolvedValue(true),
        clearHistory: vi.fn().mockResolvedValue(true),
    },
}));

// Mock browser.service
vi.mock('../services/browser.service.js', () => ({
    browserService: {
        delete: vi.fn().mockResolvedValue(true),
        get: vi.fn(),
        launchBrowser: vi.fn(),
    },
}));

// Mock SecurityComplianceEngine to avoid DB model imports in unit tests
vi.mock('../services/SecurityComplianceEngine.js', () => ({
    SecurityComplianceEngine: {
        runComplianceAudit: vi.fn().mockResolvedValue({ score: 100, findings: [] }),
    },
}));

import { variableManager } from '../services/VariableManager.js';
import { emitEdgeStatus } from '../socket.js';
import { browserService } from '../services/browser.service.js';
import { ExecutionService } from '../services/ExecutionService.js';

// =============================================================================
// HELPERS
// =============================================================================
function makeNode(nodeId, type, data = {}) {
    return {
        nodeId,
        type,
        data: { label: type, ...data },
        parentId: null,
        position: { x: 0, y: 0 },
    };
}

function makeEdge(source, target, sourceHandle = null) {
    return {
        edgeId: `${source}-${target}`,
        id: `${source}-${target}`,
        source,
        target,
        sourceHandle,
    };
}

// =============================================================================
// We'll test the ExecutionService.runSequence and related methods directly
// by importing and mocking handlers
// =============================================================================
describe('ExecutionService - Graph Traversal & DPE', () => {
    let ExecutionService;

    beforeEach(async () => {
        variableManager.clearAll();

        // Dynamic import to get fresh instance after mocks
        const mod = await import('../services/ExecutionService.js');
        ExecutionService = mod.executionService;
    }, 30000);

    it('should execute nodes in topological order (BFS - no incoming edges first)', async () => {
        const executionOrder = [];

        // Create a mock handler that tracks execution order
        const originalExecuteNode = ExecutionService.executeNode;

        ExecutionService.executeNode = vi.fn().mockImplementation(async (node) => {
            executionOrder.push(node.nodeId);
            return { success: true, data: { status: 'success' } };
        });

        const nodes = [
            makeNode('n1', 'open_url'),
            makeNode('n2', 'click'),
            makeNode('n3', 'close_browser'),
        ];
        const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')];

        const state = {
            runId: 'test-run',
            browserId: null,
            variables: {},
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(['n1']),
            nodeStates: {},
            edgeStates: {},
            overrides: {},
            headers: {},
            startTime: Date.now(),
        };

        variableManager.initRun('test-run');

        await ExecutionService.runSequence([nodes[0]], nodes, edges, state);

        expect(executionOrder).toEqual(['n1', 'n2', 'n3']);

        // Restore
        ExecutionService.executeNode = originalExecuteNode;
    });

    it('should skip disabled nodes', async () => {
        const executionOrder = [];

        const originalExecuteNode = ExecutionService.executeNode;
        ExecutionService.executeNode = vi.fn().mockImplementation(async (node) => {
            executionOrder.push(node.nodeId);
            return { success: true, data: { status: 'success' } };
        });

        const nodes = [
            makeNode('n1', 'open_url'),
            makeNode('n2', 'click', { disabled: true }), // DISABLED
            makeNode('n3', 'close_browser'),
        ];
        const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3')];

        const state = {
            runId: 'test-run',
            browserId: null,
            variables: {},
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(['n1']),
            nodeStates: {},
            edgeStates: {},
            overrides: {},
            headers: {},
            startTime: Date.now(),
        };

        variableManager.initRun('test-run');

        await ExecutionService.runSequence([nodes[0]], nodes, edges, state);

        // n2 was disabled, so it should be skipped
        expect(executionOrder).not.toContain('n2');

        ExecutionService.executeNode = originalExecuteNode;
    });

    it('should perform Dead Path Elimination (DPE) on non-winner edges', () => {
        const nodes = [
            makeNode('n1', 'conditional'),
            makeNode('n2', 'click'), // true path
            makeNode('n3', 'click'), // false path (dead)
        ];
        const edges = [makeEdge('n1', 'n2', 'true'), makeEdge('n1', 'n3', 'false')];

        const state = {
            runId: 'test-run',
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(['n1']),
            nodeStates: {},
            edgeStates: {},
        };

        variableManager.initRun('test-run');

        // Simulate DPE: kill the "false" edge
        ExecutionService.propagateSkip('n1-n3', nodes, edges, state);

        // The false edge should be marked as skipped
        expect(state.edgeStates['n1-n3']).toBe('skipped');
        expect(emitEdgeStatus).toHaveBeenCalledWith({ edgeId: 'n1-n3', status: 'skipped' });

        // The target node (n3) should be marked as executed (preventing future execution)
        expect(state.executedNodeIds.has('n3')).toBe(true);
    });

    it('should not skip a node if it has other active incoming edges', () => {
        const nodes = [
            makeNode('n1', 'conditional'),
            makeNode('n2', 'action'),
            makeNode('n3', 'merge'), // Has TWO incoming edges
        ];
        const edges = [makeEdge('n1', 'n3', 'true'), makeEdge('n2', 'n3')];

        const state = {
            runId: 'test-run',
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(['n1']),
            nodeStates: {},
            edgeStates: {},
        };

        variableManager.initRun('test-run');

        // Skip only one of the two edges to n3
        ExecutionService.propagateSkip('n1-n3', nodes, edges, state);

        // n3 should NOT be skipped because edge n2-n3 is still active
        expect(state.executedNodeIds.has('n3')).toBe(false);
    });

    it('SHORT-CIRCUIT: a decision node with no winner path must not broadcast all branches', async () => {
        // A switch/conditional that fails to report a winnerPath must converge
        // on exactly one path (the fallback) — never activate every branch,
        // which would execute non-selected branches.
        const executionOrder = [];
        const originalExecuteNode = ExecutionService.executeNode;
        ExecutionService.executeNode = vi.fn().mockImplementation(async (node) => {
            executionOrder.push(node.nodeId);
            // Deliberately omits `path` to simulate a decision node that
            // could not resolve a winner.
            return { success: true };
        });

        const nodes = [
            makeNode('n1', 'switch'),
            makeNode('n2', 'click'), // case A
            makeNode('n3', 'click'), // case B
            makeNode('n4', 'click'), // default (fallback)
        ];
        const edges = [
            makeEdge('n1', 'n2', 'caseA'),
            makeEdge('n1', 'n3', 'caseB'),
            makeEdge('n1', 'n4', 'default'),
        ];

        const state = {
            runId: 'test-run',
            browserId: null,
            variables: {},
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(['n1']),
            nodeStates: {},
            edgeStates: {},
            overrides: {},
            headers: {},
            startTime: Date.now(),
        };
        variableManager.initRun('test-run');

        await ExecutionService.runSequence([nodes[0]], nodes, edges, state);

        // Only the fallback branch ('default') should be executed — never the
        // non-selected cases (caseA/caseB). `executionOrder` reflects the
        // nodes the executor actually ran; non-selected branches are merely
        // marked as skipped (never invoked).
        expect(executionOrder).toEqual(['n1', 'n4']);
        expect(executionOrder).not.toContain('n2');
        expect(executionOrder).not.toContain('n3');
        // Non-selected branches are explicitly skipped, not activated.
        expect(state.edgeStates['n1-n2']).toBe('skipped');
        expect(state.edgeStates['n1-n3']).toBe('skipped');
        expect(state.activatedNodeIds.has('n4')).toBe(true);

        ExecutionService.executeNode = originalExecuteNode;
    });

    it('should store node results in VariableManager after execution', async () => {
        const originalExecuteNode = ExecutionService.executeNode;
        ExecutionService.executeNode = vi.fn().mockImplementation(async (_node) => {
            return {
                success: true,
                data: { url: 'https://example.com', title: 'Example' },
            };
        });

        const nodes = [makeNode('n1', 'open_url', { label: 'Open URL' })];
        const edges = [];

        const state = {
            runId: 'test-run',
            browserId: null,
            variables: {},
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(['n1']),
            nodeStates: {},
            edgeStates: {},
            overrides: {},
            headers: {},
            startTime: Date.now(),
        };

        variableManager.initRun('test-run');

        await ExecutionService.runSequence(nodes, nodes, edges, state);

        // Verify the result was stored
        const result = variableManager.get('Open URL.result', 'test-run');
        expect(result).toBeDefined();

        ExecutionService.executeNode = originalExecuteNode;
    });

    it('should activate downstream nodes via edge success signals', async () => {
        const originalExecuteNode = ExecutionService.executeNode;
        ExecutionService.executeNode = vi.fn().mockImplementation(async (_node) => {
            return { success: true, data: { status: 'success' } };
        });

        const nodes = [makeNode('n1', 'open_url'), makeNode('n2', 'click')];
        const edges = [makeEdge('n1', 'n2')];

        const state = {
            runId: 'test-run',
            browserId: null,
            variables: {},
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(['n1']), // Only n1 is initially activated
            nodeStates: {},
            edgeStates: {},
            overrides: {},
            headers: {},
            startTime: Date.now(),
        };

        variableManager.initRun('test-run');

        await ExecutionService.runSequence([nodes[0]], nodes, edges, state);

        // n2 should have been activated by the successful execution of n1
        expect(state.activatedNodeIds.has('n2')).toBe(true);
        // Both nodes should have been executed
        expect(state.executedNodeIds.has('n1')).toBe(true);
        expect(state.executedNodeIds.has('n2')).toBe(true);

        ExecutionService.executeNode = originalExecuteNode;
    });

    it('should capture live-state package during runSequence execution and register it in variableManager', async () => {
        // Mock browserService.get to return a mock browser page
        const mockPage = {
            url: () => 'https://live-state.test',
            isClosed: () => false,
        };
        const mockBrowser = {
            contexts: () => [
                {
                    pages: () => [mockPage],
                },
            ],
        };
        const originalBrowserGet = browserService.get;
        browserService.get = vi.fn().mockReturnValue({ browser: mockBrowser });

        const originalExecuteNode = ExecutionService.executeNode;
        ExecutionService.executeNode = vi.fn().mockImplementation(async (_node) => {
            return { success: true };
        });

        const nodes = [makeNode('n1', 'open_url')];
        const edges = [];

        const state = {
            runId: 'live-state-run',
            browserId: 'mock-browser-id',
            variables: {},
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(['n1']),
            nodeStates: {},
            edgeStates: {},
            overrides: {},
            headers: {},
            startTime: Date.now(),
        };

        variableManager.initRun('live-state-run');
        variableManager.set('testVar', 'testValue', 'live-state-run');

        await ExecutionService.runSequence(nodes, nodes, edges, state);

        // Verify state has liveState package
        expect(state.liveState).toBeDefined();
        expect(state.liveState.nodeId).toBe('n1');
        expect(state.liveState.url).toBe('https://live-state.test');
        expect(state.liveState.variables.testVar).toBe('testValue');

        // Verify variableManager got the variables stored under liveState / live_state
        const liveStateFromVM = variableManager.get('liveState', 'live-state-run');
        expect(liveStateFromVM).toBeDefined();
        expect(liveStateFromVM.url).toBe('https://live-state.test');
        expect(liveStateFromVM.variables.testVar).toBe('testValue');

        // Restore mocks
        browserService.get = originalBrowserGet;
        ExecutionService.executeNode = originalExecuteNode;
    });

    describe('validateGraph - Node Configuration Validation & Defaults Injection', () => {
        it('should validate click node configuration, fill missing default button, and not throw', async () => {
            const clickNode = makeNode('n_click', 'click', {
                configuration: {
                    selector: '#submit-btn',
                },
            });

            await expect(ExecutionService.validateGraph([clickNode], [])).resolves.not.toThrow();
            expect(clickNode.data.configuration.button).toBe('left');
        });

        it('should throw Configuration Error if click node lacks a required selector', async () => {
            const clickNode = makeNode('n_click', 'click', {
                configuration: {
                    button: 'left',
                },
            });

            await expect(ExecutionService.validateGraph([clickNode], [])).rejects.toThrow(
                /Configuration Error in node "click": El selector del elemento es obligatorio/,
            );
        });

        it('should throw Configuration Error if click node has an invalid button value', async () => {
            const clickNode = makeNode('n_click', 'click', {
                configuration: {
                    selector: '#submit-btn',
                    button: 'invalid-button',
                },
            });

            await expect(ExecutionService.validateGraph([clickNode], [])).rejects.toThrow(
                /Configuration Error in node "click": El botón debe ser/,
            );
        });
    });

    // =========================================================================
    // Task 1: Engine dispatcher — action-name overrides for go_back and friends
    // =========================================================================
    describe('getHandlerName — action-name overrides (engine dispatcher)', () => {
        it('should map go_back to backAction (barrel export override)', () => {
            expect(ExecutionService.getHandlerName('go_back')).toBe('backAction');
        });

        it('should map go_forward to forwardAction', () => {
            expect(ExecutionService.getHandlerName('go_forward')).toBe('forwardAction');
        });

        it('should map reload_page to reloadAction', () => {
            expect(ExecutionService.getHandlerName('reload_page')).toBe('reloadAction');
        });

        it('should keep convention-based names working', () => {
            expect(ExecutionService.getHandlerName('click')).toBe('clickAction');
            expect(ExecutionService.getHandlerName('launch_browser')).toBe('launchBrowserAction');
            expect(ExecutionService.getHandlerName('open_url')).toBe('openUrlAction');
            expect(ExecutionService.getHandlerName('custom_eval')).toBe('customEvalAction');
        });
    });

    // =========================================================================
    // Task 3: Deterministic traversal for grouped/composite sub-flows
    // =========================================================================
    describe('topologicalSortNodes & sortTopological execution', () => {
        it('should return nodes in dependency order regardless of input array order', () => {
            // De-ordered array on purpose: a->b->c and b->d
            const nodes = [
                makeNode('c', 'click'),
                makeNode('a', 'open_url'),
                makeNode('b', 'click'),
                makeNode('d', 'close_browser'),
            ];
            const edges = [makeEdge('a', 'b'), makeEdge('b', 'c'), makeEdge('b', 'd')];

            const sorted = ExecutionService.topologicalSortNodes(nodes, edges);
            const ids = sorted.map((n) => n.nodeId);

            expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'));
            expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('c'));
            expect(ids.indexOf('b')).toBeLessThan(ids.indexOf('d'));
        });

        it('should preserve original relative order for cyclic leftovers', () => {
            const nodes = [makeNode('x', 'click'), makeNode('y', 'click')];
            const edges = [makeEdge('y', 'x'), makeEdge('x', 'y')]; // pure cycle

            const sorted = ExecutionService.topologicalSortNodes(nodes, edges);
            expect(sorted.map((n) => n.nodeId)).toEqual(['x', 'y']);
        });

        it('runSequence should execute peers in dependency order when sortTopological is enabled', async () => {
            const executionOrder = [];
            const originalExecuteNode = ExecutionService.executeNode;
            ExecutionService.executeNode = vi.fn().mockImplementation(async (node) => {
                executionOrder.push(node.nodeId);
                return { success: true, data: { status: 'success' } };
            });

            // Reversed array mimics DB order = canvas selection order when grouping.
            const nodes = [
                makeNode('n3', 'close_browser'),
                makeNode('n1', 'open_url'),
                makeNode('n4', 'click'),
                makeNode('n2', 'click'),
            ];
            const edges = [makeEdge('n1', 'n2'), makeEdge('n2', 'n3'), makeEdge('n2', 'n4')];

            const state = {
                runId: 'topo-run',
                browserId: null,
                variables: {},
                executedNodeIds: new Set(),
                activatedNodeIds: new Set(['n1', 'n2', 'n3', 'n4']),
                nodeStates: {},
                edgeStates: {},
                overrides: {},
                headers: {},
                startTime: Date.now(),
            };
            variableManager.initRun('topo-run');

            await ExecutionService.runSequence(
                [nodes[1]], // entry n1 (array index differs from topo order)
                nodes,
                edges,
                state,
                null,
                { sortTopological: true },
            );

            expect(executionOrder).toEqual(['n1', 'n2', 'n3', 'n4']);

            // Restore
            ExecutionService.executeNode = originalExecuteNode;
        });
    });

    // =========================================================================
    // Task: Deterministic run ENTRY — the flow must start from the launch
    // browser node, not from whatever row happens to come first in the DB.
    // =========================================================================
    describe('orderEntryNodes & sortEntry — deterministic run start', () => {
        it('launch_browser entry runs FIRST regardless of DB row order', async () => {
            const executionOrder = [];
            const originalExecuteNode = ExecutionService.executeNode;
            ExecutionService.executeNode = vi.fn().mockImplementation(async (node) => {
                executionOrder.push(node.nodeId);
                return { success: true, data: { status: 'success' } };
            });

            // DB order: orphan click first, launch second, open_url third.
            const nodes = [
                makeNode('orphan-click', 'click'),
                makeNode('launch', 'launch_browser'),
                makeNode('open-url', 'open_url'),
            ];
            const edges = [makeEdge('launch', 'open-url')];

            const state = {
                runId: 'order-run',
                browserId: null,
                variables: {},
                executedNodeIds: new Set(),
                activatedNodeIds: new Set(),
                nodeStates: {},
                edgeStates: {},
                overrides: {},
                headers: {},
                startTime: Date.now(),
            };
            variableManager.initRun('order-run');

            await ExecutionService.runSequence(
                [nodes[1], nodes[0]], // entries: launch, orphan-click
                nodes,
                edges,
                state,
                null,
                { sortEntry: true },
            );

            // launch executes first, then its child (open-url), then the orphan.
            expect(executionOrder).toEqual(['launch', 'open-url', 'orphan-click']);

            ExecutionService.executeNode = originalExecuteNode;
        });

        it('breaks entry ties by canvas position (top→bottom, left→right)', () => {
            const nodes = [makeNode('bottom', 'click'), makeNode('top', 'click')];
            nodes[0].position = { x: 10, y: 100 };
            nodes[1].position = { x: 10, y: 20 };

            const sorted = ExecutionService.orderEntryNodes(nodes);
            expect(sorted.map((n) => n.nodeId)).toEqual(['top', 'bottom']);
        });

        it('keeps a stable order when positions tie', () => {
            const nodes = [makeNode('b-node', 'click'), makeNode('a-node', 'click')];
            nodes.forEach((n) => {
                n.position = { x: 0, y: 0 };
            });

            const sorted = ExecutionService.orderEntryNodes(nodes);
            expect(sorted.map((n) => n.nodeId)).toEqual(['a-node', 'b-node']);
        });
    });
});
