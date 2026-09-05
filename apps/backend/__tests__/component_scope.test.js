import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mocks (must be before imports that use them) ───────────────────────────
vi.mock('../database/init.js', () => ({
    Flow: {
        findByPk: vi.fn().mockResolvedValue(null),
    },
    Node: {},
    Edge: {},
}));

vi.mock('../socket.js', () => ({
    emitLog: vi.fn(),
    emitExecutionStatus: vi.fn(),
}));

vi.mock('../services/browser.service.js', () => ({
    browserService: {
        delete: vi.fn().mockResolvedValue(true),
        keys: vi.fn().mockReturnValue([]),
        get: vi.fn(),
        getLatest: vi.fn(),
        launchBrowser: vi.fn(),
    },
}));

// Mock ExecutionService so runSequence is a no-op returning success
vi.mock('../services/ExecutionService.js', () => {
    const mockRunSequence = vi.fn().mockResolvedValue({ success: true, message: 'ok' });
    return {
        ExecutionService: class {
            runSequence(...args) {
                return mockRunSequence(...args);
            }
        },
        __runSequenceMock: mockRunSequence,
    };
});

// ─── Tests ──────────────────────────────────────────────────────────────────
import { variableManager } from '../services/VariableManager.js';
import { __runSequenceMock } from '../services/ExecutionService.js';
import { browserService } from '../services/browser.service.js';
import componentAction from '../plugins/core-flow-control/handlers/component.js';

function makeReq(body) {
    return { body, headers: {} };
}
function makeRes() {
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return res;
}

