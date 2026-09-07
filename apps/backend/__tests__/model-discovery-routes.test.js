import { describe, it, expect, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import aiService from '../services/AIService.js';

describe('POST /api/ai/discover-models', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('400 for unsupported provider', async () => {
        const res = await request(app)
            .post('/api/ai/discover-models')
            .send({ provider: 'nah', apiKey: 'k', baseUrl: 'http://127.0.0.1:1' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('400 for cloud provider without apiKey', async () => {
        const res = await request(app)
            .post('/api/ai/discover-models')
            .send({ provider: 'openai', baseUrl: 'https://api.openai.com' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns REJECTED for a disallowed host (SSRF scoped guard)', async () => {
        const res = await request(app)
            .post('/api/ai/discover-models')
            .send({ provider: 'openai', apiKey: 'sk-test', baseUrl: 'https://evil.example.com' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.state).toBe('REJECTED');
        expect(res.body.models).toEqual([]);
        expect(res.body.error).toContain('HALTEST_ALLOWED_AI_BASE_URLS');
    });

    it('allows loopback base URLs and delegates to AIService.discoverModels', async () => {
        const spy = vi.spyOn(aiService, 'discoverModels').mockResolvedValue({
            provider: 'ollama',
            baseUrl: 'http://127.0.0.1:11434',
            state: 'SUCCESS',
            models: [{ id: 'gemma3:2b', label: 'gemma3:2b', source: 'native' }],
            error: null,
        });

        const res = await request(app)
            .post('/api/ai/discover-models')
            .send({ provider: 'ollama', apiKey: 'ollama', baseUrl: 'http://127.0.0.1:11434/v1' });

        expect(res.status).toBe(200);
        expect(res.body.state).toBe('SUCCESS');
        expect(res.body.models[0].id).toBe('gemma3:2b');
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({ provider: 'ollama', baseUrl: 'http://127.0.0.1:11434' }),
        );
    });

    it('allows known cloud hosts (OpenAI) and returns models', async () => {
        vi.spyOn(aiService, 'discoverModels').mockResolvedValue({
            provider: 'openai',
            baseUrl: 'https://api.openai.com',
            state: 'SUCCESS',
            models: [{ id: 'gpt-4o-mini', label: 'gpt-4o-mini', source: 'openai-compatible' }],
            error: null,
        });

        const res = await request(app)
            .post('/api/ai/discover-models')
            .send({ provider: 'openai', apiKey: 'sk-test', baseUrl: 'https://api.openai.com/v1' });

        expect(res.status).toBe(200);
        expect(res.body.state).toBe('SUCCESS');
        expect(res.body.models[0].id).toBe('gpt-4o-mini');
    });
});
