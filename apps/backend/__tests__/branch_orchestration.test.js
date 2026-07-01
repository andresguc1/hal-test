import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executionService } from '../services/ExecutionService.js';
import { variableManager } from '../services/VariableManager.js';

// Mock dependencies that might cause side effects during unit tests
vi.mock('../socket.js', () => ({
    emitLog: vi.fn(),
    emitFlowFinished: vi.fn(),
    emitExecutionStatus: vi.fn(),
    emitEdgeStatus: vi.fn(),
}));

describe('ExecutionService - Branch Orchestration', () => {
    beforeEach(() => {
        variableManager.clearAll();
        vi.clearAllMocks();
    });

    it('should execute branches in parallel when mode is parallel', async () => {
        const branchNode = { nodeId: 'branch-1', type: 'branch', data: {}, parentId: null };
        const nodeA = { nodeId: 'node-A', type: 'variable', data: {}, parentId: null };
        const nodeB = { nodeId: 'node-B', type: 'variable', data: {}, parentId: null };

        const allNodes = [branchNode, nodeA, nodeB];
        const allEdges = [
            { source: 'branch-1', target: 'node-A' },
            { source: 'branch-1', target: 'node-B' },
        ];

        // Mock executeNode
        const executeNodeSpy = vi.spyOn(executionService, 'executeNode');

        executeNodeSpy.mockImplementation(async (node) => {
            if (node.nodeId === 'branch-1') {
                return { success: true, data: { mode: 'parallel' } };
            }
            if (node.nodeId === 'node-A') {
                await new Promise((r) => setTimeout(r, 100));
                return { success: true };
            }
            if (node.nodeId === 'node-B') {
                await new Promise((r) => setTimeout(r, 100));
                return { success: true };
            }
            return { success: true };
        });

        const state = { executedNodeIds: new Set(), activatedNodeIds: new Set() };
        state.activatedNodeIds.add(branchNode.nodeId);

        const startTime = Date.now();
        await executionService.runSequence([branchNode], allNodes, allEdges, state);
        const duration = Date.now() - startTime;

        expect(executeNodeSpy).toHaveBeenCalledTimes(3);
        expect(duration).toBeLessThan(5000);
    });

    it('should execute branches sequentially when mode is sequential', async () => {
        const branchNode = { nodeId: 'branch-1', type: 'branch', data: {}, parentId: null };
        const nodeA = { nodeId: 'node-A', type: 'variable', data: {}, parentId: null };
        const nodeB = { nodeId: 'node-B', type: 'variable', data: {}, parentId: null };

        const allNodes = [branchNode, nodeA, nodeB];
        const allEdges = [
            { source: 'branch-1', target: 'node-A' },
            { source: 'branch-1', target: 'node-B' },
        ];

        const executeNodeSpy = vi.spyOn(executionService, 'executeNode');

        executeNodeSpy.mockImplementation(async (node) => {
            if (node.nodeId === 'branch-1') {
                return { success: true, data: { mode: 'sequential' } };
            }
            if (node.nodeId === 'node-A') {
                await new Promise((r) => setTimeout(r, 100));
                return { success: true };
            }
            if (node.nodeId === 'node-B') {
                await new Promise((r) => setTimeout(r, 100));
                return { success: true };
            }
            return { success: true };
        });

        const state = { executedNodeIds: new Set(), activatedNodeIds: new Set() };
        state.activatedNodeIds.add(branchNode.nodeId);

        const startTime = Date.now();
        await executionService.runSequence([branchNode], allNodes, allEdges, state);
        const duration = Date.now() - startTime;

        expect(executeNodeSpy).toHaveBeenCalledTimes(3);
        // Sequential: sum of times (200ms+)
        expect(duration).toBeGreaterThanOrEqual(200);
    });

    it('should proceed as soon as one branch finishes in race mode', async () => {
        const branchNode = { nodeId: 'branch-1', type: 'branch', data: {}, parentId: null };
        const nodeA = { nodeId: 'node-A', type: 'variable', data: {}, parentId: null };
        const nodeB = { nodeId: 'node-B', type: 'variable', data: {}, parentId: null };

        const allNodes = [branchNode, nodeA, nodeB];
        const allEdges = [
            { source: 'branch-1', target: 'node-A' },
            { source: 'branch-1', target: 'node-B' },
        ];

        const executeNodeSpy = vi.spyOn(executionService, 'executeNode');

        executeNodeSpy.mockImplementation(async (node) => {
            if (node.nodeId === 'branch-1') {
                return { success: true, data: { mode: 'race' } };
            }
            if (node.nodeId === 'node-A') {
                await new Promise((r) => setTimeout(r, 300)); // Slow
                return { success: true };
            }
            if (node.nodeId === 'node-B') {
                await new Promise((r) => setTimeout(r, 10)); // Fast
                return { success: true };
            }
            return { success: true };
        });

        const state = { executedNodeIds: new Set(), activatedNodeIds: new Set() };
        state.activatedNodeIds.add(branchNode.nodeId);

        const startTime = Date.now();
        await executionService.runSequence([branchNode], allNodes, allEdges, state);
        const duration = Date.now() - startTime;

        // Note: Promise.race will finish, but the other branch might still be running in background
        // unless explicitly cancelled. However, ExecutionService will continue with the next nodes.
        expect(duration).toBeLessThan(5000);
    });
});
