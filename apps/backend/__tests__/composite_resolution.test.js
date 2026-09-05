import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── PlaywrightGenerator: composite / component code generation ──────────────
import { PlaywrightGenerator } from '../services/exporter/generators/PlaywrightGenerator.js';

describe('PlaywrightGenerator — composite/component code generation', () => {
    it('generates nested code when subNodes are present', () => {
        const gen = new PlaywrightGenerator('javascript', 'es');
        const steps = [
            {
                id: 'c1',
                type: 'component',
                data: {
                    label: 'Login Steps',
                    subNodes: [
                        {
                            id: 'n1',
                            type: 'open_url',
                            data: { configuration: { url: 'https://example.com' } },
                        },
                        {
                            id: 'n2',
                            type: 'click',
                            data: { label: 'Click', configuration: { selector: '#btn' } },
                        },
                    ],
                },
            },
        ];
        const { code } = gen.generate(steps);
        expect(code).toContain('Login Steps');
        expect(code).toContain('goto');
        expect(code).toContain('click');
    });

    it('emits a warning comment when a component has empty subNodes and no flowId', () => {
        const gen = new PlaywrightGenerator('javascript', 'en');
        const steps = [
            {
                id: 'c1',
                type: 'component',
                data: {
                    label: 'Disappearing Elements',
                    configuration: {},
                },
            },
        ];
        const { code, warnings } = gen.generate(steps);
        // The warning comment must be visible in the generated code
        expect(code).toContain('Disappearing Elements');
        expect(code).toContain('⚠️');
        expect(code).toContain('could not be resolved');
        // The warning must also be reported in the warnings array
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings.some((w) => w.nodeType === 'component')).toBe(true);
    });

    it('generates code from inline subNodes even without a flowId', () => {
        const gen = new PlaywrightGenerator('javascript', 'es');
        const steps = [
            {
                id: 'c1',
                type: 'component',
                data: {
                    label: 'Inline Component',
                    configuration: {},
                    subNodes: [
                        {
                            id: 'n1',
                            type: 'click',
                            data: { label: 'Click', configuration: { selector: '#go' } },
                        },
                    ],
                },
            },
        ];
        const { code } = gen.generate(steps);
        expect(code).toContain('Inline Component');
        expect(code).toContain('click');
        expect(code).not.toContain('could not be resolved');
    });

    it('produces a warning comment in Python for unresolvable composites', () => {
        const gen = new PlaywrightGenerator('python', 'es');
        const steps = [
            {
                id: 'c1',
                type: 'component',
                data: { label: 'Broken Comp', configuration: {} },
            },
        ];
        const { code } = gen.generate(steps);
        expect(code).toContain('Broken Comp');
        expect(code).toContain('# ⚠️');
    });

    it('does NOT warn when a component has subNodes but no flowId', () => {
        const gen = new PlaywrightGenerator('javascript', 'es');
        const steps = [
            {
                id: 'c1',
                type: 'component',
                data: {
                    label: 'My Group',
                    configuration: {},
                    subNodes: [
                        { id: 'n1', type: 'click', data: { configuration: { selector: '#a' } } },
                    ],
                },
            },
        ];
        const { code, warnings } = gen.generate(steps);
        expect(code).toContain('My Group');
        expect(code).not.toContain('could not be resolved');
        expect(warnings.filter((w) => w.nodeType === 'component').length).toBe(0);
    });
});

// ─── FlowResolver: sub-flow resolution with fallback ────────────────────────
// We mock only the DB calls used by _loadSubFlow to keep tests isolated.

vi.mock('../services/ProjectStorageService.js', () => ({
    projectStorageService: { readFile: vi.fn().mockRejectedValue(new Error('not found')) },
}));

vi.mock('../services/ComponentRegistry.js', () => ({
    componentRegistry: { resolve: vi.fn().mockResolvedValue(null) },
}));

describe('FlowResolver — container node fallback and warnings', () => {
    let flowResolver;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Dynamic import so mocks are applied
        const mod = await import('../core/FlowResolver.js');
        flowResolver = mod.flowResolver;
    });

    it('preserves inline subNodes when flowRef is missing', async () => {
        const nodes = [
            {
                id: 'comp-1',
                type: 'component',
                data: {
                    label: 'Inline',
                    configuration: {}, // No flowId
                    subNodes: [
                        {
                            id: 'inner-1',
                            type: 'click',
                            data: { configuration: { selector: '#x' } },
                        },
                    ],
                },
            },
        ];
        const result = await flowResolver.resolve(nodes, 'proj-1');
        expect(result.length).toBe(1);
        expect(result[0].data.subNodes.length).toBe(1);
        expect(result[0].data.subNodes[0].id).toBe('inner-1');
    });

    it('preserves inline subNodes when DB lookup fails', async () => {
        // _loadSubFlow will try Flow.findOne → return null (no mock needed, returns null by default)
        const nodes = [
            {
                id: 'comp-2',
                type: 'component',
                data: {
                    label: 'Unresolved',
                    configuration: { flowId: 'nonexistent-flow' },
                    subNodes: [
                        {
                            id: 'inner-2',
                            type: 'type_text',
                            data: { configuration: { selector: '#y', text: 'hi' } },
                        },
                    ],
                },
            },
        ];
        const result = await flowResolver.resolve(nodes, 'proj-1');
        expect(result.length).toBe(1);
        // Inline subNodes should be preserved
        expect(result[0].data.subNodes.length).toBe(1);
        expect(result[0].data.subNodes[0].id).toBe('inner-2');
    });

    it('lists dependencies correctly for containers with no flowRef', () => {
        const nodes = [
            {
                id: 'comp-3',
                type: 'component',
                data: {
                    label: 'NoRef',
                    configuration: {},
                },
            },
        ];
        const deps = flowResolver.listDependencies(nodes);
        // No flowRef → no dependency listed
        expect(deps.length).toBe(0);
    });

    it('detects loops via listDependencies when flowId is present', () => {
        const nodes = [
            {
                id: 'loop-1',
                type: 'loop',
                data: {
                    configuration: { flowId: 'loop-flow' },
                },
            },
        ];
        const deps = flowResolver.listDependencies(nodes);
        expect(deps.length).toBe(1);
        expect(deps[0].ref).toBe('loop-flow');
    });
});
