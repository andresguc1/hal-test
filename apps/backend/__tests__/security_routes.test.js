import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Security Route Registration and Validation', () => {
    it('should have registered POST /api/actions/csp_validator', async () => {
        const response = await request(app)
            .post('/api/actions/csp_validator')
            .send({ browserId: 'invalid-id-not-exist' });

        // Since it tries to find the browser session, it should either return 400 browser not found or similar
        // but it should NOT return 404 Route Not Found.
        expect(response.status).not.toBe(404);
        expect(response.body).toHaveProperty('success');
    }, 30000);

    it('should have registered POST /api/actions/header_auditor', async () => {
        const response = await request(app)
            .post('/api/actions/header_auditor')
            .send({ browserId: 'invalid-id-not-exist' });

        expect(response.status).not.toBe(404);
        expect(response.body).toHaveProperty('success');
    }, 30000);

    it('should have registered POST /api/actions/dom_sanitizer', async () => {
        const response = await request(app)
            .post('/api/actions/dom_sanitizer')
            .send({ browserId: 'invalid-id-not-exist' });

        expect(response.status).not.toBe(404);
        expect(response.body).toHaveProperty('success');
    }, 30000);
});
