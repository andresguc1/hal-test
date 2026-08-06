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
});
