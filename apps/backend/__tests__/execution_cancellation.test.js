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
            expect(activeRunManager.isActive(runId)).toBe(false);
        });

        it('should return false when aborting non-existent run', () => {
            expect(activeRunManager.abort('non_existent')).toBe(false);
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
