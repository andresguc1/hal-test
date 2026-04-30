import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inputAction, outputAction, componentAction } from '../controllers/action.controller.js';
import { variableManager } from '../services/VariableManager.js';
import { Flow } from '../database/init.js';

vi.mock('../database/init.js', () => ({
    Flow: {
        findByPk: vi.fn(),
    },
    Node: {},
    Edge: {},
    HealingLog: {},
}));

vi.mock('../socket.js', () => ({
    emitLog: vi.fn(),
    emitExecutionStatus: vi.fn(),
    emitScreenshotReady: vi.fn(),
}));

const runSequenceMock = vi.fn().mockResolvedValue(null);
vi.mock('../services/ExecutionService.js', () => {
    return {
        ExecutionService: class {
            runSequence = runSequenceMock;
        },
    };
});

describe('Module Composition Actions', () => {
    beforeEach(() => {
        variableManager.clearAll();
        vi.clearAllMocks();
        runSequenceMock.mockResolvedValue(null);
    });

    describe('inputAction', () => {
        it('should use default value if variable is missing', async () => {
            const req = { body: { name: 'param1', defaultValue: 'default-val' } };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            await inputAction(req, res);

            expect(variableManager.get('param1')).toBe('default-val');
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: { name: 'param1', value: 'default-val' },
                }),
            );
        });

        it('should NOT overwrite existing variable with default', async () => {
            variableManager.set('param1', 'existing-val');
            const req = { body: { name: 'param1', defaultValue: 'default-val' } };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            await inputAction(req, res);

            expect(variableManager.get('param1')).toBe('existing-val');
        });
    });

    describe('outputAction', () => {
        it('should resolve and set output variable', async () => {
            variableManager.set('local_res', 123);
            const req = { body: { name: 'final_res', value: '${local_res}' } };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            await outputAction(req, res);

            expect(variableManager.get('final_res')).toBe(123);
        });
    });

    describe('componentAction', () => {
        it('should map inputs before execution and outputs after', async () => {
            // Mock subflow data
            const mockSubflow = {
                nodes: [{ nodeId: 'node-1', type: 'entry', data: {} }],
                edges: [],
            };
            Flow.findByPk.mockResolvedValue(mockSubflow);

            variableManager.set('source_var', 'hello');

            const req = {
                body: {
                    configuration: {
                        flowId: 'subflow-123',
                        inputMapping: [{ parentVar: '${source_var}', childVar: 'dest_var' }],
                        outputMapping: [{ childVar: 'result_var', parentVar: 'final_result' }],
                    },
                    nodeId: 'comp-node',
                },
            };
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

            // We need to simulate that runSequence sets the result_var
            runSequenceMock.mockImplementation(async () => {
                variableManager.set('result_var', 'world');
            });

            await componentAction(req, res);

            // Check input mapping
            expect(variableManager.get('dest_var')).toBe('hello');

            // Check output mapping
            expect(variableManager.get('final_result')).toBe('world');

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
