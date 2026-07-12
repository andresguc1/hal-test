import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitFormAction } from '../controllers/action.controller.js';
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

const mockLocator = {
    waitFor: vi.fn(),
    evaluate: vi.fn(),
    click: vi.fn(),
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
    t: (key) => key, // Mock i18n function
});

describe('submitFormAction Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup browserService mock to return our mock browser
        browserService.keys.mockReturnValue(['mock-browser-id']);
        browserService.get.mockReturnValue({ browser: mockBrowser });

        mockLocator.waitFor.mockResolvedValue(undefined);
        mockLocator.evaluate.mockReset();
        mockLocator.click.mockResolvedValue(undefined);
        mockPage.waitForNavigation.mockResolvedValue(undefined);
    });

    it('should throw error if selector is missing', async () => {
        await submitFormAction(mockReq({}), mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                error: 'errors.selector_required',
            }),
        );
    });

    it('should click the element directly if it is a submit button', async () => {
        // First evaluate call resolves with button tag details
        mockLocator.evaluate.mockResolvedValue({
            isForm: false,
            hasParentForm: true,
            isSubmitButton: true,
        });

        await submitFormAction(
            mockReq({
                selector: '#submit-btn',
                waitForNavigation: false,
                timeout: 5000,
            }),
            mockRes,
        );

        expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: 'attached', timeout: 5000 });
        expect(mockLocator.click).toHaveBeenCalledWith({ timeout: 5000 });
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    traceDetails: expect.objectContaining({
                        detectedType: 'submit_button',
                    }),
                }),
            }),
        );
    });

    it('should trigger requestSubmit directly on the form when target is a form', async () => {
        let evaluateCount = 0;
        const mockForm = {
            requestSubmit: vi.fn(),
            submit: vi.fn(),
        };

        mockLocator.evaluate.mockImplementation(async (fn) => {
            evaluateCount++;
            if (evaluateCount === 1) {
                return { isForm: true, hasParentForm: false, isSubmitButton: false };
            } else {
                fn(mockForm);
                return mockForm;
            }
        });

        await submitFormAction(
            mockReq({
                selector: 'form#my-form',
                waitForNavigation: false,
            }),
            mockRes,
        );

        expect(mockForm.requestSubmit).toHaveBeenCalled();
        expect(mockLocator.click).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    traceDetails: expect.objectContaining({
                        detectedType: 'form',
                    }),
                }),
            }),
        );
    });

    it('should trigger requestSubmit on closest parent form when target is an input', async () => {
        let evaluateCount = 0;
        const mockForm = {
            requestSubmit: vi.fn(),
            submit: vi.fn(),
        };
        const mockInput = {
            closest: vi.fn().mockReturnValue(mockForm),
        };

        mockLocator.evaluate.mockImplementation(async (fn) => {
            evaluateCount++;
            if (evaluateCount === 1) {
                return { isForm: false, hasParentForm: true, isSubmitButton: false };
            } else {
                fn(mockInput);
                return mockInput;
            }
        });

        await submitFormAction(
            mockReq({
                selector: 'input#username',
                waitForNavigation: false,
            }),
            mockRes,
        );

        expect(mockInput.closest).toHaveBeenCalledWith('form');
        expect(mockForm.requestSubmit).toHaveBeenCalled();
        expect(mockLocator.click).not.toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    traceDetails: expect.objectContaining({
                        detectedType: 'form_input',
                    }),
                }),
            }),
        );
    });

    it('should await navigation using Promise.all when waitForNavigation is true', async () => {
        mockLocator.evaluate.mockResolvedValue({
            isForm: false,
            hasParentForm: true,
            isSubmitButton: true,
        });

        await submitFormAction(
            mockReq({
                selector: '#submit-btn',
                waitForNavigation: true,
                timeout: 8000,
            }),
            mockRes,
        );

        expect(mockPage.waitForNavigation).toHaveBeenCalledWith({
            timeout: 8000,
            waitUntil: 'load',
        });
        expect(mockLocator.click).toHaveBeenCalledWith({ timeout: 8000 });
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });
});
