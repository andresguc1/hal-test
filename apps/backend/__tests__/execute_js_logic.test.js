import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeJsAction } from '../controllers/action.controller.js';
import { globalStateManager } from '../services/stateManager.js';
import { browserService } from '../services/browser.service.js';

// Mock dependencies
vi.mock('../services/browser.service.js', () => ({
    browserService: {
        keys: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock('../services/trace.service.js', () => ({
    traceService: {
        add: vi.fn(),
    },
}));

const mockPage = {
    evaluate: vi.fn(),
    isClosed: vi.fn().mockReturnValue(false),
};

const mockContext = {
    pages: vi.fn().mockReturnValue([mockPage]),
    browser: vi.fn(),
};

const mockBrowser = {
    isConnected: vi.fn().mockReturnValue(true),
    contexts: vi.fn().mockReturnValue([mockContext]),
};

const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
};

const mockReq = (body) => ({
    body: { ...body, browserId: 'mock-browser-id' },
});

describe('executeJsAction Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        globalStateManager.clearAllVariables();

        // Setup browserService mock to return our mock browser
        browserService.keys.mockReturnValue(['mock-browser-id']);
        browserService.get.mockReturnValue({ browser: mockBrowser });
    });

    it('should execute script without args', async () => {
        const script = '() => 1 + 1';
        mockPage.evaluate.mockResolvedValue(2);

        await executeJsAction(mockReq({ script }), mockRes);

        expect(mockPage.evaluate).toHaveBeenCalledWith(script, undefined);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                message: 'Script ejecutado exitosamente',
            }),
        );
    });

    it('should parse JSON string args', async () => {
        const script = '(args) => args[0]';
        const args = '["hello", 123]';
        mockPage.evaluate.mockResolvedValue('hello');

        await executeJsAction(mockReq({ script, args }), mockRes);

        expect(mockPage.evaluate).toHaveBeenCalledWith(script, ['hello', 123]);
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid JSON args', async () => {
        const script = '() => {}';
        const args = '{invalid json}';

        await executeJsAction(mockReq({ script, args }), mockRes);

        // executePlaywrightAction catches the error and returns 500
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.stringContaining("Error al parsear 'args'"),
            }),
        );
    });

    it('should store return value in globalStateManager if requested', async () => {
        const script = '() => "result"';
        const variableName = 'myVar';
        mockPage.evaluate.mockResolvedValue('result');

        await executeJsAction(
            mockReq({
                script,
                returnValue: true,
                variableName,
            }),
            mockRes,
        );

        expect(globalStateManager.getVariable(variableName)).toBe('result');
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    stored: true,
                    variableName: 'myVar',
                    result: 'result',
                }),
            }),
        );
    });

    it('should handle script execution errors', async () => {
        const script = '() => { throw new Error("Boom"); }';
        mockPage.evaluate.mockRejectedValue(new Error('Boom'));

        await executeJsAction(mockReq({ script }), mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: expect.stringContaining('Error en la ejecución del script inyectado: Boom'),
            }),
        );
    });
});
