import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock socket.js to prevent real socket emissions
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

let variableManager;
let conditionalAction;

beforeEach(async () => {
    const vmMod = await import('../services/VariableManager.js');
    variableManager = vmMod.variableManager;
    variableManager.clearAll();

    const actionMod = await import('../controllers/action.controller.js');
    conditionalAction = actionMod.conditionalAction;
}, 30000);

/**
 * Helper to create mock req/res objects for controller testing
 */
function createMockReqRes(body = {}) {
    const req = {
        body,
        t: (key) => key,
        headers: {},
        params: {},
    };

    let responseData = null;
    let responseStatus = 200;

    const res = {
        statusCode: 200,
        status: (code) => {
            responseStatus = code;
            res.statusCode = code;
            return res;
        },
        json: (data) => {
            responseData = data;
            return res;
        },
        getResponse: () => ({ status: responseStatus, data: responseData }),
    };

    return { req, res };
}

// =============================================================================
// BRANCH EVALUATION
// =============================================================================
describe('conditionalAction - Branch Evaluation', () => {
    it('should match the first branch with a truthy structured expression', async () => {
        variableManager.initRun('run-1');
        variableManager.set('Login.result', { success: true, status: 'success' }, 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                {
                    id: 'branch-true',
                    label: 'Success',
                    expression: {
                        left: '{{Login.result.success}}',
                        operator: '==',
                        right: true,
                    },
                },
                {
                    id: 'branch-false',
                    label: 'Failure',
                    expression: {
                        left: '{{Login.result.success}}',
                        operator: '==',
                        right: false,
                    },
                },
            ],
            fallbackPath: 'fallback',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.path).toBe('branch-true');
        expect(response.data.data.result).toBe(true);
    });

    it('should match the second branch when the first does not match', async () => {
        variableManager.initRun('run-1');
        variableManager.set('status', 'error', 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                {
                    id: 'branch-ok',
                    label: 'OK',
                    expression: { left: '{{status}}', operator: '==', right: 'success' },
                },
                {
                    id: 'branch-err',
                    label: 'Error',
                    expression: { left: '{{status}}', operator: '==', right: 'error' },
                },
            ],
            fallbackPath: 'fallback',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        expect(response.data.data.path).toBe('branch-err');
        expect(response.data.data.result).toBe(true);
    });

    it('should route to fallbackPath when no branch matches', async () => {
        variableManager.initRun('run-1');
        variableManager.set('count', 42, 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                {
                    id: 'branch-low',
                    label: 'Low',
                    expression: { left: '{{count}}', operator: '<', right: '10' },
                },
            ],
            fallbackPath: 'my-fallback',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        expect(response.data.data.path).toBe('my-fallback');
        expect(response.data.data.result).toBe(false);
    });

    it('should use default fallbackPath "false" when not specified', async () => {
        variableManager.initRun('run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                {
                    id: 'branch-1',
                    label: 'Never Match',
                    expression: { left: '{{missing}}', operator: '==', right: 'value' },
                },
            ],
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        expect(response.data.data.path).toBe('false');
    });
});

// =============================================================================
// DEFAULT BRANCH
// =============================================================================
describe('conditionalAction - Default Branch', () => {
    it('should route to the explicit "false" branch when no other branch matches', async () => {
        variableManager.initRun('run-1');
        variableManager.set('val', 'unexpected', 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                {
                    id: 'branch-specific',
                    label: 'Specific',
                    expression: { left: '{{val}}', operator: '==', right: 'expected' },
                },
                {
                    id: 'false',
                    label: 'Else',
                    expression: '',
                },
            ],
            fallbackPath: 'false',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        expect(response.data.data.path).toBe('false');
        expect(response.data.data.result).toBe(true);
    });

    it('should NOT treat a non-fallback branch with empty expression as an implicit catch-all', async () => {
        variableManager.initRun('run-1');
        variableManager.set('val', 'unexpected', 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                {
                    id: 'branch-specific',
                    label: 'Specific',
                    expression: { left: '{{val}}', operator: '==', right: 'expected' },
                },
                {
                    id: 'branch-empty',
                    label: 'Empty',
                    expression: '', // NOT a fallback branch — must not swallow the match
                },
            ],
            fallbackPath: 'fallback',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        // 'branch-empty' has no real expression -> must not be selected as catch-all
        expect(response.data.data.path).toBe('fallback');
        expect(response.data.data.trace['branch-empty'].status).toBe('not_matched');
    });
});

