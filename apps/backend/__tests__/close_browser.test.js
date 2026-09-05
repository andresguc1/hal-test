import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/browser.service.js', () => ({
    browserService: {
        delete: vi.fn().mockResolvedValue(true),
        keys: vi.fn().mockReturnValue([]),
        get: vi.fn(),
    },
}));

vi.mock('../services/trace.service.js', () => ({
    traceService: { add: vi.fn() },
}));

vi.mock('../services/ExecutionLogger.js', () => ({
    executionLogger: { logStep: vi.fn().mockResolvedValue(true) },
}));

vi.mock('../socket.js', () => ({
    emitExecutionStatus: vi.fn(),
}));

vi.mock('../core/browser-utils.js', () => ({
    validateBrowser: vi.fn(),
}));

vi.mock('../core/ActionExecutor.js', () => ({
    smartEmitLog: vi.fn(),
}));

import closeBrowserAction from '../plugins/core-browser/handlers/close_browser.js';
import { browserService } from '../services/browser.service.js';
import { validateBrowser } from '../core/browser-utils.js';

function makeReq(body) {
    return {
        body,
        t: (key) => key,
    };
}
function makeRes() {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
    return res;
}

describe('close_browser handler — stale session safety', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        validateBrowser.mockReturnValue({ browserId: 'live-1' });
    });

    it('closes the requested browser when the id resolves correctly', async () => {
        validateBrowser.mockReturnValue({ browserId: 'live-1' });
        const req = makeReq({ browserId: 'live-1', nodeId: 'n1' });
        const res = makeRes();

        await closeBrowserAction(req, res);

        expect(browserService.delete).toHaveBeenCalledWith('live-1');
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('does NOT close an unrelated live browser when the requested id is stale', async () => {
        // Requested 'stale-9', but validateBrowser fell back to the latest 'live-1'.
        validateBrowser.mockReturnValue({ browserId: 'live-1' });
        const req = makeReq({ browserId: 'stale-9', nodeId: 'n1' });
        const res = makeRes();

        await closeBrowserAction(req, res);

        // The unrelated (fallback) session must survive.
        expect(browserService.delete).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true, browserId: 'stale-9' }),
        );
    });

    it('treats an already-closed browser as idempotent success (validate error)', async () => {
        validateBrowser.mockReturnValue({ error: 'No active browser', status: 404 });
        const req = makeReq({ browserId: 'gone-1', nodeId: 'n1' });
        const res = makeRes();

        await closeBrowserAction(req, res);

        expect(browserService.delete).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });
});
