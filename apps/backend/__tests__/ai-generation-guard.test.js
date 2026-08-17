import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../core/SafetyGate.js', () => ({
    safetyGate: { validate: vi.fn(), validateQuick: vi.fn() },
}));

import { safetyGate } from '../core/SafetyGate.js';
import aiGenerationGuardDefault from '../core/AIGenerationGuard.js';

const AIGenerationGuard = aiGenerationGuardDefault.constructor;

function makeGuard() {
    return new AIGenerationGuard();
}

const canvas = { nodes: [], edges: [] };

beforeEach(() => {
    vi.clearAllMocks();
});

// =============================================================================
// interceptAndValidate
// =============================================================================
describe('interceptAndValidate', () => {
    it('returns approved immediately when no nodes in response', async () => {
        const guard = makeGuard();
        const response = { text: 'done' };

        const result = await guard.interceptAndValidate(response, canvas);

        expect(result.approved).toBe(response);
        expect(result.rejected).toBeNull();
        expect(result.gateReport.passed).toBe(true);
        expect(result.gateReport.score).toBe(1.0);
        expect(safetyGate.validate).not.toHaveBeenCalled();
    });

    it('returns approved when nodes pass the safety gate', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValueOnce({
            passed: true,
            score: 0.9,
            validations: [],
        });

        const response = {
            proposedNodes: [{ id: 'n1', type: 'click', data: {} }],
            model: 'test',
        };

        const result = await guard.interceptAndValidate(response, canvas);

        expect(result.approved).toBe(response);
        expect(result.rejected).toBeNull();
        expect(safetyGate.validate).toHaveBeenCalledTimes(1);
        expect(result.gateReport.passed).toBe(true);
    });

    it('returns rejected when nodes fail the safety gate', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValueOnce({
            passed: false,
            score: 0.2,
            validations: [],
        });

        const response = {
            proposedNodes: [{ id: 'n1', type: 'click', data: {} }],
            model: 'test',
        };

        const result = await guard.interceptAndValidate(response, canvas);

        expect(result.approved).toBeNull();
        expect(result.rejected).toBe(response);
        expect(result.gateReport.passed).toBe(false);
    });

    it('extracts nodes from proposedNodes', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValueOnce({
            passed: true,
            score: 1.0,
            validations: [],
        });

        const nodes = [{ id: 'p1', type: 'typeA', data: {} }];
        const response = { proposedNodes: nodes, model: 'test' };

        await guard.interceptAndValidate(response, canvas);

        const flow = safetyGate.validate.mock.calls[0][0];
        expect(flow.nodes).toEqual(nodes);
    });

    it('extracts nodes from toolCalls (inject_nodes)', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValueOnce({
            passed: true,
            score: 1.0,
            validations: [],
        });

        const response = {
            toolCalls: [
                {
                    name: 'inject_nodes',
                    arguments: JSON.stringify({
                        nodes: [{ id: 't1', type: 'scrape', data: {} }],
                    }),
                },
            ],
            model: 'test',
        };

        await guard.interceptAndValidate(response, canvas);

        const flow = safetyGate.validate.mock.calls[0][0];
        expect(flow.nodes).toHaveLength(1);
        expect(flow.nodes[0].id).toBe('t1');
    });

    it('extracts edges from connect_nodes', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValueOnce({
            passed: true,
            score: 1.0,
            validations: [],
        });

        const response = {
            toolCalls: [
                {
                    name: 'inject_nodes',
                    arguments: JSON.stringify({
                        nodes: [{ id: 'n1', type: 'click', data: {} }],
                    }),
                },
                {
                    name: 'connect_nodes',
                    arguments: JSON.stringify({
                        sourceId: 'a',
                        targetId: 'b',
                    }),
                },
            ],
            model: 'test',
        };

        await guard.interceptAndValidate(response, canvas);

        const flow = safetyGate.validate.mock.calls[0][0];
        expect(flow.edges).toEqual([{ id: 'edge_a_b', source: 'a', target: 'b' }]);
    });

    it('combines proposed nodes with current canvas nodes', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValueOnce({
            passed: true,
            score: 1.0,
            validations: [],
        });

        const existing = { nodes: [{ id: 'e1' }], edges: [{ id: 'edge_e1_e2' }] };
        const response = {
            proposedNodes: [{ id: 'p1', type: 'click', data: {} }],
            proposedEdges: [{ id: 'edge_p1_p2', source: 'p1', target: 'p2' }],
            model: 'test',
        };

        await guard.interceptAndValidate(response, existing);

        const flow = safetyGate.validate.mock.calls[0][0];
        expect(flow.nodes).toHaveLength(2);
        expect(flow.edges).toHaveLength(2);
    });
});