// =============================================================================
// TRACE OUTPUT
// =============================================================================
describe('conditionalAction - Trace Output', () => {
    it('should include trace with correct statuses for each branch', async () => {
        variableManager.initRun('run-1');
        variableManager.set('x', '10', 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                {
                    id: 'b1',
                    label: 'Greater',
                    expression: { left: '{{x}}', operator: '>', right: '5' },
                },
                {
                    id: 'b2',
                    label: 'Less',
                    expression: { left: '{{x}}', operator: '<', right: '5' },
                },
            ],
            fallbackPath: 'fallback',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();
        const trace = response.data.data.trace;

        expect(trace.b1.matched).toBe(true);
        expect(trace.b1.status).toBe('matched');

        // b2 should be "skipped" because b1 already matched
        expect(trace.b2.matched).toBe(false);
        expect(trace.b2.status).toBe('skipped');
    });
});

// =============================================================================
// LEGACY MODE
// =============================================================================
describe('conditionalAction - Legacy Conditions', () => {
    it('should evaluate legacy conditions array with AND logic', async () => {
        variableManager.initRun('run-1');
        variableManager.set('a', 'yes', 'run-1');
        variableManager.set('b', 'yes', 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            conditions: [
                { left: '{{a}}', operator: '==', right: 'yes' },
                { left: '{{b}}', operator: '==', right: 'yes' },
            ],
            logic: 'AND',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        expect(response.data.success).toBe(true);
        expect(response.data.data.result).toBe(true);
        expect(response.data.data.path).toBe('true');
    });

    it('should evaluate legacy conditions with OR logic', async () => {
        variableManager.initRun('run-1');
        variableManager.set('a', 'no', 'run-1');
        variableManager.set('b', 'yes', 'run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            conditions: [
                { left: '{{a}}', operator: '==', right: 'yes' },
                { left: '{{b}}', operator: '==', right: 'yes' },
            ],
            logic: 'OR',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        expect(response.data.data.result).toBe(true);
        expect(response.data.data.path).toBe('true');
    });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================
describe('conditionalAction - Error Handling', () => {
    it('should handle branch expression errors gracefully without crashing', async () => {
        variableManager.initRun('run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                {
                    id: 'branch-bad',
                    label: 'Bad Expression',
                    expression: 'this is not valid JS +++',
                },
                {
                    id: 'false',
                    label: 'Else',
                    expression: '',
                },
            ],
            fallbackPath: 'fallback',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        // Should not crash; should surface the evaluation error and route to fallback
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.path).toBe('false');
        expect(response.data.data.trace['branch-bad'].status).toBe('error');
        expect(response.data.data.evaluationErrors).toHaveLength(1);
        expect(response.data.data.evaluationErrors[0].branch).toBe('Bad Expression');
    });

    it('should surface multiple evaluation errors in the response', async () => {
        variableManager.initRun('run-1');

        const { req, res } = createMockReqRes({
            runId: 'run-1',
            branches: [
                { id: 'bad-1', label: 'Bad One', expression: 'this is not valid JS +++' },
                { id: 'bad-2', label: 'Bad Two', expression: 'also not valid JS +++' },
                { id: 'false', label: 'Else', expression: '' },
            ],
            fallbackPath: 'false',
        });

        await conditionalAction(req, res);
        const response = res.getResponse();

        expect(response.data.data.path).toBe('false');
        expect(response.data.data.evaluationErrors).toHaveLength(2);
        expect(response.data.data.trace['bad-1'].status).toBe('error');
        expect(response.data.data.trace['bad-2'].status).toBe('error');
    });
});
