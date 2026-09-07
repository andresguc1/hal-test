import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import modelDiscoveryService from '../services/discovery/index.js';

function jsonResponse(body, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        async json() {
            return body;
        },
    };
}

describe('ModelDiscoveryService', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('toDiscoveryBase strips /v1 and /v1beta and normalizes localhost', () => {
        expect(modelDiscoveryService.toDiscoveryBase('http://localhost:11434/v1')).toBe(
            'http://127.0.0.1:11434',
        );
        expect(modelDiscoveryService.toDiscoveryBase('https://api.openai.com/v1')).toBe(
            'https://api.openai.com',
        );
        expect(modelDiscoveryService.toDiscoveryBase('https://api.anthropic.com/v1')).toBe(
            'https://api.anthropic.com',
        );
        expect(
            modelDiscoveryService.toDiscoveryBase(
                'https://generativelanguage.googleapis.com/v1beta',
            ),
        ).toBe('https://generativelanguage.googleapis.com');
        expect(modelDiscoveryService.toDiscoveryBase('http://127.0.0.1:11434')).toBe(
            'http://127.0.0.1:11434',
        );
        expect(modelDiscoveryService.toDiscoveryBase('')).toBe('');
    });

    it('ollama: reuses native /api/tags through healthCheck', async () => {
        const healthCheck = async () => ({
            ollamaRunning: true,
            modelLoaded: false,
            models: ['phi4:mini', 'gemma3:2b'],
            error: null,
        });
        const result = await modelDiscoveryService.discoverModels({
            provider: 'ollama',
            apiKey: 'ollama',
            baseUrl: 'http://127.0.0.1:11434/v1',
            healthCheck,
        });
        expect(result.state).toBe('SUCCESS');
        expect(result.baseUrl).toBe('http://127.0.0.1:11434');
        expect(result.models.map((m) => m.id)).toEqual(['gemma3:2b', 'phi4:mini']);
        expect(result.models[0].source).toBe('native');
    });

    it('ollama: native models carry byte size from healthCheck.modelSizes', async () => {
        const healthCheck = async () => ({
            ollamaRunning: true,
            modelLoaded: false,
            models: ['gemma4:26b', 'gemma3:2b'],
            modelSizes: { 'gemma4:26b': 16_700_000_000, 'gemma3:2b': 1_700_000_000 },
            error: null,
        });
        const result = await modelDiscoveryService.discoverModels({
            provider: 'ollama',
            apiKey: 'ollama',
            baseUrl: 'http://127.0.0.1:11434',
            healthCheck,
        });
        expect(result.state).toBe('SUCCESS');
        const byId = Object.fromEntries(result.models.map((m) => [m.id, m]));
        expect(byId['gemma3:2b'].size).toBe(1_700_000_000);
        expect(byId['gemma4:26b'].size).toBe(16_700_000_000);
    });

    it('ollama: falls back to OpenAI-compatible /v1/models when tags unavailable', async () => {
        let calledUrl = '';
        vi.stubGlobal(
            'fetch',
            vi.fn((url) => {
                calledUrl = String(url);
                return Promise.resolve(
                    jsonResponse({ data: [{ id: 'qwen2.5:7b' }, { id: 'llama3.1:8b' }] }),
                );
            }),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'ollama',
            apiKey: 'ollama',
            baseUrl: 'http://127.0.0.1:9999',
            healthCheck: async () => ({ ollamaRunning: false, models: [], error: null }),
        });
        expect(result.state).toBe('SUCCESS');
        expect(calledUrl).toBe('http://127.0.0.1:9999/v1/models');
        expect(result.models.map((m) => m.id)).toEqual(['llama3.1:8b', 'qwen2.5:7b']);
    });

    it('openai: lists GET /v1/models with Bearer auth', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((url, opts) => {
                expect(String(url)).toBe('https://api.openai.com/v1/models');
                expect(opts.headers.Authorization).toBe('Bearer sk-test');
                return Promise.resolve(
                    jsonResponse({
                        data: [
                            { id: 'gpt-4o-mini', owned_by: 'openai' },
                            { id: 'gpt-4o', owned_by: 'openai' },
                        ],
                    }),
                );
            }),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'openai',
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1',
        });
        expect(result.state).toBe('SUCCESS');
        expect(result.models.map((m) => m.id)).toEqual(['gpt-4o', 'gpt-4o-mini']);
        expect(result.models[0].ownedBy).toBe('openai');
    });

    it('openrouter: lists GET /v1/models', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve(jsonResponse({ data: [{ id: 'google/gemini-2.0-flash-001' }] })),
            ),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'openrouter',
            apiKey: 'sk-or',
            baseUrl: 'https://openrouter.ai/api/v1',
        });
        expect(result.state).toBe('SUCCESS');
        expect(result.models[0].id).toBe('google/gemini-2.0-flash-001');
    });

    it('anthropic: sends x-api-key + anthropic-version headers', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((url, opts) => {
                expect(String(url)).toBe('https://api.anthropic.com/v1/models');
                expect(opts.headers['x-api-key']).toBe('sk-ant-test');
                expect(opts.headers['anthropic-version']).toBe('2023-06-01');
                return Promise.resolve(
                    jsonResponse({
                        data: [
                            {
                                id: 'claude-3-5-sonnet-latest',
                                display_name: 'Claude 3.5 Sonnet',
                            },
                        ],
                    }),
                );
            }),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'anthropic',
            apiKey: 'sk-ant-test',
            baseUrl: 'https://api.anthropic.com/v1',
        });
        expect(result.state).toBe('SUCCESS');
        expect(result.models[0].label).toBe('Claude 3.5 Sonnet');
        expect(result.models[0].source).toBe('anthropic-native');
    });

    it('google: strips models/ prefix and sends key query', async () => {
        let calledUrl = '';
        vi.stubGlobal(
            'fetch',
            vi.fn((url) => {
                calledUrl = String(url);
                return Promise.resolve(
                    jsonResponse({
                        models: [
                            { name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
                            { name: 'models/gemma-3-27b-it', displayName: 'Gemma 3 27B' },
                        ],
                    }),
                );
            }),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'google',
            apiKey: 'AIza-test',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        });
        expect(calledUrl).toContain('/models?key=AIza-test');
        expect(result.state).toBe('SUCCESS');
        const ids = result.models.map((m) => m.id);
        expect(ids).toContain('gemma-3-27b-it');
        expect(ids).toContain('gemini-2.0-flash');
        const sorted = [...ids].sort((a, b) => a.localeCompare(b));
        expect(ids).toEqual(sorted);
        expect(result.models.find((m) => m.id === 'gemma-3-27b-it').label).toBe('Gemma 3 27B');
    });

    it('maps 401 to UNAUTHORIZED', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(jsonResponse({ error: {} }, 401))),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'openai',
            apiKey: 'bad',
            baseUrl: 'https://api.openai.com',
        });
        expect(result.state).toBe('UNAUTHORIZED');
        expect(result.models).toEqual([]);
    });

    it('maps 404 to NOT_SUPPORTED', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(jsonResponse({}, 404))),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'custom',
            apiKey: 'k',
            baseUrl: 'http://127.0.0.1:9999',
        });
        expect(result.state).toBe('NOT_SUPPORTED');
    });

    it('maps network failure to CONNECTION_REFUSED', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.reject(
                    Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNREFUSED' } }),
                ),
            ),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'openai',
            apiKey: 'k',
            baseUrl: 'https://api.openai.com',
        });
        expect(result.state).toBe('CONNECTION_REFUSED');
    });

    it('maps abort/timout to TIMEOUT', async () => {
        modelDiscoveryService.register({
            provider: 'slowtest',
            timeoutMs: 20,
            listModels: ({ signal }) =>
                new Promise((_, reject) => {
                    signal.addEventListener('abort', () => {
                        const err = new Error('The operation was aborted');
                        err.name = 'AbortError';
                        reject(err);
                    });
                }),
        });
        const result = await modelDiscoveryService.discoverModels({
            provider: 'slowtest',
            apiKey: 'k',
            baseUrl: '',
        });
        expect(result.state).toBe('TIMEOUT');
    });

    it('unknown provider → NOT_SUPPORTED', async () => {
        const result = await modelDiscoveryService.discoverModels({
            provider: 'groq',
            apiKey: 'k',
            baseUrl: 'https://example.com',
        });
        expect(result.state).toBe('NOT_SUPPORTED');
    });

    it('smallestLocalModels: ranks installed models by byte size ascending', async () => {
        const { smallestLocalModels } = await import('../services/LLMFactory.js');
        const modelInfos = [
            { id: 'gemma4:26b', name: 'gemma4:26b', size: 16_700_000_000 },
            { id: 'phi4:mini', name: 'phi4:mini', size: 2_600_000_000 },
            { id: 'gemma3:2b', name: 'gemma3:2b', size: 1_700_000_000 },
            { id: 'qwen2.5:7b', name: 'qwen2.5:7b', size: 4_700_000_000 },
        ];
        expect(smallestLocalModels(modelInfos, { limit: 3 })).toEqual([
            'gemma3:2b',
            'phi4:mini',
            'qwen2.5:7b',
        ]);
    });

    it('smallestLocalModels: falls back to static list when no size metadata', async () => {
        const { smallestLocalModels, RECOMMENDED_LOCAL_MODELS } =
            await import('../services/LLMFactory.js');
        expect(smallestLocalModels([{ id: 'foo', name: 'foo', size: 0 }])).toEqual(
            RECOMMENDED_LOCAL_MODELS,
        );
    });

    it('empty list → NO_MODELS_FOUND', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(jsonResponse({ data: [] }))),
        );
        const result = await modelDiscoveryService.discoverModels({
            provider: 'openai',
            apiKey: 'k',
            baseUrl: 'https://api.openai.com',
        });
        expect(result.state).toBe('NO_MODELS_FOUND');
    });
});
