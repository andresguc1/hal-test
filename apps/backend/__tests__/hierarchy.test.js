import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User, Project, Canvas, Flow } from '../database/init.js';

const API_PREFIX = '/api';

describe('Data Hierarchy Integration', () => {
    beforeAll(async () => {
        const { initDb } = await import('../database/init.js');
        await initDb();
    }, 30000);
    // Note: initDb is called in app.js startServer.
    // For tests, we might need to ensure it's synced.

    it('POST /api/projects should create the full hierarchy (User > Project > Canvas > Flow)', async () => {
        const projectName = `Test Project ${Date.now()}`;
        const response = await request(app)
            .post(`${API_PREFIX}/projects`)
            .send({ name: projectName, description: 'Test Description' });

        expect(response.statusCode).toBe(201);
        expect(response.body.project).toBeDefined();
        expect(response.body.project.name).toBe(projectName);

        const project = response.body.project;
        expect(project.canvases).toBeDefined();
        expect(project.canvases.length).toBe(1);
        expect(project.canvases[0].name).toBe('Default Canvas');

        const canvas = project.canvases[0];
        expect(canvas.flows).toBeDefined();
        expect(canvas.flows.length).toBe(1);
        expect(canvas.flows[0].name).toBe('Main Flow');
        expect(canvas.flows[0].canvasId).toBe(canvas.id);

        // Verify relationship in DB directly for extra security
        const dbFlow = await Flow.findByPk(canvas.flows[0].id);
        expect(dbFlow.canvasId).toBe(canvas.id);
    }, 30000);

    it('GET /api/projects should return projects with their hierarchy', async () => {
        const response = await request(app).get(`${API_PREFIX}/projects`);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        if (response.body.length > 0) {
            const project = response.body[0];
            expect(project).toHaveProperty('canvases');
            if (project.canvases.length > 0) {
                expect(project.canvases[0]).toHaveProperty('flows');
            }
        }
    }, 30000);
});
