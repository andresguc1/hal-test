import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { Project, Flow, Run } from '../database/init.js';

const API_PREFIX = '/api';

// Reproduces the "FOREIGN KEY constraint failed" 500 that occurred when
// deleting a flow (or its project) that had execution_runs referencing it.
// execution_runs.flow_id is a SQLite FK with NO ACTION and no Sequelize
// association cascade, so the delete routes must detach those references.

let project;

beforeAll(async () => {
    project = await Project.create({ name: `DeleteFK Test ${Date.now()}` });
});

afterAll(async () => {
    if (project) {
        await Run.destroy({ where: { project_id: project.id } });
        await Flow.destroy({ where: { projectId: project.id } });
        await Project.destroy({ where: { id: project.id } });
    }
});

const createFlowWithRuns = async (name) => {
    const flow = await Flow.create({
        name,
        projectId: project.id,
        type: 'main',
    });
    const run = await Run.create({
        flow_id: flow.id,
        project_id: project.id,
        flow_name: name,
        status: 'completed',
    });
    return { flow, run };
};

describe('DELETE flow with execution_runs', () => {
    it('deletes the flow and preserves run history by nulling flow_id', async () => {
        const { flow, run } = await createFlowWithRuns('Flow With Runs');

        const res = await request(app).delete(
            `${API_PREFIX}/projects/${project.id}/flows/${flow.id}`,
        );

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Flow deleted');

        const deleted = await Flow.findByPk(flow.id);
        expect(deleted).toBeNull();

        const preservedRun = await Run.findByPk(run.id);
        expect(preservedRun).not.toBeNull();
        expect(preservedRun.flow_id).toBeNull();
    });
});

describe('DELETE project with execution_runs', () => {
    it('deletes the project (and its flows) even when runs reference them', async () => {
        const tempProject = await Project.create({
            name: `DeleteFK Bulk ${Date.now()}`,
        });
        const flow = await Flow.create({
            name: 'Bulk Flow',
            projectId: tempProject.id,
            type: 'main',
        });
        const run = await Run.create({
            flow_id: flow.id,
            project_id: tempProject.id,
            flow_name: 'Bulk Flow',
            status: 'completed',
        });

        const res = await request(app).delete(`${API_PREFIX}/projects/${tempProject.id}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Project deleted');

        expect(await Project.findByPk(tempProject.id)).toBeNull();
        expect(await Flow.findByPk(flow.id)).toBeNull();

        const preservedRun = await Run.findByPk(run.id);
        expect(preservedRun).not.toBeNull();
        expect(preservedRun.flow_id).toBeNull();

        await Run.destroy({ where: { id: run.id } });
    });

    it('bulk-deletes projects even when runs reference their flows', async () => {
        const p1 = await Project.create({ name: `Bulk A ${Date.now()}` });
        const p2 = await Project.create({ name: `Bulk B ${Date.now()}` });
        const f1 = await Flow.create({ name: 'Bulk A Flow', projectId: p1.id, type: 'main' });
        const f2 = await Flow.create({ name: 'Bulk B Flow', projectId: p2.id, type: 'main' });
        const r1 = await Run.create({ flow_id: f1.id, project_id: p1.id, status: 'completed' });
        const r2 = await Run.create({ flow_id: f2.id, project_id: p2.id, status: 'completed' });

        const res = await request(app)
            .delete(`${API_PREFIX}/projects/bulk`)
            .send({ projectIds: [p1.id, p2.id] });

        expect(res.status).toBe(200);
        expect(res.body.deleted).toBe(2);

        expect(await Project.findByPk(p1.id)).toBeNull();
        expect(await Project.findByPk(p2.id)).toBeNull();

        const pr1 = await Run.findByPk(r1.id);
        const pr2 = await Run.findByPk(r2.id);
        expect(pr1.flow_id).toBeNull();
        expect(pr2.flow_id).toBeNull();

        await Run.destroy({ where: { id: [r1.id, r2.id] } });
    });
});
