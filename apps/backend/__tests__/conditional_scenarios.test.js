import { describe, it, expect, beforeEach } from 'vitest';
import { variableManager } from '../services/VariableManager.js';
import * as actions from '../controllers/action.controller.js';

// Helper: Create mock req/res for conditionalAction
const createMockReqRes = (body) => {
    let result = null;
    const req = {
        body: { debugMode: true, ...body },
        t: (k) => k,
    };
    const res = {
        statusCode: 200,
        status: (code) => {
            res.statusCode = code;
            return res;
        },
        json: (d) => {
            result = d;
            return res;
        },
    };
    return { req, res, getResult: () => result };
};

describe('Conditional Node Logic — Complete Validation', () => {
    beforeEach(() => {
        variableManager.clearAll();
    });

    // ============================================================
    // 1. VariableManager.get() — Dot-Path Resolution
    // ============================================================
    describe('VariableManager.get() Resolution', () => {
        it('should resolve exact key match', () => {
            variableManager.set('status', 200);
            expect(variableManager.get('status')).toBe(200);
        });

        it('should resolve dotted path: node.result -> drill into result', () => {
            variableManager.set('Set Username.result', {
                name: 'test_user',
                value: 'standard_user',
            });
            expect(variableManager.get('Set Username.result')).toEqual({
                name: 'test_user',
                value: 'standard_user',
            });
        });

        it('should resolve deep dotted path: Set Username.result.value', () => {
            variableManager.set('Set Username.result', {
                name: 'test_user',
                value: 'standard_user',
            });
            expect(variableManager.get('Set Username.result.value')).toBe('standard_user');
        });

        it('should resolve with .data skip: Set Username.data.value when stored as Set Username.result', () => {
            variableManager.set('Set Username.result', {
                name: 'test_user',
                value: 'standard_user',
            });
            // "data" skip: tries "Set Username.result" -> then drills "data.value"
            // Since result doesn't have "data" but has "value", it should skip "data" and return "value"
            expect(variableManager.get('Set Username.data.value')).toBe('standard_user');
        });

        it('should resolve multi-word node names with spaces', () => {
            variableManager.set('Login Steps.result', { success: true, message: 'Logged in' });
            expect(variableManager.get('Login Steps.result.success')).toBe(true);
        });

        it('should resolve (Library) suffix via normalization', () => {
            variableManager.set('Login Steps (Library).result', { success: true });
            expect(variableManager.get('Login Steps.result.success')).toBe(true);
        });

        it('should return undefined for non-existent variables', () => {
            expect(variableManager.get('nonexistent')).toBeUndefined();
            expect(variableManager.get('nonexistent.deep.path')).toBeUndefined();
        });

        it('should resolve run-scoped variables', () => {
            const runId = 'test-run-1';
            variableManager.initRun(runId);
            variableManager.set('myVar', 42, runId);
            expect(variableManager.get('myVar', runId)).toBe(42);
        });

        it('should not leak between runs', () => {
            variableManager.initRun('run-a');
            variableManager.initRun('run-b');
            variableManager.set('x', 'A', 'run-a');
            variableManager.set('x', 'B', 'run-b');
            expect(variableManager.get('x', 'run-a')).toBe('A');
            expect(variableManager.get('x', 'run-b')).toBe('B');
        });
    });

    // ============================================================
    // 2. resolveValue — Correct Return Types
    // ============================================================
    describe('resolveValue Correctness', () => {
        it('should return native type for single-variable template', () => {
            variableManager.set('count', 42);
            expect(variableManager.resolveValue('{{count}}')).toBe(42);
        });

        it('should return boolean for boolean variable', () => {
            variableManager.set('is_valid', true);
            expect(variableManager.resolveValue('{{is_valid}}')).toBe(true);
        });

        it('should return raw template for unresolvable single-variable', () => {
            const result = variableManager.resolveValue('{{nonexistent}}');
            expect(result).toBe('{{nonexistent}}');
        });

        it('should return mixed text with inline replacements', () => {
            variableManager.set('user', 'Andres');
            const result = variableManager.resolveValue('Hello {{user}}!');
            expect(result).toBe('Hello Andres!');
        });

        it('should handle ${ } syntax', () => {
            variableManager.set('status', 200);
            expect(variableManager.resolveValue('${status}')).toBe(200);
        });
    });

    // ============================================================
    // 3. evaluateCondition — Structured Rules
    // ============================================================
    describe('evaluateCondition', () => {
        it('should evaluate string equality', () => {
            variableManager.set('name', 'standard_user');
            const result = variableManager.evaluateCondition({
                left: '{{name}}',
                operator: '==',
                right: 'standard_user',
            });
            expect(result).toBe(true);
        });

        it('should evaluate string inequality', () => {
            variableManager.set('name', 'admin');
            const result = variableManager.evaluateCondition({
                left: '{{name}}',
                operator: '!=',
                right: 'standard_user',
            });
            expect(result).toBe(true);
        });

        it('should evaluate numeric with type coercion', () => {
            variableManager.set('statusCode', 200);
            const result = variableManager.evaluateCondition({
                left: '{{statusCode}}',
                operator: '==',
                right: '200',
            });
            expect(result).toBe(true);
        });

        it('should evaluate boolean with string coercion', () => {
            variableManager.set('success', true);
            const result = variableManager.evaluateCondition({
                left: '{{success}}',
                operator: '==',
                right: 'true',
            });
            expect(result).toBe(true);
        });

        it('should evaluate contains operator', () => {
            variableManager.set('message', 'Login exitoso para Andres');
            const result = variableManager.evaluateCondition({
                left: '{{message}}',
                operator: 'contains',
                right: 'Andres',
            });
            expect(result).toBe(true);
        });

        it('should evaluate greater than', () => {
            variableManager.set('count', 10);
            expect(
                variableManager.evaluateCondition({
                    left: '{{count}}',
                    operator: '>',
                    right: '5',
                }),
            ).toBe(true);
            expect(
                variableManager.evaluateCondition({
                    left: '{{count}}',
                    operator: '>',
                    right: '15',
                }),
            ).toBe(false);
        });

        it('should handle exists operator', () => {
            variableManager.set('myVar', 'test');
            expect(
                variableManager.evaluateCondition({
                    left: '{{myVar}}',
                    operator: 'exists',
                    right: '',
                }),
            ).toBe(true);
            expect(
                variableManager.evaluateCondition({
                    left: '{{nonexistent}}',
                    operator: 'exists',
                    right: '',
                }),
            ).toBe(false);
        });

        it('should return false for unresolvable left operand (not silently wrong)', () => {
            const result = variableManager.evaluateCondition({
                left: '{{nonexistent}}',
                operator: '==',
                right: 'anything',
            });
            expect(result).toBe(false);
        });
    });

    // ============================================================
    // 4. evaluate — JS Expressions
    // ============================================================
    describe('evaluate (JS expressions)', () => {
        it('should evaluate variable comparison', () => {
            variableManager.set('status', 200);
            expect(variableManager.evaluate('{{status}} === 200')).toBe(true);
        });

        it('should concatenate text with + operator', () => {
            variableManager.set('user', 'Andres');
            expect(variableManager.evaluate('{{user}} + " es el usuario"')).toBe(
                'Andres es el usuario',
            );
        });

        it('should resolve template when JS evaluation fails', () => {
            variableManager.set('user', 'Andres');
            const result = variableManager.evaluate('{{user}} es el usuario');
            expect(result).toBe('Andres es el usuario');
        });

        it('should preserve boolean type in evaluation', () => {
            variableManager.set('is_valid', true);
            const resJS = variableManager.evaluate('{{is_valid}} === true');
            expect(resJS).toBe(true);
        });
    });

    // ============================================================
    // 5. conditionalAction — Full Integration
    // ============================================================
    describe('conditionalAction Integration', () => {
        it('should route to matching branch (structured equality)', async () => {
            variableManager.set('status', 200);
            const { req, res, getResult } = createMockReqRes({
                branches: [
                    {
                        id: 'success',
                        label: 'Success',
                        expression: { left: '{{status}}', operator: '==', right: '200' },
                    },
                ],
                fallbackPath: 'fail',
            });

            await actions.conditionalAction(req, res);
            expect(getResult().data.path).toBe('success');
            expect(getResult().data.result).toBe(true);
        });

        it('should route to fallback when no branches match', async () => {
            variableManager.set('status', 404);
            const { req, res, getResult } = createMockReqRes({
                branches: [
                    {
                        id: 'success',
                        label: 'Success',
                        expression: { left: '{{status}}', operator: '==', right: '200' },
                    },
                ],
                fallbackPath: 'fail',
            });

            await actions.conditionalAction(req, res);
            expect(getResult().data.path).toBe('fail');
            expect(getResult().data.result).toBe(false);
        });

        it('should use first-match-wins semantics for multiple branches', async () => {
            variableManager.set('level', 'admin');
            const { req, res, getResult } = createMockReqRes({
                branches: [
                    {
                        id: 'admin_branch',
                        label: 'Admin',
                        expression: { left: '{{level}}', operator: '==', right: 'admin' },
                    },
                    {
                        id: 'user_branch',
                        label: 'User',
                        expression: { left: '{{level}}', operator: '==', right: 'admin' },
                    },
                ],
                fallbackPath: 'fallback',
            });

            await actions.conditionalAction(req, res);
            expect(getResult().data.path).toBe('admin_branch');
            // Verify second branch was skipped
            expect(getResult().data.trace.user_branch.status).toBe('skipped');
        });

        it('should match default/else branch (empty expression)', async () => {
            variableManager.set('status', 999);
            const { req, res, getResult } = createMockReqRes({
                branches: [
                    {
                        id: 'true',
                        label: 'True',
                        expression: { left: '{{status}}', operator: '==', right: '200' },
                    },
                    { id: 'false', label: 'Else', expression: '' },
                ],
                fallbackPath: 'false',
            });

            await actions.conditionalAction(req, res);
            expect(getResult().data.path).toBe('false');
        });

        it('should handle the EXACT scenario from the bug report (Set Username.data.value)', async () => {
            // Simulate what ExecutionService stores after a "Set Username" variable node runs
            const runId = 'test-run-bug';
            variableManager.initRun(runId);
            variableManager.set(
                'Set Username.result',
                {
                    name: 'test_user',
                    value: 'standard_user',
                    scope: 'flow',
                    operation: 'set',
                },
                runId,
            );

            const { req, res, getResult } = createMockReqRes({
                runId,
                branches: [
                    {
                        id: 'true',
                        label: 'True',
                        expression: {
                            left: '{{Set Username.data.value}}',
                            operator: '==',
                            right: 'standard_user',
                        },
                        mode: 'simple',
                    },
                    {
                        id: 'false',
                        label: 'Else',
                        expression: '',
                        mode: 'advanced',
                    },
                ],
                fallbackPath: 'false',
            });

            await actions.conditionalAction(req, res);
            const result = getResult();

            // This is the CRITICAL assertion — it should be 'true', NOT 'false'
            expect(result.data.path).toBe('true');
            expect(result.data.result).toBe(true);
            expect(result.data.trace.true.status).toBe('matched');
            expect(result.data.trace.true.matched).toBe(true);
            expect(result.data.trace.false.status).toBe('skipped');
        });

        it('should route to ELSE when condition is genuinely false', async () => {
            const runId = 'test-run-else';
            variableManager.initRun(runId);
            variableManager.set(
                'Set Username.result',
                {
                    name: 'test_user',
                    value: 'locked_out_user',
                    scope: 'flow',
                },
                runId,
            );

            const { req, res, getResult } = createMockReqRes({
                runId,
                branches: [
                    {
                        id: 'true',
                        label: 'True',
                        expression: {
                            left: '{{Set Username.data.value}}',
                            operator: '==',
                            right: 'standard_user',
                        },
                    },
                    {
                        id: 'false',
                        label: 'Else',
                        expression: '',
                    },
                ],
                fallbackPath: 'false',
            });

            await actions.conditionalAction(req, res);
            const result = getResult();

            // Path should be 'false' (the Else branch)
            expect(result.data.path).toBe('false');
            // The 'true' branch should NOT have matched
            expect(result.data.trace.true.matched).toBe(false);
            expect(result.data.trace.true.status).toBe('not_matched');
            // The 'false'/Else branch IS the matched one (it's the default)
            expect(result.data.trace.false.matched).toBe(true);
        });

        it('should handle contains operator in structured rule', async () => {
            variableManager.set('message', 'Login exitoso para Andres');
            const { req, res, getResult } = createMockReqRes({
                branches: [
                    {
                        id: 'is_andres',
                        label: 'Is Andres',
                        expression: { left: '{{message}}', operator: 'contains', right: 'Andres' },
                    },
                ],
                fallbackPath: 'fail',
            });

            await actions.conditionalAction(req, res);
            expect(getResult().data.path).toBe('is_andres');
        });

        it('should resolve (Library) suffix in variable names', async () => {
            variableManager.set('Login Steps (Library).result', { success: true });
            const { req, res, getResult } = createMockReqRes({
                branches: [
                    {
                        id: 'ok',
                        expression: {
                            left: '{{Login Steps.success}}',
                            operator: '==',
                            right: 'true',
                        },
                    },
                ],
                fallbackPath: 'fail',
            });

            await actions.conditionalAction(req, res);
            expect(getResult().data.path).toBe('ok');
        });

        it('should include trace with resolved values', async () => {
            variableManager.set('name', 'Andres');
            const { req, res, getResult } = createMockReqRes({
                branches: [
                    {
                        id: 'b1',
                        label: 'Match',
                        expression: { left: '{{name}}', operator: '==', right: 'Andres' },
                    },
                ],
                fallbackPath: 'fail',
            });

            await actions.conditionalAction(req, res);
            const trace = getResult().data.trace.b1;
            expect(trace.resolvedLeft).toBe('Andres');
            expect(trace.resolvedRight).toBe('Andres');
            expect(trace.matched).toBe(true);
        });
    });

    // ============================================================
    // 6. Utility Methods
    // ============================================================
    describe('VariableManager Utility Methods', () => {
        it('clearAll should reset run and legacy scopes', () => {
            variableManager.set('x', 1);
            variableManager.initRun('r1');
            variableManager.set('y', 2, 'r1');
            variableManager.clearAll();
            expect(variableManager.get('y', 'r1')).toBeUndefined();
        });

        it('clear should delete a specific run', () => {
            variableManager.initRun('run-x');
            variableManager.set('val', 42, 'run-x');
            variableManager.clear('run-x');
            expect(variableManager.get('val', 'run-x')).toBeUndefined();
        });

        it('increment should increase a numeric variable', () => {
            variableManager.set('counter', 0);
            variableManager.increment('counter', 5);
            expect(variableManager.get('counter')).toBe(5);
            variableManager.increment('counter');
            expect(variableManager.get('counter')).toBe(6);
        });

        it('push should add to an array', () => {
            variableManager.set('list', [1, 2]);
            variableManager.push('list', 3);
            expect(variableManager.get('list')).toEqual([1, 2, 3]);
        });

        it('push should create array if variable does not exist', () => {
            // Use a unique name to avoid leaking from other tests
            variableManager.push('freshList', 'a');
            expect(variableManager.get('freshList')).toEqual(['a']);
        });

        it('delete should remove a specific variable', () => {
            const runId = 'run-del';
            variableManager.initRun(runId);
            variableManager.set('temp', 'value', runId);
            expect(variableManager.get('temp', runId)).toBe('value');
            variableManager.delete('temp', runId);
            expect(variableManager.get('temp', runId)).toBeUndefined();
        });
    });
});
