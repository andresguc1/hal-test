import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executionService } from '../services/ExecutionService.js';
import { variableManager } from '../services/VariableManager.js';

vi.mock('../socket.js', () => ({
    emitLog: vi.fn(),
    emitFlowFinished: vi.fn(),
    emitExecutionStatus: vi.fn(),
    emitEdgeStatus: vi.fn(),
}));

describe('ExecutionService - Flow Control Orchestration', () => {
    beforeEach(() => {
        variableManager.clearAll();
        vi.clearAllMocks();
    });

    it('should break the loop when a break signal is received', async () => {
        const loopNode = {
            nodeId: 'loop-1',
            type: 'loop',
            parentId: null,
            data: {
                configuration: { mode: 'count', iterations: '5', indexVar: 'i' },
            },
        };
        const checkNode = {
            nodeId: 'check-break',
            type: 'conditional',
            parentId: 'loop-1',
            data: {
                configuration: {
                    conditions: [{ left: '${i}', operator: '===', right: '2' }],
                },
            },
        };
        const breakNode = {
            nodeId: 'signal-break',
            type: 'flow_control',
            parentId: 'loop-1',
            data: { configuration: { action: 'break' } },
        };

        const allNodes = [loopNode, checkNode, breakNode];
        const allEdges = [{ source: 'check-break', target: 'signal-break', sourceHandle: 'true' }];

        const state = {
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(),
            runId: 'test-run',
        };
        state.activatedNodeIds.add(loopNode.nodeId);
        await executionService.runSequence([loopNode], allNodes, allEdges, state, null);

        // It should have executed 3 iterations (index 0, 1, 2)
        const iCounter = variableManager.get('i', state.runId);
        expect(iCounter).toBe(2);
    });

    it('should continue to next iteration when a continue signal is received', async () => {
        const loopNode = {
            nodeId: 'loop-1',
            type: 'loop',
            parentId: null,
            data: {
                configuration: { mode: 'count', iterations: '3', indexVar: 'i' },
            },
        };
        const continueNode = {
            nodeId: 'signal-continue',
            type: 'flow_control',
            parentId: 'loop-1',
            data: { configuration: { action: 'continue' } },
        };
        const skipNode = {
            nodeId: 'should-skip',
            type: 'variable',
            parentId: 'loop-1',
            data: { configuration: { name: 'skipped_at_${i}', value: true } },
        };

        const allNodes = [loopNode, continueNode, skipNode];
        const allEdges = [{ source: 'signal-continue', target: 'should-skip' }];

        const state = {
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(),
            runId: 'test-run',
        };
        state.activatedNodeIds.add(loopNode.nodeId);
        await executionService.runSequence([loopNode], allNodes, allEdges, state, null);

        expect(variableManager.get('skipped_at_0')).toBeUndefined();
        expect(variableManager.get('skipped_at_1')).toBeUndefined();
        expect(variableManager.get('skipped_at_2')).toBeUndefined();

        const iCounter = variableManager.get('i', state.runId);
        expect(iCounter).toBe(2);
    });

    it('should propagate return signal up from a loop', async () => {
        const loopNode = {
            nodeId: 'loop-1',
            type: 'loop',
            parentId: null,
            data: { configuration: { mode: 'count', iterations: '5' } },
        };
        const returnNode = {
            nodeId: 'signal-return',
            type: 'flow_control',
            parentId: 'loop-1',
            data: { configuration: { action: 'return', returnValue: '{"exit": "now"}' } },
        };
        const nextNode = {
            nodeId: 'after-loop',
            type: 'variable',
            parentId: null,
            data: { configuration: { name: 'after', value: true } },
        };

        const allNodes = [loopNode, returnNode, nextNode];
        const allEdges = [{ source: 'loop-1', target: 'after-loop' }];

        const state = {
            executedNodeIds: new Set(),
            activatedNodeIds: new Set(),
            runId: 'test-run',
        };
        state.activatedNodeIds.add(loopNode.nodeId);
        const finalResult = await executionService.runSequence(
            [loopNode],
            allNodes,
            allEdges,
            state,
            null,
        );

        expect(finalResult).not.toBeNull();
        expect(finalResult.action).toBe('return');
        expect(JSON.parse(finalResult.returnValue)).toEqual({ exit: 'now' });
        expect(variableManager.get('after')).toBeUndefined();
    });
});
