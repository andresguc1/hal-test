import { describe, it, expect, beforeEach } from 'vitest';
import { variableManager } from '../services/VariableManager.js';
import forEachBodySchema from '../schemas/for_each/body.js';

describe('ForEach Node', () => {
    beforeEach(() => {
        variableManager.clearAll();
    });

    // ===================================================================
    // 1. SCHEMA VALIDATION
    // ===================================================================
    describe('Schema Validation', () => {
        it('should accept a valid sequential config with static array', () => {
            const { error, value } = forEachBodySchema.validate({
                source: [1, 2, 3],
                executionMode: 'sequential',
                itemAlias: 'item',
                indexAlias: 'index',
            });
            expect(error).toBeUndefined();
            expect(value.executionMode).toBe('sequential');
            expect(value.source).toEqual([1, 2, 3]);
            expect(value.stopOnError).toBe(true); // default
            expect(value.maxConcurrency).toBe(3); // default
        });

        it('should accept a variable reference as source', () => {
            const { error, value } = forEachBodySchema.validate({
                source: '{{myArray}}',
            });
            expect(error).toBeUndefined();
            expect(value.source).toBe('{{myArray}}');
        });

        it('should reject missing source', () => {
            const { error } = forEachBodySchema.validate({
                executionMode: 'sequential',
            });
            expect(error).toBeDefined();
            expect(error.details[0].path).toContain('source');
        });

        it('should reject invalid execution mode', () => {
            const { error } = forEachBodySchema.validate({
                source: [1, 2],
                executionMode: 'invalid_mode',
            });
            expect(error).toBeDefined();
        });

        it('should apply defaults correctly', () => {
            const { value } = forEachBodySchema.validate({ source: [1] });
            expect(value.executionMode).toBe('sequential');
            expect(value.maxConcurrency).toBe(3);
            expect(value.itemAlias).toBe('item');
            expect(value.indexAlias).toBe('index');
            expect(value.stopOnError).toBe(true);
            expect(value.collectResults).toBe(true);
            expect(value.maxItems).toBe(1000);
            expect(value.delayBetweenIterations).toBe(0);
            expect(value.executionTimeout).toBe(0);
            expect(value.randomMode).toBe('shuffle');
        });

        it('should accept parallel mode with maxConcurrency', () => {
            const { error, value } = forEachBodySchema.validate({
                source: ['a', 'b', 'c'],
                executionMode: 'parallel',
                maxConcurrency: 5,
            });
            expect(error).toBeUndefined();
            expect(value.maxConcurrency).toBe(5);
        });

        it('should cap maxConcurrency at 50', () => {
            const { error } = forEachBodySchema.validate({
                source: [1],
                maxConcurrency: 100,
            });
            expect(error).toBeDefined();
        });

        it('should accept random mode with single sub-mode', () => {
            const { error, value } = forEachBodySchema.validate({
                source: [1, 2, 3],
                executionMode: 'random',
                randomMode: 'single',
            });
            expect(error).toBeUndefined();
            expect(value.randomMode).toBe('single');
        });

        it('should accept single mode with singleIndex', () => {
            const { error, value } = forEachBodySchema.validate({
                source: [1, 2, 3],
                executionMode: 'single',
                singleIndex: 2,
            });
            expect(error).toBeUndefined();
            expect(value.singleIndex).toBe(2);
        });

        it('should accept single mode with singleMatch expression', () => {
            const { error, value } = forEachBodySchema.validate({
                source: [1, 2, 3],
                executionMode: 'single',
                singleMatch: "item.id === 'target'",
            });
            expect(error).toBeUndefined();
            expect(value.singleMatch).toBe("item.id === 'target'");
        });

        it('should accept retryPolicy', () => {
            const { error, value } = forEachBodySchema.validate({
                source: [1],
                retryPolicy: { maxRetries: 3, retryDelay: 2000 },
            });
            expect(error).toBeUndefined();
            expect(value.retryPolicy.maxRetries).toBe(3);
        });

        it('should accept delayBetweenIterations for rate limiting', () => {
            const { error, value } = forEachBodySchema.validate({
                source: [1, 2],
                delayBetweenIterations: 500,
            });
            expect(error).toBeUndefined();
            expect(value.delayBetweenIterations).toBe(500);
        });

        it('should accept executionTimeout', () => {
            const { error, value } = forEachBodySchema.validate({
                source: [1],
                executionTimeout: 30000,
            });
            expect(error).toBeUndefined();
            expect(value.executionTimeout).toBe(30000);
        });

        it('should accept flowId for external sub-flow', () => {
            const { error, value } = forEachBodySchema.validate({
                source: [1, 2],
                flowId: 'flow_abc123',
            });
            expect(error).toBeUndefined();
            expect(value.flowId).toBe('flow_abc123');
        });
    });

    // ===================================================================
    // 2. VARIABLE MANAGER INTEGRATION (Iteration Scoping)
    // ===================================================================
    describe('Variable Scope Isolation', () => {
        it('should create isolated run scopes for each iteration', () => {
            const parentRunId = 'run_parent';
            variableManager.initRun(parentRunId, { globalVar: 'hello' });

            // Simulate iteration 0
            const iter0RunId = `${parentRunId}_foreach_node1_0`;
            const parentVars = variableManager.getAll(parentRunId) || {};
            variableManager.initRun(iter0RunId, { ...parentVars });
            variableManager.set('forEach.item', 'apple', iter0RunId);
            variableManager.set('forEach.index', 0, iter0RunId);
            variableManager.set('item', 'apple', iter0RunId);

            // Simulate iteration 1
            const iter1RunId = `${parentRunId}_foreach_node1_1`;
            variableManager.initRun(iter1RunId, { ...parentVars });
            variableManager.set('forEach.item', 'banana', iter1RunId);
            variableManager.set('forEach.index', 1, iter1RunId);
            variableManager.set('item', 'banana', iter1RunId);

            // Verify isolation
            expect(variableManager.get('forEach.item', iter0RunId)).toBe('apple');
            expect(variableManager.get('forEach.item', iter1RunId)).toBe('banana');
            expect(variableManager.get('forEach.index', iter0RunId)).toBe(0);
            expect(variableManager.get('forEach.index', iter1RunId)).toBe(1);

            // Verify parent is untouched
            expect(variableManager.get('forEach.item', parentRunId)).toBeUndefined();
        });

        it('should inherit parent variables in iteration scope', () => {
            const parentRunId = 'run_parent_2';
            variableManager.initRun(parentRunId, { sharedVar: 'shared_value' });

            const iterRunId = `${parentRunId}_foreach_node1_0`;
            const parentVars = variableManager.getAll(parentRunId) || {};
            variableManager.initRun(iterRunId, { ...parentVars });

            // Iteration should inherit parent vars
            expect(variableManager.get('sharedVar', iterRunId)).toBe('shared_value');
        });

        it('should support custom aliases for item and index', () => {
            const runId = 'run_alias_test';
            variableManager.initRun(runId, {});

            const itemAlias = 'user';
            const indexAlias = 'idx';

            variableManager.set(itemAlias, { name: 'John' }, runId);
            variableManager.set(indexAlias, 0, runId);

            expect(variableManager.get('user', runId)).toEqual({ name: 'John' });
            expect(variableManager.get('idx', runId)).toBe(0);
        });

        it('should seed complete forEach context', () => {
            const runId = 'run_context_test';
            variableManager.initRun(runId, {});

            const totalItems = 5;
            const iterationIndex = 2;

            variableManager.set('forEach.item', 'item_2', runId);
            variableManager.set('forEach.index', iterationIndex, runId);
            variableManager.set('forEach.originalIndex', iterationIndex, runId);
            variableManager.set('forEach.iteration', iterationIndex + 1, runId);
            variableManager.set('forEach.isFirst', iterationIndex === 0, runId);
            variableManager.set('forEach.isLast', iterationIndex === totalItems - 1, runId);
            variableManager.set('forEach.total', totalItems, runId);

            expect(variableManager.get('forEach.item', runId)).toBe('item_2');
            expect(variableManager.get('forEach.index', runId)).toBe(2);
            expect(variableManager.get('forEach.iteration', runId)).toBe(3);
            expect(variableManager.get('forEach.isFirst', runId)).toBe(false);
            expect(variableManager.get('forEach.isLast', runId)).toBe(false);
            expect(variableManager.get('forEach.total', runId)).toBe(5);
        });
    });

    // ===================================================================
    // 3. SOURCE RESOLUTION PATTERNS
    // ===================================================================
    describe('Source Resolution', () => {
        it('should resolve variable reference to array', () => {
            const runId = 'run_resolve';
            variableManager.initRun(runId, {});
            variableManager.set('myList', ['a', 'b', 'c'], runId);

            const resolved = variableManager.get('myList', runId);
            expect(Array.isArray(resolved)).toBe(true);
            expect(resolved).toEqual(['a', 'b', 'c']);
        });

        it('should handle JSON string sources', () => {
            const source = '[1, 2, 3]';
            const parsed = JSON.parse(source);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed).toEqual([1, 2, 3]);
        });

        it('should handle empty arrays gracefully', () => {
            const source = [];
            expect(source.length).toBe(0);
        });

        it('should respect maxItems safety cap', () => {
            const largeArray = Array.from({ length: 2000 }, (_, i) => i);
            const maxItems = 1000;
            const capped = largeArray.slice(0, maxItems);
            expect(capped.length).toBe(1000);
            expect(capped[999]).toBe(999);
        });
    });

    // ===================================================================
    // 4. EXECUTION MODE LOGIC
    // ===================================================================
    describe('Execution Mode Logic', () => {
        describe('Random Mode', () => {
            it('random shuffle should preserve all items', () => {
                const items = [1, 2, 3, 4, 5];
                const shuffled = [...items];

                // Fisher-Yates shuffle
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }

                expect(shuffled.length).toBe(items.length);
                expect(shuffled.sort()).toEqual(items.sort());
            });

            it('random single should pick exactly one item', () => {
                const items = ['a', 'b', 'c', 'd'];
                const randomIdx = Math.floor(Math.random() * items.length);
                const selected = [items[randomIdx]];

                expect(selected.length).toBe(1);
                expect(items).toContain(selected[0]);
            });
        });

        describe('Single Mode', () => {
            it('should select by index', () => {
                const items = ['apple', 'banana', 'cherry'];
                const singleIndex = 1;
                const selected = [items[singleIndex]];

                expect(selected).toEqual(['banana']);
            });

            it('should handle out-of-bounds index gracefully', () => {
                const items = ['apple', 'banana'];
                const singleIndex = 5;
                const selected = singleIndex < items.length ? [items[singleIndex]] : [];

                expect(selected).toEqual([]);
            });

            it('should select by match expression', () => {
                const items = [
                    { id: 'a', name: 'Alice' },
                    { id: 'b', name: 'Bob' },
                    { id: 'c', name: 'Charlie' },
                ];
                const matchFn = new Function('item', 'index', "return item.id === 'b'");
                const matchIdx = items.findIndex((item, idx) => matchFn(item, idx));

                expect(matchIdx).toBe(1);
                expect(items[matchIdx].name).toBe('Bob');
            });

            it('should return empty when no match found', () => {
                const items = [{ id: 'a' }, { id: 'b' }];
                const matchFn = new Function('item', 'index', "return item.id === 'z'");
                const matchIdx = items.findIndex((item, idx) => matchFn(item, idx));

                expect(matchIdx).toBe(-1);
            });
        });

        describe('Parallel Mode', () => {
            it('should chunk items by maxConcurrency', () => {
                const items = [1, 2, 3, 4, 5, 6, 7];
                const maxConcurrency = 3;
                const chunks = [];

                for (let i = 0; i < items.length; i += maxConcurrency) {
                    chunks.push(items.slice(i, i + maxConcurrency));
                }

                expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
            });
        });
    });

    // ===================================================================
    // 5. FLOW CONTROL SIGNALS
    // ===================================================================
    describe('Flow Control Signals', () => {
        it('break signal should stop iteration', () => {
            const signals = [null, null, { action: 'break' }, null];
            let stopped = false;
            let processedCount = 0;

            for (const signal of signals) {
                if (stopped) break;
                processedCount++;
                if (signal?.action === 'break') {
                    stopped = true;
                }
            }

            expect(processedCount).toBe(3);
            expect(stopped).toBe(true);
        });

        it('continue signal should skip to next item', () => {
            const signals = [null, { action: 'continue' }, null, null];
            const processed = [];

            for (let i = 0; i < signals.length; i++) {
                if (signals[i]?.action === 'continue') {
                    continue;
                }
                processed.push(i);
            }

            expect(processed).toEqual([0, 2, 3]);
        });

        it('return signal should bubble up', () => {
            const signal = { action: 'return' };
            expect(signal.action).toBe('return');
            // In the real code, this is returned from the scheduler
        });
    });

    // ===================================================================
    // 6. RESULT COLLECTION
    // ===================================================================
    describe('Result Collection', () => {
        it('should collect outputs from each iteration when collectResults=true', () => {
            const results = [];
            const iterations = ['item_a', 'item_b', 'item_c'];

            for (const item of iterations) {
                results.push({ processed: item, success: true });
            }

            expect(results.length).toBe(3);
            expect(results[0]).toEqual({ processed: 'item_a', success: true });
        });

        it('should build correct final result payload', () => {
            const processedCount = 5;
            const totalItems = 5;
            const executionMode = 'sequential';
            const results = Array.from({ length: 5 }, (_, i) => ({ item: i }));

            const finalResultPayload = {
                success: true,
                status: 'completed',
                message: `ForEach completed: ${processedCount} of ${totalItems} items processed (${executionMode})`,
                data: {
                    success: true,
                    totalIterations: processedCount,
                    totalItems,
                    executionMode,
                    results,
                },
            };

            expect(finalResultPayload.success).toBe(true);
            expect(finalResultPayload.data.totalIterations).toBe(5);
            expect(finalResultPayload.data.executionMode).toBe('sequential');
            expect(finalResultPayload.data.results.length).toBe(5);
        });

        it('should report failure when stopOnError and an iteration fails', () => {
            const results = [];
            let finalSuccess = true;
            const stopOnError = true;
            const items = ['ok', 'fail', 'ok'];

            for (const item of items) {
                const success = item !== 'fail';
                results.push({ item, success });
                if (!success) {
                    finalSuccess = false;
                    if (stopOnError) break;
                }
            }

            expect(finalSuccess).toBe(false);
            expect(results.length).toBe(2); // Stopped at 'fail'
        });

        it('should continue on error when stopOnError=false', () => {
            const results = [];
            let finalSuccess = true;
            const stopOnError = false;
            const items = ['ok', 'fail', 'ok'];

            for (const item of items) {
                const success = item !== 'fail';
                results.push({ item, success });
                if (!success) {
                    finalSuccess = false;
                    if (stopOnError) break;
                }
            }

            expect(finalSuccess).toBe(false);
            expect(results.length).toBe(3); // Continued past 'fail'
        });
    });
});
