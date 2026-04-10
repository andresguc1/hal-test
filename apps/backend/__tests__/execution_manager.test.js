import { describe, it, expect, vi } from 'vitest';
import { executionManager } from '../services/ExecutionManager.js';

describe('ExecutionManager', () => {
    it('should default to E2E runner and call the provided function', async () => {
        const flow = { id: 'test-flow', nodes: [], edges: [] };
        const state = { runId: 'run-1' };
        const e2eSpy = vi.fn().mockResolvedValue({ success: true });

        const result = await executionManager.execute('e2e', flow, state, e2eSpy);

        expect(e2eSpy).toHaveBeenCalledWith(flow, state);
        expect(result.success).toBe(true);
    });

    it('should switch to performance mode and return a k6 script skeleton', async () => {
        const flow = {
            id: 'perf-flow',
            nodes: [{ type: 'open_url', data: { url: 'https://example.com' } }],
            edges: [],
        };
        const state = { runId: 'run-perf' };

        const result = await executionManager.execute('performance', flow, state);

        expect(result.mode).toBe('performance');
        expect(result.data.script).toContain('https://example.com');
    });

    it('should switch to security mode', async () => {
        const flow = { id: 'sec-flow', nodes: [], edges: [] };
        const state = { runId: 'run-sec' };

        const result = await executionManager.execute('security', flow, state);

        expect(result.mode).toBe('security');
        expect(result.success).toBe(true);
    });

    it('should throw error for unsupported modes', async () => {
        const flow = { id: 'bad-flow', nodes: [], edges: [] };
        await expect(executionManager.execute('invalid-mode', flow, {})).rejects.toThrow(
            'Execution mode "invalid-mode" is not supported.',
        );
    });
});
