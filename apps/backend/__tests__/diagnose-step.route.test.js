import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../database/init.js', () => ({
    Run: { findByPk: vi.fn() },
    StepResult: { findByPk: vi.fn() },
}));

vi.mock('../services/AIService.js', () => ({
    default: { generateText: vi.fn() },
}));

vi.mock('../services/LLMFactory.js', () => ({
    DEFAULT_LOCAL_MODEL: 'gemma3:2b',
}));

// Heavy route dependencies pulled in by ai.routes.js — stub them so the test
// stays isolated from browser/playwright and sibling controllers.
vi.mock('../controllers/chat.controller.js', () => ({
    chatWithTools: (_req, res) => res.json({}),
}));
vi.mock('../services/browser.service.js', () => ({ browserService: {} }));
vi.mock('../services/SelectorHealer.js', () => ({ default: {} }));
vi.mock('../controllers/aiUsage.controller.js', () => ({
    getAiUsageSummary: (_req, res) => res.json({}),
    getAiUsageLogs: (_req, res) => res.json({}),
    clearAiUsage: (_req, res) => res.json({}),
}));
vi.mock('../controllers/aiDiscovery.controller.js', () => ({
    discoverAiModels: (_req, res) => res.json({}),
}));

import { Run, StepResult } from '../database/init.js';
import aiService from '../services/AIService.js';
import aiRouter from '../routes/ai.routes.js';

const app = express();
app.use(express.json());
app.use('/api/ai', aiRouter);

describe('POST /api/ai/diagnose-step', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('400 when runId or stepId is missing', async () => {
        const res = await request(app).post('/api/ai/diagnose-step').send({ runId: 'r1' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('404 when the run does not exist', async () => {
        Run.findByPk.mockResolvedValue(null);
        const res = await request(app)
            .post('/api/ai/diagnose-step')
            .send({ runId: 'r1', stepId: 's1' });
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it('404 when the step does not belong to the run', async () => {
        Run.findByPk.mockResolvedValue({ id: 'r1', flow_name: 'Flow' });
        StepResult.findByPk.mockResolvedValue({ run_id: 'other', update: vi.fn() });
        const res = await request(app)
            .post('/api/ai/diagnose-step')
            .send({ runId: 'r1', stepId: 's1' });
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });

    it('persists the trimmed diagnosis and passes observed facts to the AI', async () => {
        Run.findByPk.mockResolvedValue({ id: 'r1', flow_name: 'Checkout' });
        const update = vi.fn().mockResolvedValue();
        StepResult.findByPk.mockResolvedValue({
            run_id: 'r1',
            node_type: 'click',
            label: 'Click Pay',
            status: 'failed',
            error: 'Timeout 30s',
            input_data: { selector: '#pay' },
            output_data: null,
            duration_ms: 30000,
            update,
        });
        aiService.generateText.mockResolvedValue({ text: '  Root cause: selector missing.  ' });

        const res = await request(app)
            .post('/api/ai/diagnose-step')
            .send({ runId: 'r1', stepId: 's1' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.ai_diagnosis).toBe('Root cause: selector missing.');
        expect(update).toHaveBeenCalledWith({ ai_diagnosis: 'Root cause: selector missing.' });

        const prompt = aiService.generateText.mock.calls[0][0].prompt;
        expect(prompt).toContain('Timeout 30s');
        expect(prompt).toContain('Click Pay');
    });

    it('503 with a helpful message when the provider is unreachable', async () => {
        Run.findByPk.mockResolvedValue({ id: 'r1', flow_name: 'Flow' });
        StepResult.findByPk.mockResolvedValue({
            run_id: 'r1',
            node_type: 'click',
            update: vi.fn(),
        });
        aiService.generateText.mockRejectedValue(new Error('fetch failed'));

        const res = await request(app)
            .post('/api/ai/diagnose-step')
            .send({ runId: 'r1', stepId: 's1' });

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('AI provider');
    });
});
