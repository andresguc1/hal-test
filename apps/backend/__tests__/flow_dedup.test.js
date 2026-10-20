import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { Project, Flow } from '../database/init.js';
import {
    computeContentHash,
    ensureUniqueFlow,
    resolveUniqueName,
} from '../services/FlowDeduplicator.js';

const API_PREFIX = '/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeNodes = (prefix = 'n') => [
    { id: `${prefix}1`, type: 'input', data: { label: 'Start' }, position: { x: 0, y: 0 } },
    {
        id: `${prefix}2`,
        type: 'click',
        data: { label: 'Click', selector: '#a' },
        position: { x: 10, y: 20 },
    },
];

const makeEdges = (prefix = 'n') => [
    { id: `${prefix}e1`, source: `${prefix}1`, target: `${prefix}2` },
];

let testProject;

beforeAll(async () => {
    testProject = await Project.create({ name: `Dedup Test Project ${Date.now()}` });
});

afterAll(async () => {
    if (testProject) {
        await Flow.destroy({ where: { projectId: testProject.id } });
        await Project.destroy({ where: { id: testProject.id } });
    }
});

// ---------------------------------------------------------------------------
// Unit: computeContentHash
// ---------------------------------------------------------------------------

describe('FlowDeduplicator - computeContentHash', () => {
    it('produces the same hash for identical content', () => {
        const a = computeContentHash(makeNodes(), makeEdges());
        const b = computeContentHash(makeNodes(), makeEdges());
        expect(a).toBe(b);
    });

    it('ignores node positions (re-import at different offset still matches)', () => {
        const nodesA = makeNodes();
        const nodesB = makeNodes().map((n) => ({ ...n, position: { x: 999, y: 999 } }));
        expect(computeContentHash(nodesA, makeEdges())).toBe(
            computeContentHash(nodesB, makeEdges()),
        );
    });

    it('ignores array order of nodes and edges', () => {
        const nodes = makeNodes();
        const edges = makeEdges();
        const reordered = [...nodes].reverse();
        expect(computeContentHash(nodes, edges)).toBe(
            computeContentHash(reordered, [...edges].reverse()),
        );
    });

    it('produces different hashes for different content', () => {
        const a = computeContentHash(makeNodes(), makeEdges());
        const b = computeContentHash(
            makeNodes().map((n) => ({ ...n, data: { ...n.data, label: 'Other' } })),
            makeEdges(),
        );
        expect(a).not.toBe(b);
    });

    it('handles empty inputs deterministically', () => {
        expect(computeContentHash([], [])).toBe(computeContentHash([], []));
        expect(computeContentHash()).toBe(computeContentHash([], []));
    });
});

// ---------------------------------------------------------------------------
// Unit: ensureUniqueFlow
// ---------------------------------------------------------------------------

describe('FlowDeduplicator - ensureUniqueFlow', () => {
    it('returns action=create for a brand-new flow', async () => {
        const decision = await ensureUniqueFlow({
            projectId: testProject.id,
            type: 'component',
            name: `Unique ${Date.now()}`,
            nodes: makeNodes(),
            edges: makeEdges(),
        });
        expect(decision.action).toBe('create');
        expect(decision.contentHash).toBeTypeOf('string');
    });

    it('returns action=reuse for identical content already in the project', async () => {
        const name = `Reusable ${Date.now()}`;
        const nodes = makeNodes();
        const edges = makeEdges();
        const contentHash = computeContentHash(nodes, edges);

        const created = await Flow.create({
            name,
            projectId: testProject.id,
            type: 'component',
            contentHash,
        });

        const decision = await ensureUniqueFlow({
            projectId: testProject.id,
            type: 'component',
            name,
            nodes,
            edges,
        });

        expect(decision.action).toBe('reuse');
        expect(decision.existingFlowId).toBe(created.id);
    });

    it('renames (action=create + suffixed name) when the name collides but content differs', async () => {
        const name = `Collision ${Date.now()}`;
        await Flow.create({
            name,
            projectId: testProject.id,
            type: 'component',
            contentHash: computeContentHash(makeNodes('x'), makeEdges('x')),
        });

        const decision = await ensureUniqueFlow({
            projectId: testProject.id,
            type: 'component',
            name,
            nodes: makeNodes('y'),
            edges: makeEdges('y'),
        });

        expect(decision.action).toBe('create');
        expect(decision.name).toBe(`${name} (1)`);
    });

    it('scopes uniqueness by type: same name in different types does not collide', async () => {
        const name = `Scoped ${Date.now()}`;
        await Flow.create({
            name,
            projectId: testProject.id,
            type: 'main',
            contentHash: computeContentHash(makeNodes('m'), makeEdges('m')),
        });

        const decision = await ensureUniqueFlow({
            projectId: testProject.id,
            type: 'component',
            name,
            nodes: makeNodes('c'),
            edges: makeEdges('c'),
        });

        expect(decision.action).toBe('create');
        expect(decision.name).toBe(name);
    });
});

