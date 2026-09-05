import { describe, it, expect, beforeEach } from 'vitest';
import * as actions from '../controllers/action.controller.js';
import { variableManager } from '../services/VariableManager.js';

describe('Logic Engine Nodes Validation', () => {
    beforeEach(() => {
        // Clear variables before each test to ensure isolation
        variableManager.clearAll();
    });

    // 0. VariableManager Core
    describe('VariableManager Core', () => {
        it('debe resolver valores manteniendo el tipo original (resolveValue)', () => {
            variableManager.set('count', 10);
            variableManager.set('isActive', true);

            expect(variableManager.resolveValue('${count}')).toBe(10);
            expect(variableManager.resolveValue('${isActive}')).toBe(true);
            expect(variableManager.resolveValue('Count is ${count}')).toBe('Count is 10');
        });

        it('debe tener acceso a Math, Date y JSON en las expresiones', () => {
            variableManager.set('val', 5.7);
            expect(variableManager.evaluate('Math.round(${val})')).toBe(6);
            expect(variableManager.evaluate('Date.now()')).toBeTypeOf('number');
            expect(variableManager.evaluate('JSON.stringify({a:1})')).toBe('{"a":1}');
        });

        it('debe resolver de forma flexible variables con prefijos de accion como "Set Username" usando "Username"', () => {
            // Caso 1: Guardado como "Set Username.result" con objeto data.value
            variableManager.set('Set Username.result', {
                success: true,
                status: 'success',
                data: { name: 'Username', value: 'standard_user' },
            });

            // Debe resolver "Username.value" a "standard_user"
            expect(variableManager.get('Username.value')).toBe('standard_user');
            expect(variableManager.resolveValue('{{Username.value}}')).toBe('standard_user');
            expect(variableManager.resolveValue('${Username.value}')).toBe('standard_user');

            // Caso 2: Guardado como "Enter Password" con valor directo string
            variableManager.set('Enter Password', 'secret_sauce');
            expect(variableManager.get('Password')).toBe('secret_sauce');
            expect(variableManager.resolveValue('{{Password}}')).toBe('secret_sauce');
        });
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

        it('debe omitir la asignación si la variable fue inicializada desde un dataset', async () => {
            // Seed variable user_role in run scope
            const runId = 'run-dataset-test';
            variableManager.initRun(runId, { user_role: 'dataset_user' });

            const req = {
                body: {
                    operation: 'set',
                    name: 'user_role',
                    value: 'default_user',
                    scope: 'flow',
                    runId,
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

            await actions.variableAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.skipped).toBe(true);
            // Verify variable manager still returns the dataset user, not the default
            expect(variableManager.get('user_role', runId)).toBe('dataset_user');
        });

        it('debe permitir sobrescribir si isDynamicValue es true aunque venga de dataset', async () => {
            const runId = 'run-dataset-dynamic-test';
            variableManager.initRun(runId, { counter: 10 });

            const req = {
                body: {
                    operation: 'set',
                    name: 'counter',
                    value: 11, // Simulated resolved value of {{counter}} + 1
                    scope: 'flow',
                    runId,
                    isDynamicValue: true,
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

            await actions.variableAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.skipped).toBeUndefined();
            // Verify variable manager now has the updated value
            expect(variableManager.get('counter', runId)).toBe(11);
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

        it('debe evaluar múltiples ramas dinámicas y devolver el trace completo', async () => {
            const req = {
                body: {
                    branches: [
                        { id: 'admin', label: 'Admin', expression: 'false' },
                        { id: 'user', label: 'User', expression: 'true' },
                        { id: 'guest', label: 'Guest', expression: 'true' },
                    ],
                    fallbackPath: 'error',
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

            await actions.conditionalAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.path).toBe('user');
            expect(result.data.trace.admin.status).toBe('not_matched');
            expect(result.data.trace.user.status).toBe('matched');
            expect(result.data.trace.guest.status).toBe('skipped');
        });

        it('debe devolver fallbackPath si ninguna rama dinámica coincide', async () => {
            const req = {
                body: {
                    branches: [{ id: 'admin', label: 'Admin', expression: 'false' }],
                    fallbackPath: 'guest',
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

            await actions.conditionalAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.path).toBe('guest');
        });

        it('debe usar la rama explícita Else como Default cuando ninguna coincide', async () => {
            const req = {
                body: {
                    branches: [
                        { id: 'admin', label: 'Admin', expression: 'false' },
                        { id: 'false', label: 'Else', expression: '' },
                    ],
                    fallbackPath: 'error',
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

            await actions.conditionalAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.path).toBe('false');
            expect(result.data.trace.false.status).toBe('matched');
        });

        it('debe usar fallbackPath si hay una rama vacía NO marcada como Else', async () => {
            const req = {
                body: {
                    branches: [
                        { id: 'admin', label: 'Admin', expression: 'false' },
                        { id: 'default', label: 'Others', expression: '', isFallback: false },
                    ],
                    fallbackPath: 'error',
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

            await actions.conditionalAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.path).toBe('error');
            expect(result.data.trace.default.status).toBe('not_matched');
        });

        it('debe reportar errores de evaluación en el trace', async () => {
            const req = {
                body: {
                    branches: [
                        { id: 'buggy', label: 'Buggy', expression: 'undefined_var.something' },
                    ],
                    fallbackPath: 'fallback',
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

            await actions.conditionalAction(req, res);

            expect(result.success).toBe(true);
            expect(result.data.path).toBe('fallback');
            expect(result.data.trace.buggy.status).toBe('error');
            expect(result.data.trace.buggy.error).toBeDefined();
        });
    });

    // 3. Switch Node
    describe('Switch Node', () => {
        it('debe devolver la ruta correcta para un caso coincidente (objeto)', async () => {
            variableManager.set('role', 'admin');
            const req = {
                body: {
                    variableName: '${role}',
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
            expect(result.path).toBe('admin_view');
            expect(result.data.path).toBe('admin_view');
            expect(result.data.targetPath).toBe('admin_view');
        });

        it('debe devolver la ruta correcta para un caso coincidente (array)', async () => {
            variableManager.set('status_code', 200);
            const req = {
                body: {
                    variableName: '${status_code}',
                    cases: [
                        { value: '200', id: 'success_path' },
                        { value: '404', id: 'not_found_path' },
                    ],
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
            expect(result.path).toBe('success_path');
            expect(result.data.path).toBe('success_path');
            expect(result.data.targetPath).toBe('success_path');
        });

        it('debe devolver "default" si no hay coincidencia y existe default en el mapa', async () => {
            variableManager.set('status_code', 500);
            const req = {
                body: {
                    variableName: '${status_code}',
                    cases: { 200: 'ok', default: 'fallback_path' },
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
            expect(result.data.targetPath).toBe('fallback_path');
        });

        it('debe admitir comparacion "contains"', async () => {
            variableManager.set('username', 'standard_user_active');
            const req = {
                body: {
                    configuration: {
                        variableName: '${username}',
                        comparisonType: 'contains',
                        cases: [
                            { value: 'active', id: 'active_path' },
                            { value: 'inactive', id: 'inactive_path' },
                        ],
                    },
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
            expect(result.path).toBe('active_path');
        });

        it('debe admitir comparacion "startsWith" y "endsWith"', async () => {
            variableManager.set('log_msg', 'ERROR: database timeout');
            const req = {
                body: {
                    configuration: {
                        variableName: '${log_msg}',
                        comparisonType: 'startsWith',
                        cases: [
                            { value: 'ERROR', id: 'err_path' },
                            { value: 'INFO', id: 'info_path' },
                        ],
                    },
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
            expect(result.path).toBe('err_path');
        });

        it('debe admitir comparacion "regex"', async () => {
            variableManager.set('email', 'test@google.com');
            const req = {
                body: {
                    configuration: {
                        variableName: '${email}',
                        comparisonType: 'regex',
                        cases: [
                            { value: '@google\\.com$', id: 'google_path' },
                            { value: '@yahoo\\.com$', id: 'yahoo_path' },
                        ],
                    },
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
            expect(result.path).toBe('google_path');
        });

        it('debe mantener tipos exactos y no realizar coercion agresiva de "0"->false o "1"->true', async () => {
            // String "0" shouldn't match Boolean false when comparisonType is equals
            variableManager.set('val', '0');
            const req = {
                body: {
                    configuration: {
                        variableName: '${val}',
                        comparisonType: 'equals',
                        cases: [
                            { value: 'false', id: 'bool_false' },
                            { value: '0', id: 'str_zero' },
                        ],
                    },
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
            expect(result.path).toBe('str_zero'); // Should match exact string "0" (normalized to number 0) rather than boolean false
        });

        it('debe retornar default cuando el valor es undefined (variable no existe)', async () => {
            // Variable not set — resolveValue returns the placeholder string, which gets treated as undefined
            const req = {
                body: {
                    configuration: {
                        variableName: '${nonExistentVar}',
                        comparisonType: 'equals',
                        cases: [
                            { value: 'admin', id: 'admin_path' },
                            { value: 'user', id: 'user_path' },
                        ],
                    },
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
            expect(result.data.path).toBe('default');
            expect(result.data.matchedCaseId).toBeNull();
        });

        it('debe retornar default cuando el valor es null', async () => {
            variableManager.set('nullVal', null);
            const req = {
                body: {
                    configuration: {
                        variableName: '${nullVal}',
                        comparisonType: 'equals',
                        cases: [{ value: 'something', id: 'some_path' }],
                    },
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
            expect(result.data.path).toBe('default');
        });

        it('debe NO convertir strings hex o notacion cientifica a numeros', async () => {
            // "0x1A" should NOT normalize to 26, it should stay as the string "0x1A"
            variableManager.set('hexVal', '0x1A');
            const req = {
                body: {
                    configuration: {
                        variableName: '${hexVal}',
                        comparisonType: 'equals',
                        cases: [
                            { value: '26', id: 'numeric_path' },
                            { value: '0x1A', id: 'hex_path' },
                        ],
                    },
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
            expect(result.path).toBe('hex_path'); // Should match the literal string, not the numeric conversion
        });

        it('debe comparar case values que contienen referencias a variables', async () => {
            variableManager.set('threshold', 100);
            variableManager.set('currentValue', 100);
            const req = {
                body: {
                    configuration: {
                        variableName: '${currentValue}',
                        comparisonType: 'equals',
                        cases: [
                            { value: '${threshold}', id: 'threshold_match' },
                            { value: '999', id: 'other_path' },
                        ],
                    },
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
            expect(result.path).toBe('threshold_match');
        });

        it('debe manejar correctamente un array de cases donde ninguno coincide (solo default)', async () => {
            variableManager.set('color', 'purple');
            const req = {
                body: {
                    configuration: {
                        variableName: '${color}',
                        comparisonType: 'equals',
                        cases: [
                            { value: 'red', id: 'red_path' },
                            { value: 'blue', id: 'blue_path' },
                            { value: 'green', id: 'green_path' },
                        ],
                    },
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
            expect(result.data.path).toBe('default');
            expect(result.data.matchedCaseId).toBeNull();
            // Verify all cases were traced
            expect(Object.keys(result.data.trace)).toHaveLength(3);
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

    // 8. SHORT-CIRCUITING: the decision engine must stop evaluating as soon as
    //    the first valid condition/case matches, so later cases/branches are
    //    never evaluated (preventing both delay and side effects on them).
    describe('Short-Circuiting', () => {
        it('switch deja de evaluar casos tras la primera coincidencia', async () => {
            variableManager.set('status', 'ok');
            const req = {
                body: {
                    nodeId: 'switch-1',
                    variableName: '${status}',
                    cases: [
                        { value: 'ok', id: 'ok_path' },
                        { value: 'maybe_matches', id: 'second_path' },
                        { value: 'ok', id: 'dup_path' },
                    ],
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

            expect(result.path).toBe('ok_path');
            // Only the first case was evaluated: the later cases are absent
            // from the trace, proving they were skipped (short-circuited).
            expect(Object.keys(result.data.trace)).toEqual(['ok_path']);
        });

        it('switch enruta al caso default sin evaluar todo cuando no hay match', async () => {
            variableManager.set('status', 'unknown-value');
            const req = {
                body: {
                    nodeId: 'switch-2',
                    variableName: '${status}',
                    cases: [
                        { value: 'a', id: 'a_path' },
                        { value: 'b', id: 'b_path' },
                        { value: 'c', id: 'c_path' },
                    ],
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

            expect(result.path).toBe('default');
        });

        it('conditional deja de evaluar ramas tras la primera coincidencia', async () => {
            variableManager.set('role', 'admin');
            const req = {
                body: {
                    nodeId: 'cond-1',
                    branches: [
                        {
                            id: 'admin',
                            label: 'Admin',
                            expression: {
                                left: '${role}',
                                operator: '===',
                                right: 'admin',
                            },
                        },
                        {
                            id: 'guest',
                            label: 'Guest',
                            expression: {
                                left: '${role}',
                                operator: '===',
                                right: 'guest',
                            },
                        },
                    ],
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

            await actions.conditionalAction(req, res);

            expect(result.data.path).toBe('admin');
            // The admin branch matched first (short-circuit). The guest branch
            // was never evaluated — it is only marked as skipped in the trace,
            // never as 'matched'/'not_matched' (which would indicate evaluation).
            expect(result.data.trace.admin).toMatchObject({
                matched: true,
                status: 'matched',
            });
            expect(result.data.trace.guest).toMatchObject({
                matched: false,
                status: 'skipped',
            });
        });
    });

    // Regression: find_element must emit a consistent { found: true/false }
    // payload so "{{<node>.found}}" resolves to the real boolean instead of
    // staying as the literal "{{...}}" string. A not-found element used to
    // throw (soft-failing the node in Draft Mode and skipping storeNodeResult),
    // which left the placeholder unresolved in the downstream Conditional.
    // This block validates that once a node stores a not-found payload, the
    // Conditional resolves the interpolated variable correctly.
    describe('Find Element -> Conditional variable resolution (regression)', () => {
        it('resolves {{Find Element.found}} to the stored boolean (not the literal)', () => {
            variableManager.storeNodeResult(
                'node_find',
                { label: 'Find Element', customLabel: 'Find Element' },
                { found: false, visible: false, state: 'visible' },
            );

            expect(variableManager.resolveValue('{{Find Element.found}}')).toBe(false);
            expect(variableManager.resolveValue('{{Find Element.result.found}}')).toBe(false);
        });

        it('resolves {{Find Element.found}} to true when the element exists', () => {
            variableManager.storeNodeResult(
                'node_find',
                { label: 'Find Element', customLabel: 'Find Element' },
                { found: true, visible: true, state: 'visible' },
            );

            expect(variableManager.resolveValue('{{Find Element.found}}')).toBe(true);
        });

        it('leaves the placeholder literal only when the upstream node is absent', () => {
            expect(variableManager.resolveValue('{{Missing Node.found}}')).toBe(
                '{{Missing Node.found}}',
            );
        });
    });

    // Task: typed evaluation without manual coercion. Once a variable resolves
    // to a real boolean, comparing it against the "true"/"false" strings that
    // the UI's adaptive Value field produces must work without the user having
    // to type-cast anything.
    describe('Typed boolean evaluation (no manual conversion)', () => {
        it('matches a resolved boolean true against the string "true"', () => {
            variableManager.storeNodeResult(
                'node_find_1',
                { label: 'Find Element', customLabel: 'Find Element' },
                { found: true },
            );

            expect(
                variableManager.evaluateStructured({
                    left: '{{Find Element.found}}',
                    operator: '==',
                    right: 'true',
                }),
            ).toBe(true);
        });

        it('matches a resolved boolean false against the string "false"', () => {
            variableManager.storeNodeResult(
                'node_find_2',
                { label: 'Find Element', customLabel: 'Find Element' },
                { found: false },
            );

            expect(
                variableManager.evaluateStructured({
                    left: '{{Find Element.found}}',
                    operator: '==',
                    right: 'false',
                }),
            ).toBe(true);
        });

        it('does not match a boolean true against "false"', () => {
            variableManager.storeNodeResult(
                'node_find_3',
                { label: 'Find Element', customLabel: 'Find Element' },
                { found: true },
            );

            expect(
                variableManager.evaluateStructured({
                    left: '{{Find Element.found}}',
                    operator: '==',
                    right: 'false',
                }),
            ).toBe(false);
        });
    });
});
