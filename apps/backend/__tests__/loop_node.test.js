import { describe, it, expect, beforeEach } from 'vitest';
import * as actions from '../controllers/action.controller.js';
import { variableManager } from '../services/VariableManager.js';

describe('Loop Node Validation', () => {
    beforeEach(() => {
        variableManager.clearAll();
    });

    const mockRes = () => {
        const res = {
            status: () => res,
            json: (d) => {
                res.data = d;
                return res;
            },
            data: null,
        };
        return res;
    };

    const mockReq = (body) => ({
        body,
        t: (k) => k,
    });

    // 1. Mode: COUNT
    describe('Mode: count', () => {
        it('debe iterar N veces y luego completar', async () => {
            const nodeId = 'loop_123';
            const iterations = 3;
            const req = mockReq({ nodeId, mode: 'count', iterations });

            // Iteración 0
            let res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('body');
            expect(res.data.data.index).toBe(0);
            expect(variableManager.get('i')).toBe(0);

            // Iteración 1
            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('body');
            expect(res.data.data.index).toBe(1);
            expect(variableManager.get('i')).toBe(1);

            // Iteración 2
            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('body');
            expect(res.data.data.index).toBe(2);
            expect(variableManager.get('i')).toBe(2);

            // Finalización
            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('completed');
            expect(res.data.data.totalIterations).toBe(3);

            // Verificar limpieza de estado
            expect(variableManager.has(`_loop_state_${nodeId}`)).toBe(false);
        });
    });

    // 2. Mode: ARRAY
    describe('Mode: array', () => {
        it('debe iterar sobre los elementos de un array literal', async () => {
            const nodeId = 'loop_array';
            const array = ['apple', 'banana'];
            const req = mockReq({ nodeId, mode: 'array', array, itemVar: 'fruit' });

            // 'apple'
            let res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('body');
            expect(res.data.data.item).toBe('apple');
            expect(variableManager.get('fruit')).toBe('apple');

            // 'banana'
            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('body');
            expect(res.data.data.item).toBe('banana');
            expect(variableManager.get('fruit')).toBe('banana');

            // Completed
            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('completed');
        });

        it('debe iterar sobre un array almacenado en una variable', async () => {
            variableManager.set('myList', [10, 20]);
            const nodeId = 'loop_var_array';
            const req = mockReq({ nodeId, mode: 'array', array: 'myList' });

            let res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.item).toBe(10);

            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.item).toBe(20);

            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('completed');
        });
    });

    // 3. Mode: WHILE
    describe('Mode: while', () => {
        it('debe iterar mientras la condición sea verdadera', async () => {
            variableManager.set('counter', 0);
            const nodeId = 'loop_while';
            const req = mockReq({ nodeId, mode: 'while', condition: 'counter < 2' });

            // Iteración 1
            let res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('body');

            // Simulamos incremento en el cuerpo del loop
            variableManager.increment('counter');

            // Iteración 2
            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('body');
            variableManager.increment('counter');

            // Finalización
            res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('completed');
        });
    });

    // 4. Safety: MAX ITERATIONS
    describe('Safety', () => {
        it('debe forzar finalización si se alcanza maxIterations', async () => {
            const nodeId = 'loop_unsafe';
            const req = mockReq({ nodeId, mode: 'count', iterations: 100, maxIterations: 5 });

            // Ejecutar 5 veces
            for (let i = 0; i < 5; i++) {
                await actions.loopAction(req, mockRes());
            }

            // La sexta debe completar por seguridad
            let res = mockRes();
            await actions.loopAction(req, res);
            expect(res.data.data.path).toBe('completed');
        });
    });
});
