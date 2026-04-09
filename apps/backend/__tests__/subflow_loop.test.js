import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executionService } from '../services/ExecutionService.js';
import { variableManager } from '../services/VariableManager.js';
import { Flow } from '../database/init.js';

vi.mock('../database/init.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Flow: {
            findOne: vi.fn(),
        },
    };
});

describe('Sub-flow Loop Execution (Dive-in)', () => {
    beforeEach(() => {
        variableManager.clearAll();
        vi.clearAllMocks();
    });

    it('debe ejecutar los nodos de un flujo vinculado (flowId) correctamente', async () => {
        const flowId = 'subflow-123';

        // 1. Mock de la estructura del Loop (Dive-in)
        const loopNode = {
            nodeId: 'loop-dive-in',
            type: 'loop',
            data: {
                configuration: {
                    mode: 'count',
                    iterations: 1,
                    flowId: flowId,
                },
            },
        };

        // 2. Mock del flujo hijo (Dive-in)
        const childNode = {
            nodeId: 'child-in-subflow',
            type: 'log',
            parentId: null, // Tipicamente null en un flujo independiente
            data: { message: 'Hola desde subflujo' },
        };

        const subFlowMock = {
            id: flowId,
            nodes: [{ toJSON: () => childNode }],
            edges: [],
        };

        Flow.findOne.mockResolvedValue(subFlowMock);

        // 3. Spy en executeNode
        const executeNodeSpy = vi.spyOn(executionService, 'executeNode');
        executeNodeSpy.mockImplementation(async (node, nodes, edges, st) => {
            if (node.type === 'loop') {
                return await executionService.executeLoopContainer(node, nodes, edges, st);
            }
            return { success: true };
        });

        // 4. Ejecución del Loop
        const state = { runId: 'run-test', executedNodeIds: new Set() };
        const result = await executionService.executeLoopContainer(loopNode, [loopNode], [], state);

        // 5. Verificaciones
        expect(result.success).toBe(true);
        expect(Flow.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: flowId },
            }),
        );

        // El nodo hijo debe ser ejecutado
        const childExecutions = executeNodeSpy.mock.calls.filter(
            (call) => call[0].nodeId === 'child-in-subflow',
        );

        // EXPECTED TO FAIL BEFORE FIX: length should be 1
        expect(childExecutions.length).toBe(1);
    });
});
