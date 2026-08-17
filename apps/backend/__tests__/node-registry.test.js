import { describe, it, expect, vi } from 'vitest';
import nodeRegistry from '../core/NodeRegistry.js';

const NodeRegistry = nodeRegistry.constructor;

function makeDef(overrides = {}) {
    return {
        type: 'test:node',
        category: 'logic',
        label: 'Test Node',
        color: 'blue',
        icon: 'TestIcon',
        version: '1.0.0',
        schema: { validate: vi.fn() },
        handler: vi.fn(),
        mapper: { toCode: vi.fn() },
        frontend: { component: 'TestNode' },
        ...overrides,
    };
}

describe('NodeRegistry', () => {
    describe('register', () => {
        it('registers a node type with definition and source', () => {
            const reg = new NodeRegistry();
            const def = makeDef();
            reg.register(def, 'plugin-a');

            const stored = reg.get('test:node');
            expect(stored).toBeDefined();
            expect(stored.type).toBe('test:node');
            expect(stored.source).toBe('plugin-a');
            expect(stored.registeredAt).toBeTypeOf('number');
        });

        it('throws if definition has no type', () => {
            const reg = new NodeRegistry();
            expect(() => reg.register({ category: 'logic' })).toThrow(
                'Node definition must have a type',
            );
        });
    });

    describe('get', () => {
        it('retrieves a registered definition', () => {
            const reg = new NodeRegistry();
            const def = makeDef({ type: 'core:click' });
            reg.register(def);

            const result = reg.get('core:click');
            expect(result.type).toBe('core:click');
        });

        it('returns undefined for unknown type', () => {
            const reg = new NodeRegistry();
            expect(reg.get('no:such:type')).toBeUndefined();
        });
    });

    describe('has', () => {
        it('returns true for registered types and false otherwise', () => {
            const reg = new NodeRegistry();
            reg.register(makeDef({ type: 'a' }));

            expect(reg.has('a')).toBe(true);
            expect(reg.has('b')).toBe(false);
        });
    });

    describe('count', () => {
        it('tracks count accurately', () => {
            const reg = new NodeRegistry();
            expect(reg.count()).toBe(0);

            reg.register(makeDef({ type: 'x' }));
            reg.register(makeDef({ type: 'y' }));
            expect(reg.count()).toBe(2);

            reg.unregister('x');
            expect(reg.count()).toBe(1);
        });
    });

    describe('getHandler', () => {
        it('returns handler function', () => {
            const reg = new NodeRegistry();
            const handler = vi.fn();
            reg.register(makeDef({ type: 'h:test', handler }));

            expect(reg.getHandler('h:test')).toBe(handler);
            expect(reg.getHandler('no:such')).toBeUndefined();
        });
    });

    describe('getSchema', () => {
        it('returns schema object', () => {
            const reg = new NodeRegistry();
            const schema = { validate: vi.fn() };
            reg.register(makeDef({ type: 's:test', schema }));

            expect(reg.getSchema('s:test')).toBe(schema);
        });
    });

    describe('getMapper', () => {
        it('returns mapper', () => {
            const reg = new NodeRegistry();
            const mapper = { toCode: vi.fn() };
            reg.register(makeDef({ type: 'm:test', mapper }));

            expect(reg.getMapper('m:test')).toBe(mapper);
        });
    });

    describe('unregister', () => {
        it('removes a node type', () => {
            const reg = new NodeRegistry();
            reg.register(makeDef({ type: 'del:me' }));

            expect(reg.has('del:me')).toBe(true);
            reg.unregister('del:me');
            expect(reg.has('del:me')).toBe(false);
            expect(reg.count()).toBe(0);
        });
    });

    describe('categories', () => {
        it('nodes are grouped by category via getByCategory()', () => {
            const reg = new NodeRegistry();
            reg.register(makeDef({ type: 'a', category: 'math' }));
            reg.register(makeDef({ type: 'b', category: 'math' }));
            reg.register(makeDef({ type: 'c', category: 'io' }));

            const mathNodes = reg.getByCategory('math');
            expect(mathNodes).toHaveLength(2);
            expect(mathNodes.map((n) => n.type)).toEqual(['a', 'b']);

            const ioNodes = reg.getByCategory('io');
            expect(ioNodes).toHaveLength(1);
        });

        it('getAllCategories returns category map', () => {
            const reg = new NodeRegistry();
            reg.register(makeDef({ type: 'a', category: 'x' }));
            reg.register(makeDef({ type: 'b', category: 'x' }));
            reg.register(makeDef({ type: 'c', category: 'y' }));

            const cats = reg.getAllCategories();
            expect(cats).toEqual({ x: ['a', 'b'], y: ['c'] });
        });
    });

    describe('getAllTypes', () => {
        it('returns all type strings', () => {
            const reg = new NodeRegistry();
            reg.register(makeDef({ type: 't1' }));
            reg.register(makeDef({ type: 't2' }));
            reg.register(makeDef({ type: 't3' }));

            const types = reg.getAllTypes();
            expect(types).toEqual(expect.arrayContaining(['t1', 't2', 't3']));
            expect(types).toHaveLength(3);
        });
    });

    describe('getFrontendDefinitions', () => {
        it('returns categories object with nodes arrays', () => {
            const reg = new NodeRegistry();
            reg.register(makeDef({ type: 'n1', category: 'actions', color: 'red', icon: 'Play' }));
            reg.register(makeDef({ type: 'n2', category: 'actions', color: 'red', icon: 'Play' }));
            reg.register(makeDef({ type: 'n3', category: 'logic' }));

            const defs = reg.getFrontendDefinitions();
            expect(defs.actions.nodes).toEqual(['n1', 'n2']);
            expect(defs.actions.color).toBe('red');
            expect(defs.actions.icon).toBe('Play');
            expect(defs.logic.nodes).toEqual(['n3']);
        });

        it('places nodes without category under uncategorized', () => {
            const reg = new NodeRegistry();
            reg.register(makeDef({ type: 'orphan', category: undefined }));

            const defs = reg.getFrontendDefinitions();
            expect(defs.uncategorized).toBeDefined();
            expect(defs.uncategorized.nodes).toContain('orphan');
        });
    });

    describe('clear', () => {
        it('clears all registrations', () => {
            const reg = new NodeRegistry();
            reg.register(makeDef({ type: 'a', category: 'cat1' }));
            reg.register(makeDef({ type: 'b', category: 'cat2' }));

            reg.clear();
            expect(reg.count()).toBe(0);
            expect(reg.getAllTypes()).toEqual([]);
            expect(reg.getAllCategories()).toEqual({});
        });
    });
});
