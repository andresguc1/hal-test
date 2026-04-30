import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executionService } from '../services/ExecutionService.js';
import { variableManager } from '../services/VariableManager.js';

describe('Composition Loop Execution', () => {
    beforeEach(() => {
        variableManager.clearAll();
        vi.clearAllMocks();
    });

    it('debe ejecutar los nodos hijos el número de veces especificado en modo count', async () => {
        // 1. Mock de Estructura de Nodos
        const loopNode = {
            nodeId: 'loop-1',
            type: 'loop',
            data: {
                configuration: {
                    mode: 'count',
                    iterations: 2,
                    indexVar: 'currIdx',
                },
            },
        };

        const childNode = {
            nodeId: 'child-1',
            type: 'log_action', // Tipo ficticio para prueba
            parentId: 'loop-1',
            data: { message: 'Hola desde el loop ${currIdx}' },
        };

        const allNodes = [loopNode, childNode];
        const allEdges = []; // No hay aristas internas en este ejemplo simple

        const state = {
            runId: 'test-run',
            executedNodeIds: new Set(),
            variables: {},
        };

        // 2. Spy en executeNode para contar ejecuciones
        // Necesitamos mockear el handler para 'log_action' en actions
        // Pero executeNode llama a actions[handlerName]
        // Vamos a mockear executeNode directamente para simplificar el test de orquestación
        const executeNodeSpy = vi.spyOn(executionService, 'executeNode');

        // Mocking executeNode implementation to avoid calling real controllers
        executeNodeSpy.mockImplementation(async (node, nodes, edges, st) => {
            if (node.type === 'loop') {
                return await executionService.executeLoopContainer(node, nodes, edges, st);
            }
            return { success: true, data: { msg: 'executed' } };
        });

        // 3. Ejecución
        const result = await executionService.executeLoopContainer(
            loopNode,
            allNodes,
            allEdges,
            state,
        );

        // 4. Verificaciones
        expect(result.success).toBe(true);
        expect(result.data.totalIterations).toBe(2);

        // Se debió llamar a executeNode 3 veces:
        // 1 vez por el loop (aunque lo llamamos manualmente en el test)
        // 2 veces por el hijo (una por cada iteración)
        // Pero en executeLoopContainer llamamos a runSequence, que llama a executeNode para el hijo.

        // Verificamos cuantas veces se ejecutó el hijo
        const childExecutions = executeNodeSpy.mock.calls.filter(
            (call) => call[0].nodeId === 'child-1',
        );
        expect(childExecutions.length).toBe(2);
    });

    it('debe iterar sobre una lista en modo array y exponer las variables', async () => {
        variableManager.set('users', ['Alice', 'Bob']);

        const loopNode = {
            nodeId: 'loop-array',
            type: 'loop',
            data: {
                configuration: {
                    mode: 'array',
                    array: 'users',
                    itemVar: 'user',
                },
            },
        };

        const childNode = {
            nodeId: 'child-log',
            type: 'log',
            parentId: 'loop-array',
            data: {},
        };

        const allNodes = [loopNode, childNode];
        const allEdges = [];
        const state = { runId: 'run-2', executedNodeIds: new Set() };

        const childCalls = [];
        vi.spyOn(executionService, 'executeNode').mockImplementation(
            async (node, nodes, edges, st) => {
                if (node.type === 'loop')
                    return await executionService.executeLoopContainer(node, nodes, edges, st);

                // Verificar variables en cada ejecución
                const currentUser = variableManager.get('user', st.runId);
                if (node.nodeId === 'child-log') {
                    childCalls.push({ nodeId: node.nodeId, user: currentUser });
                }
                return { success: true };
            },
        );

        await executionService.executeLoopContainer(loopNode, allNodes, allEdges, state);

        expect(childCalls.length).toBe(2);

        // Verificar que las variables cambiaron entre ejecuciones
        expect(childCalls[0].user).toBe('Alice');
        expect(childCalls[1].user).toBe('Bob');
    });
});
