/**
 * Phase 1 — Correctness (plan code-preview-implementation-plan.md).
 *
 * Contrato: nunca un bloque/grupo vacío silencioso para componentes no
 * resueltos. Cada fuente de bloque vacío emite warning estructurado
 * { status, reason }:
 *   - unresolved / no_project_context  (C1: hay flowId pero sin proyecto)
 *   - unresolved / flow_not_found      (C2: flowId que no resuelve)
 *   - ignored    / no_executable_children (C3: componente solo-metadata)
 * Y el reuso legítimo (F1) resuelve TODAS las instancias.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportService } from '../services/exporter/index.js';
import { flowResolver } from '../core/FlowResolver.js';

const innerNode = {
    id: 'inner-1',
    type: 'open_url',
    data: { configuration: { url: 'https://example.com' } },
};

const componentWithFlowId = (id, flowId, label) => ({
    id,
    type: 'component',
    data: { label, configuration: { flowId } },
});

const componentWithoutRef = (id, label, subNodes = []) => ({
    id,
    type: 'component',
    data: { label, subNodes },
});

const emptyPlaywrightBlock = /async \(\) => \{\s*\}/;

const statusOf = (warnings, nodeId, nodeLabel) =>
    warnings.find((w) => w.nodeId === nodeId || (nodeLabel && w.nodeLabel === nodeLabel));

describe('Code Preview — never empty block without warning', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('PLAYWRIGHT', () => {
        it('componente con subNodes inline genera contenido (sin proyecto)', () => {
            const flow = [componentWithoutRef('comp-inline', 'Inline', [innerNode])];
            const result = exportService.generateCode(flow, 'playwright', 'javascript', 'en');
            expect(result.code).toContain('// [node_id: inner-1]');
            expect(result.code).not.toMatch(emptyPlaywrightBlock);
        });

        it('componente solo-metadata emite warning y NUNCA bloque vacío', () => {
            const flow = [componentWithoutRef('comp-empty', 'Sin Contenido')];
            const result = exportService.generateCode(flow, 'playwright', 'javascript', 'en');
            expect(result.code).not.toMatch(emptyPlaywrightBlock);
            expect(result.code).toContain('⚠️ Component "Sin Contenido"');
            expect(statusOf(result.warnings, 'comp-empty', 'Sin Contenido').nodeType).toBe(
                'component',
            );
        });

        it('componente solo-metadata → warning ignored/no_executable_children', () => {
            const flow = [componentWithoutRef('comp-empty', 'Sin Contenido')];
            const result = exportService.generateCode(flow, 'playwright', 'javascript', 'en');
            const w = statusOf(result.warnings, 'comp-empty', 'Sin Contenido');
            expect(w.status).toBe('ignored');
            expect(w.reason).toBe('no_executable_children');
        });

        it('componente con flowId pero sin proyecto → warning unresolved/no_project_context (C1)', () => {
            const flow = [componentWithFlowId('comp-broken', 'flow_a', 'Broken')];
            const result = exportService.generateCode(flow, 'playwright', 'javascript', 'en');
            expect(result.code).not.toMatch(emptyPlaywrightBlock);
            const w = statusOf(result.warnings, 'comp-broken', 'Broken');
            expect(w).toBeTruthy();
            expect(w.status).toBe('unresolved');
            expect(w.reason).toBe('no_project_context');
        });
    });

    describe('CYPRESS', () => {
        it('componente con flowId sin resolver → warning unresolved y NUNCA describe vacío', () => {
            const flow = [componentWithFlowId('comp-broken', 'flow_a', 'Broken')];
            const result = exportService.generateCode(flow, 'cypress', 'javascript', 'en');
            expect(result.code).not.toMatch(/describe\('Broken', \(\) => \{\s*\}\);/);
            const w = statusOf(result.warnings, 'comp-broken', 'Broken');
            expect(w).toBeTruthy();
            expect(w.status).toBe('unresolved');
        });
    });

    describe('SELENIUM', () => {
        it('componente con flowId sin resolver → warning unresolved y NUNCA grupo vacío', () => {
            const flow = [componentWithFlowId('comp-broken', 'flow_a', 'Broken')];
            const result = exportService.generateCode(flow, 'selenium', 'python', 'en');
            expect(result.code).not.toMatch(/\[GROUP\]: Broken\n\s*\[END GROUP\]/);
            const w = statusOf(result.warnings, 'comp-broken', 'Broken');
            expect(w).toBeTruthy();
            expect(w.status).toBe('unresolved');
        });
    });
});

describe('FlowResolver — reuso y resolución', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('2x el mismo flowId con proyecto → AMBAS instancias resuelven (F1)', async () => {
        const mockSubFlow = { name: 'Flow A', nodes: [{ ...innerNode }] };
        vi.spyOn(flowResolver, '_loadSubFlow').mockResolvedValue(mockSubFlow);

        const flow = [
            componentWithFlowId('c1', 'flow_a', 'C1'),
            componentWithFlowId('c2', 'flow_a', 'C2'),
        ];

        const nodes = await flowResolver.resolve(flow, 'proj-x');
        expect(nodes[0].data.subNodes.length).toBe(1);
        expect(nodes[1].data.subNodes.length).toBe(1);
    });

    it('flowId inexistente → conserva flowId, warning unresolved/flow_not_found y sin bloque vacío (C2)', async () => {
        vi.spyOn(flowResolver, '_loadSubFlow').mockResolvedValue(null);

        const flow = [componentWithFlowId('comp-nope', 'flow_inexistente', 'Nope')];
        const nodes = await flowResolver.resolve(flow, 'proj-x');
        expect(nodes[0].data.configuration.flowId).toBe('flow_inexistente');

        const result = exportService.generateCode(nodes, 'playwright', 'javascript', 'en');
        expect(result.code).not.toMatch(emptyPlaywrightBlock);
        const w = statusOf(result.warnings, 'comp-nope', 'Nope');
        expect(w).toBeTruthy();
        expect(w.status).toBe('unresolved');
        expect(w.reason).toBe('flow_not_found');
    });
});
