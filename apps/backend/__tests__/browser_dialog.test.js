import { describe, it, expect, vi, beforeEach } from 'vitest';
import browserDialogAction from '../plugins/core-browser/handlers/browser_dialog.js';
import { browserService } from '../services/browser.service.js';
import { attachDialogListener } from '../core/browser-utils.js';

vi.mock('../services/browser.service.js', () => ({
    browserService: {
        keys: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        launchBrowser: vi.fn(),
    },
}));

vi.mock('../services/trace.service.js', () => ({
    traceService: { add: vi.fn() },
}));

const mockPage = {
    _dialogQueue: [],
    _dialogListenerAttached: false,
    isClosed: vi.fn().mockReturnValue(false),
    on: vi.fn(),
    evaluate: vi.fn().mockResolvedValue(''),
};

const mockContext = {
    pages: vi.fn().mockReturnValue([mockPage]),
    browser: vi.fn(),
    on: vi.fn(),
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
    t: (key, fallback) => fallback ?? key,
});

const callHandler = async (req) => {
    const res = mockRes;
    await browserDialogAction(req, res);
    return { status: res.status.mock.calls.at(-1)?.[0], json: res.json.mock.calls.at(-1)?.[0] };
};

describe('browser_dialog handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPage._dialogQueue = [];
        mockPage._dialogListenerAttached = false;
        delete mockPage._dialogPromptText;
        delete mockPage._dialogDefaultAction;
        browserService.keys.mockReturnValue(['mock-browser-id']);
        browserService.get.mockReturnValue({ browser: mockBrowser });
    });

    it('returns the last recorded dialog and default action', async () => {
        mockPage._dialogQueue.push({
            type: 'alert',
            message: 'You selected: internet',
            at: Date.now(),
        });

        const { status, json } = await callHandler(mockReq({}));

        expect(status).toBe(200);
        expect(json).toEqual(
            expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    action: 'accept',
                    matched: true,
                    dialog: { type: 'alert', message: 'You selected: internet' },
                }),
            }),
        );
    });

    it('matches message with contains', async () => {
        mockPage._dialogQueue.push({ type: 'confirm', message: 'Are you sure?', at: Date.now() });

        const { status, json } = await callHandler(
            mockReq({ expectText: 'Are you sure?', matchType: 'contains' }),
        );

        expect(status).toBe(200);
        expect(json.data.matched).toBe(true);
    });

    it('fails when expected text does not match', async () => {
        mockPage._dialogQueue.push({ type: 'alert', message: 'Wrong message', at: Date.now() });

        const { status } = await callHandler(
            mockReq({ expectText: 'Something else', matchType: 'contains' }),
        );

        expect(status).toBe(400);
    });

    it('fails with not-found when queue is empty and times out', async () => {
        const { status } = await callHandler(mockReq({ timeout: 300 }));

        expect(status).toBe(400);
    });

    it('reports the configured promptText and keeps default accept', async () => {
        mockPage._dialogQueue.push({ type: 'prompt', message: 'Enter name', at: Date.now() });

        const { status, json } = await callHandler(mockReq({ promptText: 'Alice', timeout: 300 }));

        expect(status).toBe(200);
        expect(json.data.promptText).toBe('Alice');
        expect(json.data.action).toBe('accept');
    });
});

describe('attachDialogListener', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPage._dialogQueue = [];
        mockPage._dialogListenerAttached = false;
        delete mockPage._dialogPromptText;
        delete mockPage._dialogDefaultAction;
    });

    it('captures a dialog event and auto-accepts it', async () => {
        attachDialogListener(mockPage);

        const dialogHandler = mockPage.on.mock.calls.find((c) => c[0] === 'dialog')[1];
        const dlg = {
            type: () => 'alert',
            message: () => 'Hello',
            dismiss: vi.fn(),
            accept: vi.fn(),
        };
        dialogHandler(dlg);

        expect(mockPage._dialogQueue).toHaveLength(1);
        expect(mockPage._dialogQueue[0].type).toBe('alert');
        expect(mockPage._dialogQueue[0].message).toBe('Hello');
        expect(dlg.accept).toHaveBeenCalled();
        expect(mockPage._dialogListenerAttached).toBe(true);
    });

    it('dismisses prompt dialogs for promptText but accepts when default action is dismiss', async () => {
        attachDialogListener(mockPage);

        const dialogHandler = mockPage.on.mock.calls.find((c) => c[0] === 'dialog')[1];
        const dlg = {
            type: () => 'confirm',
            message: () => 'OK?',
            dismiss: vi.fn(),
            accept: vi.fn(),
        };
        dialogHandler(dlg);

        expect(dlg.accept).toHaveBeenCalled();
    });

    it('answers a prompt with the configured promptText', async () => {
        attachDialogListener(mockPage);
        mockPage._dialogPromptText = 'my input';

        const dialogHandler = mockPage.on.mock.calls.find((c) => c[0] === 'dialog')[1];
        const dlg = {
            type: () => 'prompt',
            message: () => 'Enter value',
            dismiss: vi.fn(),
            accept: vi.fn(),
        };
        dialogHandler(dlg);

        expect(dlg.accept).toHaveBeenCalledWith('my input');
    });

    it('dismisses the dialog when default action is dismiss', async () => {
        attachDialogListener(mockPage);
        mockPage._dialogDefaultAction = 'dismiss';

        const dialogHandler = mockPage.on.mock.calls.find((c) => c[0] === 'dialog')[1];
        const dlg = {
            type: () => 'confirm',
            message: () => 'OK?',
            dismiss: vi.fn(),
            accept: vi.fn(),
        };
        dialogHandler(dlg);

        expect(dlg.dismiss).toHaveBeenCalled();
    });
});
