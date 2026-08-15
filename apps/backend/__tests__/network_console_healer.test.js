import { describe, it, expect } from 'vitest';
import networkConsoleHealer from '../services/NetworkConsoleHealer.js';

describe('NetworkConsoleHealer Unit Tests', () => {
    it('should identify HTTP 500 network server error and recommend exponential backoff', () => {
        const analysis = networkConsoleHealer.analyzeError({
            statusCode: 500,
            errorMessage: 'Internal Server Error (500)',
            networkLogs: [{ url: '/api/checkout', status: 500 }],
        });

        expect(analysis.category).toBe('NETWORK_SERVER_ERROR');
        expect(analysis.strategy).toBe('RETRY_WITH_EXPONENTIAL_BACKOFF');
        expect(analysis.retryRecommended).toBe(true);
    });

    it('should identify CORS errors and suggest disabling web security', () => {
        const analysis = networkConsoleHealer.analyzeError({
            errorMessage: 'Access to XMLHttpRequest at API has been blocked by CORS policy',
        });

        expect(analysis.category).toBe('NETWORK_CORS_ERROR');
        expect(analysis.strategy).toBe('BYPASS_CORS_SECURITY_FLAG');
        expect(analysis.retryRecommended).toBe(true);
    });

    it('should classify non-fatal third party console errors', () => {
        const analysis = networkConsoleHealer.analyzeError({
            consoleLogs: [{ type: 'error', text: 'Uncaught TypeError: gtm.js failed to load' }],
        });

        expect(analysis.category).toBe('CONSOLE_RUNTIME_ERROR');
        expect(analysis.strategy).toBe('IGNORE_NON_FATAL_THIRD_PARTY');
        expect(analysis.retryRecommended).toBe(true);
    });

    it('should apply healing delay simulation on page', async () => {
        const mockPage = {
            waitForTimeout: async () => {},
            waitForLoadState: async () => {},
        };

        const result = await networkConsoleHealer.heal(
            mockPage,
            { statusCode: 500, errorMessage: 'Internal Error' },
            1,
        );

        expect(result.healed).toBe(true);
        expect(result.attempt).toBe(1);
        expect(result.backoffMs).toBe(1000);
    });
});
