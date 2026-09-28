/**
 * Phase 2 — Structural Mapping (plan code-preview-implementation-plan.md).
 *
 * Contrato mappingByFile (arquitectura §3.1): por fichero, una lista de
 * entradas { nodeId, flowId(scope), instanceKey, label, type, depth,
 * startLine(1-based), endLine, kind, status, reason, children }.
 *  - instanceKey = nodeId del container padre (null en top-level).
 *  - endLine cubre el bloque completo (incluidos hijos).
 *  - Reuso de submódulos: cada instancia recibe SU propio rango
 *    (occurrence ordinal, no "primera coincidencia").
 *  - generationKey = sha256 del insumo (flujo + framework + language +
 *    locale + usePOM + includeCICD + designPattern), prefijo `sha256:`.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
// Ensure patterns are registered before exportService is loaded
import '../services/exporter/patterns/index.js';
import { exportService } from '../services/exporter/index.js';

const API_PREFIX = '/api';

const innerOpenUrl = {
    id: 'inner-open-1',
    type: 'open_url',
    data: { configuration: { url: 'https://example.com' } },
};

const componentWithSubNodes = (id, label, subNodes) => ({
    id,
    type: 'component',
    data: { label, subNodes },
});

const componentWithFlowId = (id, flowId, label, subNodes = []) => ({
    id,
    type: 'component',
    data: { label, configuration: { flowId }, subNodes },
});

const flatMapping = (result) => {
    expect(result.mappingByFile).toBeTruthy();
    return result.mappingByFile['main'] || [];
};

describe('Code Preview — mappingByFile (flat)', () => {
    it('genera mapping para fichero plano con entradas coherentes', () => {
        const flow = [componentWithSubNodes('comp-a', 'A', [innerOpenUrl])];
        const result = exportService.generateCode(flow, 'playwright', 'javascript', 'en');
        const entries = flatMapping(result);

        expect(entries.length).toBeGreaterThanOrEqual(2);
        const lines = result.code.split('\n');
        for (const e of entries) {
            expect(e.startLine).toBeGreaterThanOrEqual(1);
            expect(e.endLine).toBeGreaterThanOrEqual(e.startLine);
            expect(e.kind).toMatch(/^(simple|composite|container|placeholder)$/);
            expect(lines.slice(e.startLine - 1, e.endLine).join('\n')).toContain(
                `[node_id: ${e.nodeId}]`,
            );
        }
    });

    it('hijos apuntan al container (instanceKey) y depth es relativo', () => {
        const flow = [componentWithSubNodes('comp-a', 'A', [innerOpenUrl])];
        const result = exportService.generateCode(flow, 'playwright', 'javascript', 'en');
        const entries = flatMapping(result);

        const container = entries.find((e) => e.nodeId === 'comp-a');
        const child = entries.find((e) => e.nodeId === innerOpenUrl.id);

        expect(container.kind).toBe('composite');
        expect(container.children).toContain(innerOpenUrl.id);
        expect(child.instanceKey).toBe('comp-a');
        expect(child.depth).toBe(container.depth + 1);
        expect(child.startLine).toBeGreaterThan(container.startLine);
        expect(child.endLine).toBeLessThanOrEqual(container.endLine);
    });

    it('reuso: 2 instancias del mismo submódulo → rangos distintos por instancia', () => {
        const flow = [
            componentWithSubNodes('comp-c1', 'C1', [innerOpenUrl]),
            componentWithSubNodes('comp-c2', 'C2', [innerOpenUrl]),
        ];
        const result = exportService.generateCode(flow, 'playwright', 'javascript', 'en');
        const entries = flatMapping(result);

        const firstInstance = entries.filter((e) => e.nodeId === innerOpenUrl.id);
        expect(firstInstance.length).toBe(2);

        const [c1Entry, c2Entry] = firstInstance;
        const c1 = entries.find((e) => e.nodeId === 'comp-c1');
        const c2 = entries.find((e) => e.nodeId === 'comp-c2');

        expect(c1Entry.instanceKey).toBe('comp-c1');
        expect(c2Entry.instanceKey).toBe('comp-c2');
        expect(c1Entry.startLine).not.toBe(c2Entry.startLine);
        expect(c1Entry.startLine).toBeGreaterThanOrEqual(c1.startLine);
        expect(c1Entry.endLine).toBeLessThanOrEqual(c1.endLine);
        expect(c2Entry.startLine).toBeGreaterThanOrEqual(c2.startLine);
        expect(c2Entry.endLine).toBeLessThanOrEqual(c2.endLine);
    });

    it('componente sin resolver → placeholder con status/reason', () => {
        const flow = [componentWithFlowId('comp-x', 'flow_que_no_existe', 'X')];
        const result = exportService.generateCode(flow, 'playwright', 'javascript', 'en');
        const entry = flatMapping(result).find((e) => e.nodeId === 'comp-x');

        expect(entry).toBeTruthy();
        expect(entry.kind).toBe('placeholder');
        expect(entry.status).toBe('unresolved');
        expect(entry.reason).toBe('no_project_context');
        const block = result.code.split('\n').slice(entry.startLine - 1, entry.endLine);
        expect(block[0]).toContain(`[node_id: ${entry.nodeId}]`);
        expect(block.join('\n')).toContain('⚠️');
    });

    it('mapping también existe para cypress', () => {
        const flow = [componentWithSubNodes('comp-a', 'A', [innerOpenUrl])];
        const result = exportService.generateCode(flow, 'cypress', 'javascript', 'en');
        const entries = flatMapping(result);

        const container = entries.find((e) => e.nodeId === 'comp-a');
        expect(container.kind).toBe('composite');
        expect(entries.find((e) => e.nodeId === innerOpenUrl.id).instanceKey).toBe('comp-a');
    });

    it('mapping también existe para selenium (python)', () => {
        const flow = [componentWithSubNodes('comp-a', 'A', [innerOpenUrl])];
        const result = exportService.generateCode(flow, 'selenium', 'python', 'en');
        const entries = flatMapping(result);

        expect(entries.find((e) => e.nodeId === 'comp-a').kind).toBe('composite');
        expect(entries.find((e) => e.nodeId === innerOpenUrl.id).instanceKey).toBe('comp-a');
    });
});

describe('Code Preview — generationKey', () => {
    const mk = () =>
        exportService.generateCode(
            [componentWithSubNodes('comp-a', 'A', [innerOpenUrl])],
            'playwright',
            'javascript',
            'en',
        );

    it('clave presente con prefijo sha256:', () => {
        expect(mk().generationKey).toMatch(/^sha256:[0-9a-f]{64}$/);
    });

    it('determinista para el mismo insumo', () => {
        expect(mk().generationKey).toBe(mk().generationKey);
    });

    it('cambia si cambia el flujo', () => {
        const other = exportService.generateCode(
            [componentWithSubNodes('comp-b', 'B', [innerOpenUrl])],
            'playwright',
            'javascript',
            'en',
        );
        expect(other.generationKey).not.toBe(mk().generationKey);
    });
});

describe('Code Preview — POM multi-file', () => {
    it('mapping por fichero: página con flowId de scope y spec principal', () => {
        const flow = [componentWithFlowId('comp-a', 'flow_a', 'A', [innerOpenUrl])];
        const result = exportService.generateCode(
            flow,
            'playwright',
            'javascript',
            'es',
            true,
            false,
            'pom',
        );

        expect(result.isZip).toBe(true);
        expect(result.mappingByFile).toBeTruthy();

        const fileKeys = Object.keys(result.mappingByFile);
        expect(fileKeys).toEqual(expect.arrayContaining(['tests/flow.spec.js']));
        const pageKey = fileKeys.find((k) => k.startsWith('pages/'));
        expect(pageKey).toBeTruthy();

        const pageEntry = result.mappingByFile[pageKey].find((e) => e.nodeId === innerOpenUrl.id);
        expect(pageEntry).toBeTruthy();
        expect(pageEntry.flowId).toBe('flow_a');
        expect(pageEntry.instanceKey).toBeNull();
    });
});

describe('Code Preview — routes', () => {
    it('/export/code incluye mappingByFile y generationKey', async () => {
        const flow = [componentWithFlowId('comp-r', 'flow_r', 'R', [innerOpenUrl])];
        const res = await request(app)
            .post(`${API_PREFIX}/export/code`)
            .send({ flow, framework: 'playwright', language: 'javascript', locale: 'en' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.generationKey).toMatch(/^sha256:/);
        expect(res.body.mappingByFile).toBeTruthy();
        expect(typeof res.body.mappingByFile['main']).toBe('object');
    });

    it('/import/code convierte código → actions (sync canvas)', async () => {
        const spec = `
import { test } from '@playwright/test';
test('my test', async ({ page }) => {
    await page.goto('https://example.com');
});
`;
        const res = await request(app)
            .post(`${API_PREFIX}/import/code`)
            .send({ code: spec, framework: 'playwright' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.actions)).toBe(true);
        expect(res.body.actions[0].action).toBe('launch_browser');
        expect(res.body.actions[res.body.actions.length - 1].action).toBe('close_browser');
    });

    it('/import/code rechaza contenido vacío', async () => {
        const res = await request(app).post(`${API_PREFIX}/import/code`).send({ code: '' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