// =============================================================================
// buildCorrectionPrompt
// =============================================================================
describe('buildCorrectionPrompt', () => {
    it('includes error list from gate report', () => {
        const guard = makeGuard();
        const report = {
            passed: false,
            blockedReasons: ['Missing browser launch', 'Dangerous selector'],
        };

        const prompt = guard.buildCorrectionPrompt('do something', report);

        expect(prompt).toContain('Missing browser launch');
        expect(prompt).toContain('Dangerous selector');
    });

    it('includes the original prompt text', () => {
        const guard = makeGuard();
        const report = { passed: false, blockedReasons: ['err'] };

        const prompt = guard.buildCorrectionPrompt('Build a scraping flow', report);

        expect(prompt).toContain('Build a scraping flow');
    });
});

// =============================================================================
// guardedGenerate
// =============================================================================
describe('guardedGenerate', () => {
    it('returns response on first attempt when generation passes', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValueOnce({
            passed: true,
            score: 1.0,
            validations: [],
        });

        const genFn = vi.fn().mockResolvedValueOnce({
            proposedNodes: [{ id: 'n1', type: 'click', data: {} }],
            model: 'test',
        });

        const result = await guard.guardedGenerate(genFn, canvas, {
            prompt: 'hello',
            maxRetries: 3,
        });

        expect(genFn).toHaveBeenCalledTimes(1);
        expect(result.attempts).toBe(1);
        expect(result.response).toBeDefined();
        expect(result.response.model).toBe('test');
    });

    it('retries on failure and succeeds on second attempt', async () => {
        const guard = makeGuard();
        safetyGate.validate
            .mockResolvedValueOnce({ passed: false, score: 0.1, validations: [] })
            .mockResolvedValueOnce({ passed: true, score: 0.95, validations: [] });

        const genFn = vi
            .fn()
            .mockResolvedValueOnce({
                proposedNodes: [{ id: 'bad', type: 'x', data: {} }],
                model: 'm',
            })
            .mockResolvedValueOnce({
                proposedNodes: [{ id: 'good', type: 'y', data: {} }],
                model: 'm',
            });

        const result = await guard.guardedGenerate(genFn, canvas, {
            prompt: 'start',
            maxRetries: 3,
        });

        expect(genFn).toHaveBeenCalledTimes(2);
        expect(result.attempts).toBe(2);
        expect(result.response).toBeDefined();
    });

    it('returns error string when max retries exhausted', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValue({
            passed: false,
            score: 0.0,
            validations: [],
        });

        const genFn = vi.fn().mockResolvedValue({
            proposedNodes: [{ id: 'f1', type: 'x', data: {} }],
            model: 'm',
        });

        const result = await guard.guardedGenerate(genFn, canvas, {
            prompt: 'fail',
            maxRetries: 2,
        });

        expect(genFn).toHaveBeenCalledTimes(2);
        expect(result.response).toBeNull();
        expect(result.error).toBe('Safety gate validation failed after max retries');
        expect(result.attempts).toBe(2);
    });

    it('prompt evolves with correction prompts on each retry', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValue({
            passed: false,
            score: 0.0,
            blockedReasons: ['bad node'],
        });

        const genFn = vi.fn().mockResolvedValue({
            proposedNodes: [{ id: 'x', type: 'x', data: {} }],
            model: 'm',
        });

        await guard.guardedGenerate(genFn, canvas, {
            prompt: 'original',
            maxRetries: 3,
        });

        expect(genFn.mock.calls[0][0]).toBe('original');
        expect(genFn.mock.calls[1][0]).toContain('original');
        expect(genFn.mock.calls[1][0]).toContain('bad node');
        expect(genFn.mock.calls[2][0]).toContain('bad node');
    });

    it('generateFn receives the current prompt each call', async () => {
        const guard = makeGuard();
        safetyGate.validate.mockResolvedValue({
            passed: false,
            score: 0.0,
            blockedReasons: ['issue'],
        });

        const genFn = vi.fn().mockResolvedValue({
            proposedNodes: [{ id: 'z', type: 'z', data: {} }],
            model: 'm',
        });

        await guard.guardedGenerate(genFn, canvas, {
            prompt: 'test prompt',
            maxRetries: 2,
        });

        const prompts = genFn.mock.calls.map((c) => c[0]);
        expect(prompts[0]).toBe('test prompt');
        expect(prompts[1]).toContain('test prompt');
        expect(prompts[1]).toContain('issue');
    });
});
