import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activeRunManager } from '../services/ActiveRunManager.js';
import aiService from '../services/AIService.js';
import { generateText, generateObject } from 'ai';

vi.mock('ai', () => ({
    generateText: vi.fn(),
    generateObject: vi.fn(),
}));

describe('Execution Cancellation & AI Interruption', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Clear active run manager registry
        for (const runId of activeRunManager.runs.keys()) {
            activeRunManager.cleanup(runId);
        }
        process.env.OPENAI_API_KEY = 'test-key';
    });

    describe('ActiveRunManager', () => {
        it('should register and retrieve AbortSignals for active runs', () => {
            const runId = 'test_run_1';
            const signal = activeRunManager.register(runId);

            expect(signal).toBeInstanceOf(AbortSignal);
            expect(activeRunManager.getSignal(runId)).toBe(signal);
            expect(activeRunManager.isActive(runId)).toBe(true);
        });

        it('should abort and cleanup when requested', () => {
            const runId = 'test_run_2';
            const signal = activeRunManager.register(runId);

            const result = activeRunManager.abort(runId);

            expect(result).toBe(true);
            expect(signal.aborted).toBe(true);
            // After abort, the run is still tracked as active (aborted) until done() is called.
            // This allows in-flight handlers to observe the abort signal.
            expect(activeRunManager.isActive(runId)).toBe(true);
            expect(activeRunManager.getSignal(runId)?.aborted).toBe(true);

            activeRunManager.done(runId);
            expect(activeRunManager.isActive(runId)).toBe(false);
        });

        it('should return false when aborting non-existent run', () => {
            expect(activeRunManager.abort('non_existent')).toBe(false);
        });
    });

    describe('ActiveRunManager reset callback + abort race', () => {
        it('invokes the reset callback exactly once when aborted via abortAndReset', () => {
            const runId = 'test_reset_1';
            const reset = vi.fn();
            activeRunManager.register(runId, reset);

            activeRunManager.abortAndReset(runId);
            expect(reset).toHaveBeenCalledTimes(1);
            expect(activeRunManager.isAborted(runId)).toBe(true);

            // Idempotent: a second abort must not re-run the reset.
            activeRunManager.abortAndReset(runId);
            expect(reset).toHaveBeenCalledTimes(1);
        });

        it('setResetCallback attaches a reset after register and abortAndReset runs it', () => {
            const runId = 'test_reset_2';
            const reset = vi.fn();
            const signal = activeRunManager.register(runId);

            activeRunManager.setResetCallback(runId, reset);
            activeRunManager.abortAndReset(runId);

            expect(signal.aborted).toBe(true);
            expect(reset).toHaveBeenCalledTimes(1);
        });

        it('honors an abort that arrives before register (pendingAborts race)', () => {
            const runId = 'test_race_1';

            // Cancel lands first — nothing is registered yet.
            expect(activeRunManager.abortAndReset(runId)).toBe(false);

            // Late registration must inherit the abort: signal is already aborted
            // and the reset callback fires immediately.
            const reset = vi.fn();
            const signal = activeRunManager.register(runId, reset);

            expect(signal.aborted).toBe(true);
            expect(activeRunManager.isAborted(runId)).toBe(true);
            expect(reset).toHaveBeenCalledTimes(1);
        });

        it('done() clears the run and pendingAborts so it can be reused', () => {
            const runId = 'test_done_1';
            const reset = vi.fn();
            activeRunManager.register(runId, reset);
            activeRunManager.abortAndReset(runId);
            activeRunManager.done(runId);

            expect(activeRunManager.isActive(runId)).toBe(false);
            expect(activeRunManager.isAborted(runId)).toBe(false);

            // A fresh register for the same id is clean again.
            const signal2 = activeRunManager.register(runId, reset);
            expect(signal2.aborted).toBe(false);
        });
    });

    describe('AIService combined signals', () => {
        it('should support parentSignal in generateText and combine it', async () => {
            generateText.mockResolvedValueOnce({ text: 'mock text' });

            const parentController = new AbortController();
            await aiService.generateText({
                prompt: 'hello',
                provider: 'openai',
                model: 'gpt-4',
                parentSignal: parentController.signal,
            });

            expect(generateText).toHaveBeenCalled();
            const callArgs = generateText.mock.calls[0][0];
            expect(callArgs.abortSignal).toBeDefined();
            // Abort parent should abort the combined signal
            parentController.abort();
            expect(callArgs.abortSignal.aborted).toBe(true);
        });

        it('should support parentSignal in generateStructured and combine it', async () => {
            generateObject.mockResolvedValueOnce({ object: { success: true } });

            const parentController = new AbortController();
            await aiService.generateStructured({
                description: 'test description',
                schema: {},
                provider: 'openai',
                model: 'gpt-4',
                parentSignal: parentController.signal,
            });

            expect(generateObject).toHaveBeenCalled();
            const callArgs = generateObject.mock.calls[0][0];
            expect(callArgs.abortSignal).toBeDefined();
            parentController.abort();
            expect(callArgs.abortSignal.aborted).toBe(true);
        });

        it('should support parentSignal in validate and combine it', async () => {
            generateObject.mockResolvedValueOnce({
                object: { isValid: true, reason: 'ok', confidence: 0.9 },
            });

            const parentController = new AbortController();
            await aiService.validate({
                content: 'test content',
                criteria: 'test criteria',
                provider: 'openai',
                model: 'gpt-4',
                parentSignal: parentController.signal,
            });

            expect(generateObject).toHaveBeenCalled();
            const callArgs = generateObject.mock.calls[0][0];
            expect(callArgs.abortSignal).toBeDefined();
            parentController.abort();
            expect(callArgs.abortSignal.aborted).toBe(true);
        });
    });
});