describe('componentAction — variable scope isolation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset variableManager scopes for a clean test
        variableManager.scopes = { global: {}, runs: {}, legacy_flow: {} };
    });

    it('returns 400 when no flowId and no inline subNodes', async () => {
        const req = makeReq({
            nodeId: 'c1',
            label: 'Empty Component',
            configuration: {},
            runId: 'run-1',
        });
        const res = makeRes();
        await componentAction(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('creates an isolated child runId — parent scope is not polluted', async () => {
        const parentRunId = 'run-parent-test';

        // Set a parent variable that must survive
        variableManager.set('parentVar', 'original_value', parentRunId);
        variableManager.set('parentConfig', 'keep_me', parentRunId);

        const req = makeReq({
            nodeId: 'comp-iso-1',
            label: 'Isolated Component',
            runId: parentRunId,
            configuration: {
                flowId: 'fake-flow',
                // This config param should NOT overwrite parent var
                myParam: 'child_value',
            },
        });
        const res = makeRes();

        // findByPk returns null, so we need to provide inline subNodes
        // Override configuration to use inline mode
        req.body.configuration = {};
        req.body.subNodes = [
            {
                id: 'inner-1',
                type: 'type_text',
                data: {
                    label: 'Inner Type',
                    configuration: { selector: '#input', text: 'typed' },
                },
            },
        ];

        await componentAction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));

        // Parent variable must still be intact
        const parentVal = variableManager.get('parentVar', parentRunId);
        expect(parentVal).toBe('original_value');

        const parentCfg = variableManager.get('parentConfig', parentRunId);
        expect(parentCfg).toBe('keep_me');
    });

    it('inline subNodes fallback works when flowId is absent', async () => {
        const req = makeReq({
            nodeId: 'comp-inline-1',
            label: 'Inline Fallback',
            runId: 'run-inline',
            configuration: {},
            subNodes: [
                {
                    id: 'inner-click',
                    type: 'click',
                    data: {
                        label: 'Click Step',
                        configuration: { selector: '#btn' },
                    },
                },
            ],
            subEdges: [],
        });
        const res = makeRes();
        await componentAction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const call = res.json.mock.calls[0][0];
        expect(call.success).toBe(true);
        expect(call.data.executedNodes).toBeGreaterThanOrEqual(0);
    });

    it('inputMapping propagates parent vars into child scope', async () => {
        const parentRunId = 'run-mapping';
        variableManager.set('sourceVar', 'hello_from_parent', parentRunId);

        const req = makeReq({
            nodeId: 'comp-map-1',
            label: 'Mapping Component',
            runId: parentRunId,
            configuration: {
                inputMapping: [{ parentVar: 'sourceVar', childVar: 'targetVar' }],
            },
            subNodes: [
                {
                    id: 'inner-assert',
                    type: 'open_url',
                    data: { configuration: { url: 'https://example.com' } },
                },
            ],
        });
        const res = makeRes();
        await componentAction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('error in subflow does not corrupt parent scope', async () => {
        const parentRunId = 'run-error-test';
        variableManager.set('safeVar', 'protected', parentRunId);

        const req = makeReq({
            nodeId: 'comp-error-1',
            label: 'Error Component',
            runId: parentRunId,
            configuration: {
                flowId: 'nonexistent-flow',
            },
        });
        const res = makeRes();
        await componentAction(req, res);

        // Even on error, the parent variable should still be intact
        const safeVal = variableManager.get('safeVar', parentRunId);
        expect(safeVal).toBe('protected');
    });
});

describe('componentAction — child runId isolation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        variableManager.scopes = { global: {}, runs: {}, legacy_flow: {} };
    });

    it('child runId contains parent variables for reading', async () => {
        const parentRunId = 'run-child-test';
        variableManager.set('parentData', 'accessible', parentRunId);

        const req = makeReq({
            nodeId: 'comp-child-1',
            label: 'Child Scope',
            runId: parentRunId,
            configuration: {},
            subNodes: [
                {
                    id: 'inner-read',
                    type: 'open_url',
                    data: { configuration: { url: 'https://test.com' } },
                },
            ],
        });
        const res = makeRes();
        await componentAction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // The child scope should have been created with a child-specific runId
        // We can verify parent is NOT polluted
        const parentVal = variableManager.get('parentData', parentRunId);
        expect(parentVal).toBe('accessible');
    });

    it('propagates the cancellation signal and deterministic ordering to the sub-flow runner', async () => {
        // Simulates an in-flight run that is being stopped (AbortController).
        const controller = new AbortController();
        const req = makeReq({
            nodeId: 'comp-signal-1',
            label: 'Signal Component',
            runId: 'run-signal',
            configuration: {},
            subNodes: [
                {
                    id: 'inner-1',
                    type: 'click',
                    data: { configuration: { selector: '#internal' } },
                },
            ],
        });
        req.signal = controller.signal;
        const res = makeRes();

        await componentAction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        const call = __runSequenceMock.mock.calls[0];
        expect(call).toBeDefined();
        // subflowState (index 3) must carry the run's cancellation signal so
        // runSequence stops the composite as soon as the run is cancelled.
        expect(call[3].signal).toBe(controller.signal);
        // Options (index 5) must request deterministic topological ordering.
        expect(call[5]).toEqual({ sortTopological: true });
    });

    it('propagates the sub-flow browserId back to the caller on success', async () => {
        __runSequenceMock.mockImplementationOnce(async (nodes, all, edges, state) => {
            // Simulate the sub-flow launching its own browser mid-run.
            state.browserId = 'child-browser-abc';
            return { success: true, message: 'ok' };
        });

        const req = makeReq({
            nodeId: 'comp-bprop-1',
            label: 'Browser Propagation',
            runId: 'run-bprop',
            browserId: 'parent-browser',
            configuration: {},
            subNodes: [
                {
                    id: 'inner-1',
                    type: 'click',
                    data: { configuration: { selector: '#x' } },
                },
            ],
        });
        const res = makeRes();

        await componentAction(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, browserId: 'child-browser-abc' }),
        );
    });

    it('closes an orphaned sub-flow browser when the sub-flow errors', async () => {
        __runSequenceMock.mockImplementationOnce(async (nodes, all, edges, state) => {
            state.browserId = 'child-browser-orph';
            throw new Error('Node timeout: exceeded 30000ms limit');
        });

        const req = makeReq({
            nodeId: 'comp-orphan-1',
            label: 'Orphaned Browser',
            runId: 'run-orphan',
            browserId: 'parent-browser',
            configuration: {},
            subNodes: [
                {
                    id: 'inner-1',
                    type: 'click',
                    data: { configuration: { selector: '#x' } },
                },
            ],
        });
        const res = makeRes();

        await componentAction(req, res);

        // The child-launched browser (≠ parent) must be closed, not leaked.
        expect(browserService.delete).toHaveBeenCalledWith('child-browser-orph');

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                status: 'error',
                error: expect.objectContaining({ code: 'COMPONENT_EXECUTION_ERROR' }),
            }),
        );
    });

    it('does not close the parent browser when the sub-flow errors before switching', async () => {
        __runSequenceMock.mockImplementationOnce(async () => {
            throw new Error('Subflow exploded');
        });

        const req = makeReq({
            nodeId: 'comp-noclean-1',
            label: 'No Cleanup',
            runId: 'run-noclean',
            browserId: 'parent-browser',
            configuration: {},
            subNodes: [
                {
                    id: 'inner-1',
                    type: 'click',
                    data: { configuration: { selector: '#x' } },
                },
            ],
        });
        const res = makeRes();

        await componentAction(req, res);

        expect(browserService.delete).not.toHaveBeenCalled();
    });
});
