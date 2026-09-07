import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import AIUsageLog from '../database/models/AIUsageLog.js';

describe('AI Usage Dashboard Endpoints', () => {
    beforeAll(async () => {
        await AIUsageLog.sync();
        await AIUsageLog.destroy({ where: {} });
        await AIUsageLog.bulkCreate([
            {
                task_type: 'extraction',
                provider: 'ollama',
                model: 'gemma3:2b',
                prompt_tokens: 2500,
                completion_tokens: 180,
                total_tokens: 2680,
                latency_ms: 900,
                success: true,
                node_id: 'n1',
                run_id: 'r1',
            },
            {
                task_type: 'healing',
                provider: 'openrouter',
                model: 'gpt-4o-mini',
                prompt_tokens: 500,
                completion_tokens: 90,
                total_tokens: 590,
                latency_ms: 500,
                success: true,
                node_id: 'n2',
                run_id: 'r1',
            },
            {
                task_type: 'extraction',
                provider: 'ollama',
                model: 'gemma3:2b',
                prompt_tokens: 3000,
                completion_tokens: 200,
                total_tokens: 3200,
                latency_ms: 1100,
                success: false,
                node_id: 'n3',
                run_id: 'r1',
            },
        ]);
    });

    afterAll(async () => {
        await AIUsageLog.destroy({ where: {} });
    });

    it('GET /api/ai/usage/summary returns aggregates', async () => {
        const res = await request(app).get('/api/ai/usage/summary');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalCalls).toBe(3);
        expect(res.body.data.successCount).toBe(2);
        expect(res.body.data.totalTokens).toBe(6470);
        expect(res.body.data.inputTokens).toBe(6000);
        expect(res.body.data.outputTokens).toBe(470);
        expect(res.body.data.avgLatencyMs).toBeGreaterThan(0);
        expect(res.body.data.byTaskType).toHaveLength(2);
        expect(res.body.data.byProvider).toHaveLength(2);
        expect(res.body.data.dailyTrend.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/ai/usage returns recent logs', async () => {
        const res = await request(app).get('/api/ai/usage?limit=10');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.logs).toHaveLength(3);
        expect(res.body.total).toBe(3);
        expect(res.body.logs[0]).toHaveProperty('taskType');
        expect(res.body.logs[0]).toHaveProperty('totalTokens');
        expect(res.body.logs[0]).toHaveProperty('latencyMs');
        expect(res.body.logs[0]).toHaveProperty('success');
    });

    it('GET /api/ai/usage filters by taskType', async () => {
        const res = await request(app).get('/api/ai/usage?taskType=extraction');
        expect(res.status).toBe(200);
        expect(res.body.logs).toHaveLength(2);
        expect(res.body.logs.every((l) => l.taskType === 'extraction')).toBe(true);
    });

    it('GET /api/ai/usage filters by success', async () => {
        const res = await request(app).get('/api/ai/usage?success=false');
        expect(res.status).toBe(200);
        expect(res.body.logs).toHaveLength(1);
        expect(res.body.logs[0].success).toBe(false);
    });

    it('DELETE /api/ai/usage clears metrics', async () => {
        const res = await request(app).delete('/api/ai/usage');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.deleted).toBe(3);

        const after = await request(app).get('/api/ai/usage/summary');
        expect(after.body.data.totalCalls).toBe(0);
    });
});
