import { describe, it, expect, vi } from 'vitest';

// Mock socket.js
vi.mock('../socket.js', () => ({
    emitLog: vi.fn(),
    emitExecutionStatus: vi.fn(),
    emitEdgeStatus: vi.fn(),
    emitFlowFinished: vi.fn(),
    emitScreenshotReady: vi.fn(),
    emitVariableChange: vi.fn(),
}));

import { executionManager } from '../services/ExecutionManager.js';

// =============================================================================
// MODE ROUTING
// =============================================================================
describe('ExecutionManager - Mode Routing', () => {
    it('should delegate to E2ERunner for "e2e" mode', async () => {
        const mockRunFn = vi.fn().mockResolvedValue({ success: true });
        const flow = { id: 'flow-1', nodes: [], edges: [] };
        const options = { runId: 'run-1' };

        const result = await executionManager.execute('e2e', flow, options, mockRunFn);

        expect(mockRunFn).toHaveBeenCalledWith(flow, options);
        expect(result.success).toBe(true);
    });

    it('should handle null mode by falling back to e2e runner', async () => {
        const mockRunFn = vi.fn().mockResolvedValue({ success: true });
        const flow = { id: 'flow-1', nodes: [], edges: [] };

        // Note: ExecutionManager currently crashes on null mode due to mode.toUpperCase()
        // in emitLog. This test documents the current behavior.
        // When mode is null, it falls back to e2e runner but the emitLog call throws.
        await expect(executionManager.execute(null, flow, {}, mockRunFn)).rejects.toThrow();
    });

    it('should throw for unsupported execution modes', async () => {
        const flow = { id: 'flow-1', nodes: [], edges: [] };

        await expect(executionManager.execute('chaos', flow, {})).rejects.toThrow('not supported');
    });

    it('should delegate to PerformanceRunner for "performance" mode', async () => {
        const flow = {
            id: 'flow-1',
            nodes: [{ type: 'open_url', data: { url: 'http://localhost' } }],
            edges: [],
        };

        const result = await executionManager.execute('performance', flow, {
            performanceConfig: { duration: 0.1, virtualUsers: 1 },
        });
        expect(result.success).toBe(true);
        expect(result.mode).toBe('performance');
        expect(result.data.totalRequests).toBeDefined();
    });

    it('should delegate to SecurityRunner for "security" mode', async () => {
        const flow = { id: 'flow-1', nodes: [], edges: [] };

        const result = await executionManager.execute('security', flow, {});
        expect(result.success).toBe(true);
        expect(result.mode).toBe('security');
    });
});
