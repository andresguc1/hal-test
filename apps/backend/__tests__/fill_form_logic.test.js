import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fillFormAction } from '../controllers/action.controller.js';
import { browserService } from '../services/browser.service.js';

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

const mockLocator = {
    waitFor: vi.fn(),
    fill: vi.fn(),
    type: vi.fn(),
};

const mockPage = {
    locator: vi.fn().mockReturnValue(mockLocator),
    waitForNavigation: vi.fn(),
    evaluate: vi.fn().mockResolvedValue(undefined),
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
    t: (key) => key,
});

describe('fillFormAction Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        browserService.keys.mockReturnValue(['mock-browser-id']);
        browserService.get.mockReturnValue({ browser: mockBrowser });

        mockLocator.waitFor.mockResolvedValue(undefined);
        mockLocator.fill.mockResolvedValue(undefined);
        mockLocator.type.mockResolvedValue(undefined);
        mockPage.waitForNavigation.mockResolvedValue(undefined);
    });

    it('should throw an error if formSelector is missing', async () => {
        await fillFormAction(mockReq({}), mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: 'errors.selector_required',
            }),
        );
    });

    it('should fill all fields and submit the form when submitAfterFill is true', async () => {
        await fillFormAction(
            mockReq({
                formSelector: '#login-form',
                fields: [
                    { selector: '#email', value: 'test@example.com' },
                    { selector: '#password', value: 'secret' },
                ],
                submitAfterFill: true,
                waitForNavigation: true,
            }),
            mockRes,
        );

        expect(mockLocator.waitFor).toHaveBeenCalledTimes(3);
        expect(mockLocator.fill).toHaveBeenCalledWith('test@example.com', { timeout: 30000 });
        expect(mockLocator.fill).toHaveBeenCalledWith('secret', { timeout: 30000 });
        expect(mockPage.waitForNavigation).toHaveBeenCalledWith({
            timeout: 30000,
            waitUntil: 'load',
        });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    filledFields: expect.any(Array),
                    submit: expect.objectContaining({ submitted: true }),
                }),
            }),
        );
    });
});
