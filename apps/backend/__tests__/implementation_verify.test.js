import request from 'supertest';
import { describe, it, expect } from 'vitest';

const baseUrl = 'http://localhost:2001';
const api = request(baseUrl);

describe('Refactored Implementation Verification', () => {
    let browserId;

    it('should check server status', async () => {
        const res = await api.get('/api/status');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });

    it('should launch a browser', async () => {
        const res = await api.post('/api/actions/launch_browser').send({ headless: true });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.browserId).toBeDefined();
        browserId = res.body.browserId;
    });

    it('should create a context', async () => {
        const res = await api.post('/api/actions/create_context').send({ browserId });
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Contexto verificado/creado');
    });

    it('should set cookies', async () => {
        const cookies = [{ name: 'test_cookie', value: '123', domain: 'example.com', path: '/' }];
        const res = await api.post('/api/actions/manage_cookies').send({
            browserId,
            action: 'set',
            cookies,
        });
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Cookies establecidas');
    });

    it('should get cookies', async () => {
        const res = await api.post('/api/actions/manage_cookies').send({
            browserId,
            action: 'get',
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
            body: { mocked: true },
        });
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Mock configurado');
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
        const res = await api.post('/api/actions/read_data').send({
            browserId,
            selector: 'h1',
            type: 'text',
        });
        expect(res.status).toBe(200);
        expect(res.body.data.content).toBeDefined();
    });

    it('should close the context', async () => {
        const res = await api.post('/api/actions/close_context').send({ browserId });
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Contexto cerrado');
    });

    it('should close the browser', async () => {
        const res = await api.post('/api/actions/close_browser').send({ browserId });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // Test stubs
    it('should call LLM action (stub)', async () => {
        const res = await api.post('/api/actions/call_llm').send({ prompt: 'Hello' });
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Simulado');
    });
});
