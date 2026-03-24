import { describe, it, expect, beforeEach } from 'vitest';
import * as actions from '../controllers/action.controller.js';
import { variableManager } from '../services/VariableManager.js';

describe('Logic Engine Nodes Validation', () => {
    beforeEach(() => {
        // Clear variables before each test to ensure isolation
        variableManager.clearAll();
    });

    // 1. Variable Node
    describe('Variable Node', () => {
        it('debe establecer una variable (set)', async () => {
            const req = {
                body: { operation: 'set', name: 'counter', value: 10, scope: 'flow' },
                t: (k) => k,
            };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.variableAction(req, res);

            expect(result.success).toBe(true);
            expect(variableManager.get('counter')).toBe(10);
        });

        it('debe incrementar una variable (increment)', async () => {
            variableManager.set('counter', 5);
            const req = {
                body: { operation: 'increment', name: 'counter', value: 3, scope: 'flow' },
                t: (k) => k,
            };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.variableAction(req, res);

            expect(result.success).toBe(true);
            expect(variableManager.get('counter')).toBe(8);
        });
    });

    // 2. Conditional Node
    describe('Conditional Node', () => {
        it('debe evaluar condición simple verdadera', async () => {
            const req = {
                body: { conditions: [{ left: '5', operator: '>', right: '3' }], logic: 'AND' },
                t: (k) => k,
            };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.conditionalAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.result).toBe(true);
            expect(result.data.path).toBe('true');
        });

        it('debe evaluar condición simple falsa', async () => {
            const req = {
                body: { conditions: [{ left: '2', operator: '>', right: '8' }], logic: 'AND' },
                t: (k) => k,
            };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.conditionalAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.result).toBe(false);
            expect(result.data.path).toBe('false');
        });
    });

    // 3. Switch Node
    describe('Switch Node', () => {
        it('debe devolver la ruta correcta para un caso coincidente', async () => {
            variableManager.set('role', 'admin');
            const req = {
                body: {
                    variableName: 'role',
                    cases: { admin: 'admin_view', guest: 'guest_view', default: 'error_view' },
                },
                t: (k) => k,
            };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.switchAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.targetPath).toBe('admin_view');
        });
    });

    // 4. Transform Node
    describe('Transform Node', () => {
        it('debe mapear un array correctamente', async () => {
            variableManager.set('items', [1, 2, 3]);
            const req = {
                body: {
                    operation: 'map',
                    input: 'items',
                    expression: 'item * 2', // Verified pure expression
                    outputVar: 'doubles',
                },
                t: (k) => k,
            };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.transformAction(req, res);

            expect(result.success).toBe(true);
            expect(variableManager.get('doubles')).toEqual([2, 4, 6]);
        });
    });

    // 5. Backend JS Node
    describe('Backend JS Node', () => {
        it('debe ejecutar código JS y guardar el resultado', async () => {
            variableManager.set('a', 10);
            variableManager.set('b', 20);
            const req = {
                body: {
                    expression: '${a} + ${b}', // Use interpolation to trigger evaluation
                    outputVar: 'sumResult',
                },
                t: (k) => k,
            };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.backendJsAction(req, res);

            expect(result.success).toBe(true);
            expect(variableManager.get('sumResult')).toBe(30);
        });
    });

    // 6. Fail Flow Node
    describe('Fail Flow Node', () => {
        it('debe devolver success: false para abortar el flujo', async () => {
            const req = { body: { message: 'Forced Failure' }, t: (k) => k };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.failFlowAction(req, res);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Forced Failure');
        });
    });

    // 7. Wait Conditional Node
    describe('Wait Conditional Node', () => {
        it('debe evaluar variables en espera condicional', async () => {
            variableManager.set('loaded', true);
            const req = {
                body: {
                    waitType: 'variable',
                    expression: JSON.stringify([
                        { left: '${loaded}', operator: '===', right: 'true' },
                    ]),
                },
                t: (k) => k,
            };
            let result = null;
            const res = {
                status: () => res,
                json: (d) => {
                    result = d;
                    return res;
                },
            };

            await actions.waitConditionalAction(req, res);

            expect(result.success).toBe(true);
        });
    });
});
