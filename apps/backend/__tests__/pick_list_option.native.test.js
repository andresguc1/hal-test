import { describe, it, expect, vi, beforeEach } from 'vitest';
import pickListOption from '../plugins/core-interaction/handlers/pick_list_option.js';
import { browserService } from '../services/browser.service.js';

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

const makeLocator = (tagName = 'DIV') => {
    const isNativeSelect = tagName === 'SELECT';
    const l = {
        waitFor: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn().mockResolvedValue(isNativeSelect),
        click: vi.fn().mockResolvedValue(undefined),
        getAttribute: vi.fn().mockResolvedValue(null),
        selectOption: vi.fn().mockResolvedValue('Option 1'),
        isVisible: vi.fn().mockResolvedValue(false),
        scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
        count: vi.fn().mockResolvedValue(1),
    };
    l.locator = vi.fn(() => l);
    l.first = vi.fn(() => l);
    l.nth = vi.fn(() => l);
    l.getByText = vi.fn(() => l);
    return l;
};

const mockPage = {
    isClosed: vi.fn().mockReturnValue(false),
    evaluate: vi.fn().mockResolvedValue(''),
    locator: vi.fn(() => makeLocator()),
    getByRole: vi.fn(() => makeLocator()),
    getByText: vi.fn(() => makeLocator()),
    getByLabel: vi.fn(() => makeLocator()),
    getByPlaceholder: vi.fn(() => makeLocator()),
    getByTestId: vi.fn(() => makeLocator()),
    getByAltText: vi.fn(() => makeLocator()),
    getByTitle: vi.fn(() => makeLocator()),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
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
    await pickListOption(req, res);
    return { status: res.status.mock.calls.at(-1)?.[0], json: res.json.mock.calls.at(-1)?.[0] };
};

const resetPageLocators = () => {
    mockPage.locator = vi.fn(() => makeLocator());
    mockPage.getByRole = vi.fn(() => makeLocator());
    mockPage.getByText = vi.fn(() => makeLocator());
    mockPage.getByLabel = vi.fn(() => makeLocator());
    mockPage.getByPlaceholder = vi.fn(() => makeLocator());
    mockPage.getByTestId = vi.fn(() => makeLocator());
    mockPage.getByAltText = vi.fn(() => makeLocator());
    mockPage.getByTitle = vi.fn(() => makeLocator());
};

describe('pick_list_option handler — native <select>', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetPageLocators();
        browserService.keys.mockReturnValue(['mock-browser-id']);
        browserService.get.mockReturnValue({ browser: mockBrowser });
    });

    it('uses selectOption() on a native select (expand click is harmless)', async () => {
        const l = makeLocator('SELECT');
        mockPage.locator = vi.fn().mockReturnValue(l);

        const { status, json } = await callHandler(
            mockReq({ selector: '#dropdown', optionText: 'Option 2', timeout: 30000 }),
        );

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
            selected: 'Option 2',
            menuClosed: true,
            verified: true,
            native: true,
        });
        expect(l.selectOption).toHaveBeenCalledWith({ label: 'Option 2' });
        expect(l.click).toHaveBeenCalledTimes(1);
    });

    it('selects native select by index', async () => {
        const l = makeLocator('SELECT');
        mockPage.locator = vi.fn().mockReturnValue(l);

        const { status, json } = await callHandler(
            mockReq({ selector: '#dropdown', optionIndex: 1, mode: 'index', timeout: 30000 }),
        );

        expect(status).toBe(200);
        expect(json.data).toMatchObject({ selected: '#1', native: true });
        expect(l.selectOption).toHaveBeenCalledWith({ index: 1 });
    });

    it('reports a clear error when the option is not found', async () => {
        const l = makeLocator('SELECT');
        l.selectOption.mockRejectedValue(new Error('Option not found'));
        mockPage.locator = vi.fn().mockReturnValue(l);

        const { status, json } = await callHandler(
            mockReq({ selector: '#dropdown', optionText: 'Nope', timeout: 30000 }),
        );

        expect(status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.error).toMatch(/not found in native <select>/);
    });

    it('keeps the DOM click-expand path for ARIA combobox/listbox menus', async () => {
        const l = makeLocator('BUTTON');
        mockPage.locator = vi.fn().mockReturnValue(l);

        const { status, json } = await callHandler(
            mockReq({ selector: '[id="menu-trigger"]', optionText: 'Español', timeout: 30000 }),
        );

        expect(status).toBe(200);
        expect(json.data.native).toBeUndefined();
        expect(l.click).toHaveBeenCalled();
    });
});
