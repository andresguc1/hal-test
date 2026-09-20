import { describe, it, expect, vi, beforeEach } from 'vitest';
import selectorHealer from '../services/SelectorHealer.js';
import aiService from '../services/AIService.js';

describe('SelectorHealer — deterministic gate (F0-F2)', () => {
    beforeEach(() => {
        vi.spyOn(aiService, 'healSelector').mockResolvedValue({
            correctedSelector: null,
            confidence: 0,
        });
    });

    it('heals with a deterministic testid candidate without calling the LLM', async () => {
        const page = {
            isClosed: () => false,
            evaluate: vi
                .fn()
                .mockResolvedValueOnce('ref:0|tag:button|testId:login-btn|text:Login')
                .mockResolvedValue({
                    count: 1,
                    valid: true,
                    unique: true,
                    visible: true,
                }),
            url: () => 'https://example.com/login',
        };

        const result = await selectorHealer.heal({
            page,
            originalSelector: 'button[data-testid="login"]',
            errorMessage: 'Element not found',
            actionName: 'click',
            aiConfig: {},
        });

        expect(result.correctedSelector).toBe('[data-testid="login-btn"]');
        expect(result.source).toBe('deterministic');
        expect(result.policyAction).toBe('AUTO');
        expect(result.verified).toBe(true);
        expect(aiService.healSelector).not.toHaveBeenCalled();
    });

    it('falls back to LLM when no deterministic candidate verifies', async () => {
        const page = {
            isClosed: () => false,
            evaluate: vi.fn(async (fn) => {
                if (typeof fn === 'function') return '';
                return '';
            }),
            url: () => 'https://example.com/x',
        };

        const result = await selectorHealer.heal({
            page,
            originalSelector: '#nope',
            errorMessage: 'not found',
            actionName: 'click',
            aiConfig: { provider: 'ollama' },
        });

        // No signal -> no deterministic heal; LLM returns null -> all tiers fail
        expect(result.correctedSelector).toBeNull();
        expect(aiService.healSelector).toHaveBeenCalled();
    });
});
