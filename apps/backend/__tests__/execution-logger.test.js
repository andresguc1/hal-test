import { describe, it, expect, vi, beforeEach } from 'vitest';

// Avoid a real DB connection: only the models and the corruption helpers are
// touched by ExecutionLogger, and every test below drives the pure logic.
vi.mock('../database/init.js', () => ({
    Run: { create: vi.fn(), findByPk: vi.fn() },
    StepResult: { create: vi.fn(), findAll: vi.fn(), destroy: vi.fn(), max: vi.fn() },
}));

vi.mock('../database/index.js', () => ({
    recoverFromCorruption: vi.fn(),
    createBackup: vi.fn(),
}));

import { StepResult } from '../database/init.js';
import { executionLogger } from '../services/ExecutionLogger.js';

describe('ExecutionLogger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        executionLogger.sequenceCounters.clear();
        executionLogger.runStarts.clear();
    });

    describe('toRootRunId', () => {
        it('leaves a canonical run id untouched', () => {
            expect(executionLogger.constructor.toRootRunId('run-123')).toBe('run-123');
        });

        it('strips component (_child_) derived suffixes', () => {
            expect(executionLogger.constructor.toRootRunId('run-123_child_node-42')).toBe(
                'run-123',
            );
        });

        it('strips loop/for_each (_loop_) derived suffixes', () => {
            expect(executionLogger.constructor.toRootRunId('run-123_loop_node-7_3')).toBe(
                'run-123',
            );
        });

        it('strips a child nested inside a loop back to the root', () => {
            expect(
                executionLogger.constructor.toRootRunId('run-123_loop_node-7_3_child_node-9'),
            ).toBe('run-123');
        });

        it('returns falsy input unchanged', () => {
            expect(executionLogger.constructor.toRootRunId(null)).toBeNull();
            expect(executionLogger.constructor.toRootRunId(undefined)).toBeUndefined();
        });
    });

    describe('_buildStepPayload', () => {
        it('persists derived run ids under the root run and keeps composite metadata', () => {
            const payload = executionLogger._buildStepPayload(
                'run-1_child_node-a',
                { id: 'node-a', type: 'click' },
                { status: 'success' },
                { compositeNodeId: 'comp-1', subflowId: 'flow-A', parentNodeId: 'comp-1' },
            );

            expect(payload.run_id).toBe('run-1');
            expect(payload.compositeNodeId).toBe('comp-1');
            expect(payload.subflowId).toBe('flow-A');
            expect(payload.parentNodeId).toBe('comp-1');
        });

        it('assigns a monotonic sequence across scoped ids of the same root run', () => {
            const a = executionLogger._buildStepPayload(
                'run-1',
                { id: 'a', type: 'x' },
                { status: 'success' },
            );
            const b = executionLogger._buildStepPayload(
                'run-1_child_a',
                { id: 'b', type: 'x' },
                { status: 'success' },
            );
            const c = executionLogger._buildStepPayload(
                'run-1',
                { id: 'c', type: 'x' },
                { status: 'success' },
            );

            expect([a.sequence, b.sequence, c.sequence]).toEqual([1, 2, 3]);
        });

        it('derives a label when none is supplied', () => {
            const payload = executionLogger._buildStepPayload(
                'run-1',
                { id: 'node-1', type: 'open_url', label: 'Open URL' },
                { status: 'success' },
            );
            expect(payload.label).toBe('Open URL');
        });

        it('records real started/finished times from the duration', () => {
            const payload = executionLogger._buildStepPayload(
                'run-1',
                { id: 'n', type: 'x' },
                { status: 'success', duration: 250 },
            );
            expect(payload.duration_ms).toBe(250);
            expect(
                new Date(payload.finished_at).getTime() - new Date(payload.started_at).getTime(),
            ).toBe(250);
        });

        it('honours an explicit videoTimestamp and never fabricates otherwise', () => {
            const explicit = executionLogger._buildStepPayload(
                'run-1',
                { id: 'n', type: 'x' },
                { status: 'success', videoTimestamp: 12.5 },
            );
            expect(explicit.video_timestamp).toBe(12.5);

            executionLogger.sequenceCounters.clear();
            const unknown = executionLogger._buildStepPayload(
                'run-1',
                { id: 'n', type: 'x' },
                { status: 'success' },
            );
            expect(unknown.video_timestamp).toBeNull();
        });

        it('measures a best-effort timestamp once the run start is known', () => {
            executionLogger.runStarts.set('run-1', Date.now() - 5000);
            const payload = executionLogger._buildStepPayload(
                'run-1',
                { id: 'n', type: 'x' },
                { status: 'success' },
            );
            expect(payload.video_timestamp).toBeGreaterThanOrEqual(4.5);
            expect(payload.video_timestamp).toBeLessThanOrEqual(6);
        });
    });

    describe('_persist', () => {
        it('returns true when the row is written', async () => {
            StepResult.create.mockResolvedValueOnce({});
            const ok = await executionLogger._persist({ run_id: 'run-1' });
            expect(ok).toBe(true);
        });

        it('swallows database errors and returns false instead of throwing', async () => {
            StepResult.create.mockRejectedValueOnce(new Error('NOT NULL constraint failed'));
            const ok = await executionLogger._persist({ run_id: 'run-1' });
            expect(ok).toBe(false);
        });
    });

    describe('_seedSequence — survives a process restart', () => {
        beforeEach(() => {
            executionLogger._sequenceSeeds.clear();
        });

        it('continues from the max persisted sequence for the run', async () => {
            StepResult.max.mockResolvedValue(7);
            await executionLogger._seedSequence('run-1');
            expect(executionLogger.sequenceCounters.get('run-1')).toBe(7);
            expect(executionLogger._nextSequence('run-1')).toBe(8);
        });

        it('starts at 1 when the run has no persisted steps', async () => {
            StepResult.max.mockResolvedValue(null);
            await executionLogger._seedSequence('run-1');
            expect(executionLogger._nextSequence('run-1')).toBe(1);
        });

        it('does not reset a counter already in memory', async () => {
            executionLogger.sequenceCounters.set('run-1', 3);
            StepResult.max.mockResolvedValue(7);
            await executionLogger._seedSequence('run-1');
            expect(executionLogger._nextSequence('run-1')).toBe(4);
            expect(StepResult.max).not.toHaveBeenCalled();
        });
    });
});