// ---------------------------------------------------------------------------
// Unit: resolveUniqueName
// ---------------------------------------------------------------------------

describe('FlowDeduplicator - resolveUniqueName', () => {
    it('returns the desired name when free', async () => {
        const name = `Free ${Date.now()}`;
        expect(await resolveUniqueName(testProject.id, 'loop', name)).toBe(name);
    });

    it('appends (1) when the name is taken', async () => {
        const name = `Taken ${Date.now()}`;
        await Flow.create({ name, projectId: testProject.id, type: 'loop' });
        expect(await resolveUniqueName(testProject.id, 'loop', name)).toBe(`${name} (1)`);
    });
});

// ---------------------------------------------------------------------------
// Integration: V3 flow-package import is idempotent
// ---------------------------------------------------------------------------

describe('Import /flow-package is idempotent', () => {
    const buildPackage = () => {
        const componentNodes = [
            { id: 'c1', type: 'input', data: { label: 'In' }, position: { x: 0, y: 0 } },
            {
                id: 'c2',
                type: 'click',
                data: { label: 'Go', selector: '#go' },
                position: { x: 5, y: 5 },
            },
        ];
        const mainNodes = [
            { id: 'm1', type: 'input', data: { label: 'Start' }, position: { x: 0, y: 0 } },
            {
                id: 'm2',
                type: 'component',
                data: { label: 'MyComp', flowId: 'src-comp' },
                position: { x: 50, y: 50 },
            },
            { id: 'm3', type: 'output', data: { label: 'End' }, position: { x: 100, y: 100 } },
        ];
        return {
            flow: {
                name: `Package Flow ${Date.now()}`,
                type: 'main',
                nodes: mainNodes,
                edges: [
                    { id: 'me1', source: 'm1', target: 'm2' },
                    { id: 'me2', source: 'm2', target: 'm3' },
                ],
            },
            dependencies: {
                components: [
                    {
                        id: 'src-comp',
                        name: `PackComp ${Date.now()}`,
                        type: 'component',
                        nodes: componentNodes,
                        edges: [{ id: 'ce1', source: 'c1', target: 'c2' }],
                    },
                ],
            },
        };
    };

    it('does not create duplicate components or flows on a second import', async () => {
        const pkg = buildPackage();

        const first = await request(app)
            .post(`${API_PREFIX}/import/flow-package/${testProject.id}`)
            .send(pkg);
        expect(first.statusCode).toBe(201);
        expect(first.body.success).toBe(true);

        const countAfterFirst = await Flow.count({ where: { projectId: testProject.id } });

        const second = await request(app)
            .post(`${API_PREFIX}/import/flow-package/${testProject.id}`)
            .send(pkg);
        expect([200, 201]).toContain(second.statusCode);
        expect(second.body.success).toBe(true);

        const countAfterSecond = await Flow.count({ where: { projectId: testProject.id } });

        // Second import must not add any flow rows (all reused)
        expect(countAfterSecond).toBe(countAfterFirst);

        // Reused component should be flagged and point to the first component
        const reusedComp = (second.body.components || []).find((c) => c.reused);
        expect(reusedComp).toBeTruthy();
        expect(reusedComp.newId).toBe(first.body.components[0].newId);
    });
});

// ---------------------------------------------------------------------------
// Integration: import-subflow is idempotent
// ---------------------------------------------------------------------------

describe('Import /flows/import-subflow is idempotent', () => {
    it('reuses the existing component when the same subflow is imported twice', async () => {
        const flowJson = {
            name: `Subflow ${Date.now()}`,
            nodes: [
                { id: 's1', type: 'input', data: { label: 'In' }, position: { x: 0, y: 0 } },
                { id: 's2', type: 'output', data: { label: 'Out' }, position: { x: 10, y: 10 } },
            ],
            edges: [{ id: 'se1', source: 's1', target: 's2' }],
        };

        const first = await request(app)
            .post(`${API_PREFIX}/projects/${testProject.id}/flows/import-subflow`)
            .send({ flowJson });
        expect(first.statusCode).toBe(201);
        expect(first.body.success).toBe(true);
        const firstFlowId = first.body.data.flowId;

        const countAfterFirst = await Flow.count({
            where: { projectId: testProject.id, type: 'component' },
        });

        const second = await request(app)
            .post(`${API_PREFIX}/projects/${testProject.id}/flows/import-subflow`)
            .send({ flowJson });
        expect([200, 201]).toContain(second.statusCode);
        expect(second.body.success).toBe(true);
        expect(second.body.reused).toBe(true);
        expect(second.body.data.flowId).toBe(firstFlowId);

        const countAfterSecond = await Flow.count({
            where: { projectId: testProject.id, type: 'component' },
        });
        expect(countAfterSecond).toBe(countAfterFirst);
    });
});
