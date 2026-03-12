import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../app.js';

const api = request(app);

describe('Refactored Implementation Verification', () => {
    let browserId;

    it('should check server status', async () => {
        const res = await api.get('/api/status');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('should launch a browser', async () => {
        const res = await api.post('/api/actions/launch_browser').send({
            browserType: 'chromium',
            headless: true,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.browserId).toBeDefined();
        browserId = res.body.browserId;
    });

    it('should create a context', async () => {
        const res = await api.post('/api/actions/create_context').send({ browserId });
        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
    });

    it('should set cookies', async () => {
        const cookies = [{ name: 'test_cookie', value: '123', url: 'https://example.com' }];
        const res = await api.post('/api/actions/manage_cookies').send({
            browserId,
            action: 'set',
            cookiesData: JSON.stringify(cookies), // Schema expects JSON string
        });
        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
    });

    it('should get cookies', async () => {
        const res = await api.post('/api/actions/manage_cookies').send({
            browserId,
            action: 'get',
            variableName: 'cookies', // Required for get action
        });
        expect(res.status).toBe(200);
        expect(res.body.data.cookies).toBeDefined();
        // Note: Cookies might be empty if we haven't visited the domain,
        // but the action should succeed.
    });

    it('should mock a response', async () => {
        const res = await api.post('/api/actions/mock_response').send({
            browserId,
            urlPattern: '**/api/mocked',
            status: 200,
            responseBody: { mocked: true }, // Schema expects responseBody
        });
        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
    });

    it('should open a URL', async () => {
        // Using example.com as a safe target
        const res = await api.post('/api/actions/open_url').send({
            browserId,
            url: 'https://example.com',
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should read data (text)', async () => {
        const res = await api.post('/api/actions/get_set_content').send({
            browserId,
            selector: 'body',
            action: 'get',
            contentType: 'text',
            variableName: 'bodyText',
        });
        expect(res.status).toBe(200);
    });

    it('should close the context', async () => {
        const res = await api.post('/api/actions/close_context').send({ browserId });
        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined(); // Robust against translation changes
    });

    it('should close the browser', async () => {
        const res = await api.post('/api/actions/close_browser').send({ browserId });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // Test stubs
    it.skip('should call LLM action (stub)', async () => {
        // Skip this test in typical check as it requires a real provider or properly mocked AI service
        // Since we are validating local headless, we mock it gracefully if the schema allows
        const res = await api.post('/api/actions/call_llm').send({
            prompt: 'Hello',
            variableName: 'llmResponse',
            provider: 'openai',
        });
        // Just expect it to be processed (even if it 500s due to missing key, we know the endpoint is alive)
        expect(res.status).toBeGreaterThanOrEqual(200);
    });
});
