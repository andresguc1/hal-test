import { describe, it, expect, vi } from 'vitest';
import engineHooks from '../core/EngineHooks.js';
import { HookPhase } from '../core/EngineHooks.js';

const EngineHooks = engineHooks.constructor;

describe('EngineHooks', () => {
    describe('on + emit', () => {
        it('listener receives context with phase and timestamp', async () => {
            const hooks = new EngineHooks();
            let received;
            hooks.on(HookPhase.FLOW_BEFORE_SAVE, (ctx) => {
                received = ctx;
            });

            const ctx = await hooks.emit(HookPhase.FLOW_BEFORE_SAVE);
            expect(received.phase).toBe(HookPhase.FLOW_BEFORE_SAVE);
            expect(received.timestamp).toBeTypeOf('number');
            expect(ctx).toBe(received);
        });
    });

    describe('Multiple listeners', () => {
        it('all listeners called in order', async () => {
            const hooks = new EngineHooks();
            const order = [];
            hooks.on(HookPhase.NODE_BEFORE_EXECUTE, () => order.push(1));
            hooks.on(HookPhase.NODE_BEFORE_EXECUTE, () => order.push(2));
            hooks.on(HookPhase.NODE_BEFORE_EXECUTE, () => order.push(3));

            await hooks.emit(HookPhase.NODE_BEFORE_EXECUTE);
            expect(order).toEqual([1, 2, 3]);
        });
    });

    describe('off', () => {
        it('removes listener, not called on next emit', async () => {
            const hooks = new EngineHooks();
            const spy = vi.fn();
            hooks.on(HookPhase.NODE_AFTER_EXECUTE, spy);
            hooks.off(HookPhase.NODE_AFTER_EXECUTE, spy);

            await hooks.emit(HookPhase.NODE_AFTER_EXECUTE);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('Unregister function', () => {
        it('returned function removes the listener', async () => {
            const hooks = new EngineHooks();
            const spy = vi.fn();
            const remove = hooks.on(HookPhase.EXPORT_BEFORE_GENERATE, spy);

            remove();
            await hooks.emit(HookPhase.EXPORT_BEFORE_GENERATE);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('emit returns context', () => {
        it('context object returned with phase and timestamp', async () => {
            const hooks = new EngineHooks();
            const ctx = await hooks.emit(HookPhase.AI_BEFORE_VALIDATION, { foo: 'bar' });

            expect(ctx.phase).toBe(HookPhase.AI_BEFORE_VALIDATION);
            expect(ctx.timestamp).toBeTypeOf('number');
            expect(ctx.foo).toBe('bar');
        });
    });

    describe('Context mutation', () => {
        it('listeners can modify context', async () => {
            const hooks = new EngineHooks();
            hooks.on(HookPhase.FLOW_AFTER_EXECUTE, (ctx) => {
                ctx.added = 42;
            });
            hooks.on(HookPhase.FLOW_AFTER_EXECUTE, (ctx) => {
                ctx.extra = true;
            });

            const ctx = await hooks.emit(HookPhase.FLOW_AFTER_EXECUTE);
            expect(ctx.added).toBe(42);
            expect(ctx.extra).toBe(true);
        });
    });

    describe('Abort', () => {
        it('calling context.abort() stops subsequent listeners', async () => {
            const hooks = new EngineHooks();
            const spy = vi.fn();
            hooks.on(HookPhase.NODE_ON_ERROR, (ctx) => {
                ctx.abort();
            });
            hooks.on(HookPhase.NODE_ON_ERROR, spy);

            const ctx = await hooks.emit(HookPhase.NODE_ON_ERROR);
            expect(spy).not.toHaveBeenCalled();
            expect(ctx.aborted).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('listener errors dont break chain, subsequent listeners still called', async () => {
            const hooks = new EngineHooks();
            const spy = vi.fn();
            hooks.on(HookPhase.PLUGIN_LOADED, () => {
                throw new Error('boom');
            });
            hooks.on(HookPhase.PLUGIN_LOADED, spy);

            const ctx = await hooks.emit(HookPhase.PLUGIN_LOADED);
            expect(spy).toHaveBeenCalled();
            expect(ctx.phase).toBe(HookPhase.PLUGIN_LOADED);
        });
    });

    describe('getListeners', () => {
        it('returns metadata for registered listeners', () => {
            const hooks = new EngineHooks();
            hooks.on(HookPhase.FLOW_BEFORE_EXECUTE, () => {}, 'plugin-a');
            hooks.on(HookPhase.FLOW_BEFORE_EXECUTE, () => {}, 'plugin-b');

            const listeners = hooks.getListeners(HookPhase.FLOW_BEFORE_EXECUTE);
            expect(listeners).toHaveLength(2);
            expect(listeners[0].pluginId).toBe('plugin-a');
            expect(listeners[0].registeredAt).toBeTypeOf('number');
            expect(listeners[1].pluginId).toBe('plugin-b');
        });
    });

    describe('removePluginHooks', () => {
        it('removes all hooks for a specific pluginId', async () => {
            const hooks = new EngineHooks();
            const spyA = vi.fn();
            const spyCore = vi.fn();
            hooks.on(HookPhase.PROJECT_BEFORE_IMPORT, spyA, 'bad-plugin');
            hooks.on(HookPhase.PROJECT_BEFORE_IMPORT, spyCore, 'core');

            hooks.removePluginHooks('bad-plugin');

            const listeners = hooks.getListeners(HookPhase.PROJECT_BEFORE_IMPORT);
            expect(listeners).toHaveLength(1);
            expect(listeners[0].pluginId).toBe('core');

            await hooks.emit(HookPhase.PROJECT_BEFORE_IMPORT);
            expect(spyA).not.toHaveBeenCalled();
            expect(spyCore).toHaveBeenCalled();
        });
    });

    describe('stats', () => {
        it('returns count of listeners per phase', () => {
            const hooks = new EngineHooks();
            hooks.on(HookPhase.FLOW_BEFORE_SAVE, () => {});
            hooks.on(HookPhase.FLOW_BEFORE_SAVE, () => {});
            hooks.on(HookPhase.NODE_AFTER_EXECUTE, () => {});

            const s = hooks.stats();
            expect(s[HookPhase.FLOW_BEFORE_SAVE]).toBe(2);
            expect(s[HookPhase.NODE_AFTER_EXECUTE]).toBe(1);
        });
    });

    describe('HookPhase enum', () => {
        it('all expected phase constants exist', () => {
            expect(HookPhase.FLOW_BEFORE_SAVE).toBe('flow:beforeSave');
            expect(HookPhase.FLOW_AFTER_SAVE).toBe('flow:afterSave');
            expect(HookPhase.FLOW_BEFORE_EXECUTE).toBe('flow:beforeExecute');
            expect(HookPhase.FLOW_AFTER_EXECUTE).toBe('flow:afterExecute');
            expect(HookPhase.NODE_BEFORE_EXECUTE).toBe('node:beforeExecute');
            expect(HookPhase.NODE_AFTER_EXECUTE).toBe('node:afterExecute');
            expect(HookPhase.NODE_ON_ERROR).toBe('node:onError');
            expect(HookPhase.EXPORT_BEFORE_GENERATE).toBe('export:beforeGenerate');
            expect(HookPhase.EXPORT_AFTER_GENERATE).toBe('export:afterGenerate');
            expect(HookPhase.AI_BEFORE_VALIDATION).toBe('ai:beforeValidation');
            expect(HookPhase.AI_AFTER_GENERATION).toBe('ai:afterGeneration');
            expect(HookPhase.PROJECT_BEFORE_IMPORT).toBe('project:beforeImport');
            expect(HookPhase.PROJECT_AFTER_EXPORT).toBe('project:afterExport');
            expect(HookPhase.PLUGIN_LOADED).toBe('plugin:loaded');
            expect(HookPhase.PLUGIN_UNLOADED).toBe('plugin:unloaded');
        });
    });
});
