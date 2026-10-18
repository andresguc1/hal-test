import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import scrollHandler from '../plugins/core-interaction/handlers/scroll.js';
import { browserService } from '../services/browser.service.js';
import { traceService } from '../services/trace.service.js';

vi.mock('../services/browser.service.js', () => ({
    browserService: {
        keys: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        launchBrowser: vi.fn(),
        getRunSessionBrowserId: vi.fn(),
        getRunContext: vi.fn(),
    },
}));

vi.mock('../services/trace.service.js', () => ({
    traceService: { add: vi.fn() },
}));

// Mirrors playwright-core's assertEvaluateOptions (coreBundle.js): the 3rd
// positional argument of page.evaluate/pageFrame.evaluate MUST be an options
// OBJECT. Passing a plain value (the pre-fix bug passed `amount` as arg #3)
// throws "Too many arguments..." in production. Guarding the mock the same
// way turns every test into a faithful regression net for that exact failure.
const TOO_MANY_ARGS_ERROR =
    'Too many arguments. If you need to pass more than 1 argument to the function wrap them in an object.';

const guardEvaluateArity = (args) => {
    if (args.length > 3) throw new Error(TOO_MANY_ARGS_ERROR);
    if (args.length === 3) {
        const options = args[2];
        if (typeof options !== 'object' || options === null || Array.isArray(options)) {
            throw new Error(TOO_MANY_ARGS_ERROR);
        }
    }
};

// Element probes:
// - overflow probe (scrollHeight/clientHeight) reports a scrollable element by default;
// - position probes (scrollTop/scrollLeft) report movement on the 2nd read so
//   the handler's before/after verification resolves to SCROLLED by default.
// Tests that model a non-scrollable or stuck element override evaluate explicitly.
const makeLocator = () => {
    let probeCount = 0;
    return {
        waitFor: vi.fn().mockResolvedValue(undefined),
        evaluate: vi.fn(async (fn) => {
            const src = String(fn);
            if (src.includes('clientHeight')) return { y: true, x: true };
            if (src.includes('scrollTop') && src.includes('scrollLeft')) {
                probeCount += 1;
                return probeCount === 1 ? { y: 0, x: 0 } : { y: 150, x: 120 };
            }
            return undefined;
        }),
        click: vi.fn().mockResolvedValue(undefined),
        scrollIntoViewIfNeeded: vi.fn().mockResolvedValue(undefined),
        count: vi.fn().mockResolvedValue(1),
    };
};

const makeMockPage = () => {
    // Shared window scroll state: probes read it, window.scrollBy updates it
    // (unless the test marks the page non-scrollable to model a clamp/no-op).
    const scrollState = { y: 0, x: 0, scrollable: true };
    const page = {
        isClosed: vi.fn().mockReturnValue(false),
        evaluate: vi.fn(async (...args) => {
            guardEvaluateArity(args);
            const [fn] = args;
            const src = String(fn);
            if (src.includes('window.scrollY') && src.includes('window.scrollX')) {
                return { y: scrollState.y, x: scrollState.x };
            }
            if (src.includes('window.scrollBy') && scrollState.scrollable) {
                const a = args[1] || {};
                if (typeof a.amt === 'number') {
                    // Handler passes the wrapper object { amt, beh, dir }
                    if (a.dir === 'left' || a.dir === 'right') {
                        scrollState.x += a.dir === 'left' ? -a.amt : a.amt;
                    } else {
                        scrollState.y += a.dir === 'up' ? -a.amt : a.amt;
                    }
                } else {
                    if (typeof a.top === 'number') scrollState.y += a.top;
                    if (typeof a.left === 'number') scrollState.x += a.left;
                }
            }
            return '';
        }),
        locator: vi.fn(() => makeLocator()),
        getByRole: vi.fn(() => makeLocator()),
        getByText: vi.fn(() => makeLocator()),
        getByLabel: vi.fn(() => makeLocator()),
        getByPlaceholder: vi.fn(() => makeLocator()),
        getByTestId: vi.fn(() => makeLocator()),
        getByAltText: vi.fn(() => makeLocator()),
        getByTitle: vi.fn(() => makeLocator()),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        mouse: { wheel: vi.fn().mockResolvedValue(undefined) },
        on: vi.fn(),
        __scrollState: scrollState,
    };
    return page;
};

const mockContext = {
    pages: vi.fn(),
    browser: vi.fn(),
    on: vi.fn(),
};

const mockBrowser = {
    isConnected: vi.fn().mockReturnValue(true),
    contexts: vi.fn(() => [mockContext]),
};

const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
};

const mockReq = (body) => ({
    body: { ...body, browserId: 'mock-browser-id' },
    headers: {},
    t: (key) => key,
});

const callHandler = async (req) => {
    const res = mockRes;
    await scrollHandler(req, res);
    return { status: res.status.mock.calls.at(-1)?.[0], json: res.json.mock.calls.at(-1)?.[0] };
};

const assertNoIllegalEvaluateArity = (page) => {
    for (const call of page.evaluate.mock.calls) {
        if (call.length > 2) {
            expect(typeof call[2]).toBe('object');
            expect(call[2]).not.toBeNull();
            expect(Array.isArray(call[2])).toBe(false);
        }
    }
};

describe('scroll handler — page.evaluate argument passing', () => {
    let mockPage;

    beforeEach(() => {
        vi.clearAllMocks();
        mockPage = makeMockPage();
        mockContext.pages = vi.fn(() => [mockPage]);
        browserService.keys.mockReturnValue(['mock-browser-id']);
        browserService.get.mockReturnValue({ browser: mockBrowser });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('passes a single object argument to page.evaluate when a selector is set (regression: "Too many arguments")', async () => {
        const l = makeLocator();
        mockPage.locator = vi.fn(() => l);

        const { status, json } = await callHandler(
            mockReq({ selector: '#feed', direction: 'down', amount: 500, behavior: 'smooth' }),
        );

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.status).toBe('success');
        assertNoIllegalEvaluateArity(mockPage);

        const scrollCall = mockPage.evaluate.mock.calls.find(
            ([fn]) => typeof fn === 'function' && String(fn).includes('scrollBy'),
        );
        expect(scrollCall).toBeDefined();
        expect(scrollCall).toHaveLength(2);
        expect(scrollCall[1]).toEqual({
            sel: '#feed',
            amt: 500,
            beh: 'smooth',
            dir: 'down',
        });
        expect(l.scrollIntoViewIfNeeded).toHaveBeenCalled();
    });

    it('scrolls the matched element DOWN with the user-selected behavior (not a hardcoded "smooth")', async () => {
        const l = makeLocator();
        mockPage.locator = vi.fn(() => l);

        const { status } = await callHandler(
            mockReq({ selector: '#feed', direction: 'down', amount: 300, behavior: 'auto' }),
        );
        expect(status).toBe(200);

        const [fn, arg] = mockPage.evaluate.mock.calls.find(
            ([f]) => typeof f === 'function' && String(f).includes('scrollBy'),
        );

        const scrollBy = vi.fn();
        vi.stubGlobal('document', { querySelector: vi.fn(() => ({ scrollBy })) });
        fn(arg);

        expect(scrollBy).toHaveBeenCalledWith({ top: 300, behavior: 'auto' });
    });

    it('scrolls the matched element UP (negative top) with the user-selected behavior', async () => {
        const l = makeLocator();
        mockPage.locator = vi.fn(() => l);

        const { status } = await callHandler(
            mockReq({ selector: '#feed', direction: 'up', amount: 400, behavior: 'smooth' }),
        );
        expect(status).toBe(200);

        const [fn, arg] = mockPage.evaluate.mock.calls.find(
            ([f]) => typeof f === 'function' && String(f).includes('scrollBy'),
        );

        const scrollBy = vi.fn();
        vi.stubGlobal('document', { querySelector: vi.fn(() => ({ scrollBy })) });
        fn(arg);

        expect(scrollBy).toHaveBeenCalledWith({ top: -400, behavior: 'smooth' });
    });

    it('scrolls the matched element RIGHT (positive left)', async () => {
        const l = makeLocator();
        mockPage.locator = vi.fn(() => l);

        const { status } = await callHandler(
            mockReq({ selector: '#feed', direction: 'right', amount: 200, behavior: 'auto' }),
        );
        expect(status).toBe(200);

        const [fn, arg] = mockPage.evaluate.mock.calls.find(
            ([f]) => typeof f === 'function' && String(f).includes('scrollBy'),
        );

        const scrollBy = vi.fn();
        vi.stubGlobal('document', { querySelector: vi.fn(() => ({ scrollBy })) });
        fn(arg);

        expect(scrollBy).toHaveBeenCalledWith({ left: 200, behavior: 'auto' });
    });

    it('scrolls the matched element LEFT (negative left)', async () => {
        const l = makeLocator();
        mockPage.locator = vi.fn(() => l);

        const { status } = await callHandler(
            mockReq({ selector: '#feed', direction: 'left', amount: 200, behavior: 'smooth' }),
        );
        expect(status).toBe(200);

        const [fn, arg] = mockPage.evaluate.mock.calls.find(
            ([f]) => typeof f === 'function' && String(f).includes('scrollBy'),
        );

        const scrollBy = vi.fn();
        vi.stubGlobal('document', { querySelector: vi.fn(() => ({ scrollBy })) });
        fn(arg);

        expect(scrollBy).toHaveBeenCalledWith({ left: -200, behavior: 'smooth' });
    });

    it('scrolls the window (no selector) passing args as an object — no loose closures (regression: ReferenceError in browser)', async () => {
        const { status, json } = await callHandler(
            mockReq({ selector: '', direction: 'down', amount: 250, behavior: 'auto' }),
        );

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        assertNoIllegalEvaluateArity(mockPage);

        const scrollCall = mockPage.evaluate.mock.calls.find(
            ([fn]) => typeof fn === 'function' && String(fn).includes('window.scrollBy'),
        );
        expect(scrollCall).toBeDefined();
        expect(scrollCall).toHaveLength(2);
        expect(scrollCall[1]).toEqual({ amt: 250, beh: 'auto', dir: 'down' });

        const scrollBy = vi.fn();
        vi.stubGlobal('window', { scrollBy });
        scrollCall[0](scrollCall[1]);
        expect(scrollBy).toHaveBeenCalledWith({ top: 250, behavior: 'auto' });
    });

    it('scrolls the window UP (negative top) when direction is up and no selector is set', async () => {
        const { status } = await callHandler(
            mockReq({ direction: 'up', amount: 150, behavior: 'smooth' }),
        );
        expect(status).toBe(200);

        const [fn, arg] = mockPage.evaluate.mock.calls.find(
            ([f]) => typeof f === 'function' && String(f).includes('window.scrollBy'),
        );

        const scrollBy = vi.fn();
        vi.stubGlobal('window', { scrollBy });
        fn(arg);
        expect(scrollBy).toHaveBeenCalledWith({ top: -150, behavior: 'smooth' });
    });

    it('scrolls the window horizontally (left/right) when no selector is set', async () => {
        const { status } = await callHandler(
            mockReq({ direction: 'right', amount: 120, behavior: 'auto' }),
        );
        expect(status).toBe(200);

        const [fn, arg] = mockPage.evaluate.mock.calls.find(
            ([f]) => typeof f === 'function' && String(f).includes('window.scrollBy'),
        );

        const scrollBy = vi.fn();
        vi.stubGlobal('window', { scrollBy });
        fn(arg);
        expect(scrollBy).toHaveBeenCalledWith({ left: 120, behavior: 'auto' });
    });

    it('interpolates {{target}} in the success message (regression: empty target in i18n)', async () => {
        const l = makeLocator();
        mockPage.locator = vi.fn(() => l);

        const req = mockReq({
            selector: '#feed',
            direction: 'down',
            amount: 300,
            behavior: 'auto',
        });
        req.t = vi.fn((key) => key);

        const res = mockRes;
        await scrollHandler(req, res);

        expect(req.t).toHaveBeenCalledWith('actions.scroll.success', {
            target: '#feed',
            status: 'Scrolled',
        });
    });

    it('coerces a string amount (form payload) to a number before evaluating', async () => {
        const l = makeLocator();
        mockPage.locator = vi.fn(() => l);

        const { status } = await callHandler(
            mockReq({ selector: '#feed', direction: 'down', amount: '400', behavior: 'auto' }),
        );
        expect(status).toBe(200);

        const [, arg] = mockPage.evaluate.mock.calls.find(
            ([fn]) => typeof fn === 'function' && String(fn).includes('scrollBy'),
        );
        expect(arg.amt).toBe(400);
        expect(typeof arg.amt).toBe('number');
    });

    it('uses page.mouse.wheel when explicit x/y deltas are provided', async () => {
        const { status, json } = await callHandler(mockReq({ x: 10, y: -20 }));

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(mockPage.mouse.wheel).toHaveBeenCalledWith(10, -20);
    });

    it('records traceDetails with selector, direction and amount on success', async () => {
        const l = makeLocator();
        mockPage.locator = vi.fn(() => l);

        await callHandler(
            mockReq({ selector: '#feed', direction: 'up', amount: 350, behavior: 'auto' }),
        );

        expect(traceService.add).toHaveBeenCalledWith(
            expect.objectContaining({
                action: 'scroll',
                status: 'success',
                selector: '#feed',
                direction: 'up',
                amount: 350,
            }),
        );
    });

    it('reports the real scrolled pixels in data when the window moves', async () => {
        const { status, json } = await callHandler(
            mockReq({ direction: 'down', amount: 250, behavior: 'auto' }),
        );

        expect(status).toBe(200);
        expect(json.data).toMatchObject({ status: 'Scrolled', scrolledPixels: 250 });
    });

    it('reports "Nothing to scroll" when the page cannot move (regression: silent no-op success)', async () => {
        mockPage.__scrollState.scrollable = false;

        const req = mockReq({ direction: 'down', amount: 300, behavior: 'auto' });
        req.t = vi.fn((key) => key);
        const { status, json } = await callHandler(req);

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
            status: 'Nothing to scroll (content fits the viewport)',
            scrolledPixels: 0,
        });
        expect(req.t).toHaveBeenCalledWith('actions.scroll.success', {
            target: 'the page',
            status: 'Nothing to scroll (content fits the viewport)',
        });
    });

    it('reports "Nothing to scroll" when the matched element is scrollable but stuck at the edge', async () => {
        const l = makeLocator();
        l.evaluate = vi.fn(async (fn) => {
            const src = String(fn);
            if (src.includes('clientHeight')) return { y: true, x: true };
            if (src.includes('scrollTop') && src.includes('scrollLeft')) return { y: 0, x: 0 };
            return undefined;
        });
        mockPage.locator = vi.fn(() => l);

        const { status, json } = await callHandler(
            mockReq({ selector: '#feed', direction: 'down', amount: 300, behavior: 'auto' }),
        );

        expect(status).toBe(200);
        expect(json.data).toMatchObject({
            status: 'Nothing to scroll (content fits the viewport)',
            scrolledPixels: 0,
            target: '#feed',
        });
    });

    it('falls back to scrolling the page when the selected element has no scrollable overflow (regression: silent no-op on a plain <input>)', async () => {
        const l = makeLocator();
        // e.g. the user picked #amount (a form input): overflow probe says no.
        l.evaluate = vi.fn(async (fn) => {
            const src = String(fn);
            if (src.includes('clientHeight')) return { y: false, x: false };
            return undefined;
        });
        mockPage.locator = vi.fn(() => l);

        const req = mockReq({
            selector: '#amount',
            direction: 'down',
            amount: 100,
            behavior: 'auto',
        });
        req.t = vi.fn((key) => key);
        const { status, json } = await callHandler(req);

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        // The page actually moved (window path), not the input.
        expect(json.data).toMatchObject({
            status: 'Scrolled',
            scrolledPixels: 100,
            target: 'the page',
            fallbackFrom: '#amount',
        });
        const elementScroll = mockPage.evaluate.mock.calls.find(
            ([fn]) =>
                typeof fn === 'function' &&
                String(fn).includes('scrollBy') &&
                String(fn).includes('querySelector'),
        );
        expect(elementScroll).toBeUndefined();
        const windowScroll = mockPage.evaluate.mock.calls.find(
            ([fn]) => typeof fn === 'function' && String(fn).includes('window.scrollBy'),
        );
        expect(windowScroll).toBeDefined();
        expect(req.t).toHaveBeenCalledWith('actions.scroll.success', {
            target: 'the page',
            status: 'Scrolled',
        });
    });

    it('falls back to the page when the overflow probe fails (element vanished)', async () => {
        const l = makeLocator();
        l.evaluate = vi.fn().mockRejectedValue(new Error('Element is not attached'));
        mockPage.locator = vi.fn(() => l);

        const { status, json } = await callHandler(
            mockReq({ selector: '#ghost', direction: 'down', amount: 200, behavior: 'auto' }),
        );

        expect(status).toBe(200);
        expect(json.data).toMatchObject({
            status: 'Scrolled',
            scrolledPixels: 200,
            fallbackFrom: '#ghost',
        });
    });

    it('waits for smooth scrolling to settle before measuring (regression: screenshot before animation)', async () => {
        await callHandler(mockReq({ direction: 'down', amount: 300, behavior: 'smooth' }));
        expect(mockPage.waitForTimeout).toHaveBeenCalledWith(350);

        vi.clearAllMocks();
        mockPage = makeMockPage();
        mockContext.pages = vi.fn(() => [mockPage]);
        browserService.keys.mockReturnValue(['mock-browser-id']);
        browserService.get.mockReturnValue({ browser: mockBrowser });

        await callHandler(mockReq({ direction: 'down', amount: 300, behavior: 'auto' }));
        expect(mockPage.waitForTimeout).toHaveBeenCalledWith(50);
    });
});

describe('scroll handler — scrollToEnd (infinite scroll)', () => {
    let mockPage;

    beforeEach(() => {
        vi.clearAllMocks();
        mockPage = makeMockPage();
        mockContext.pages = vi.fn(() => [mockPage]);
        browserService.keys.mockReturnValue(['mock-browser-id']);
        browserService.get.mockReturnValue({ browser: mockBrowser });
    });

    it('stops after the element height stabilizes and reports "Reached end"', async () => {
        const l = makeLocator();
        const heights = [1000, 1000];
        l.evaluate = vi.fn(async (fn) => {
            if (String(fn).includes('clientHeight')) return { y: true, x: true };
            if (String(fn).includes('scrollHeight')) return heights.shift() ?? 1000;
            return undefined;
        });
        mockPage.locator = vi.fn(() => l);

        const { status, json } = await callHandler(
            mockReq({
                selector: '#feed',
                scrollToEnd: true,
                maxScrolls: 10,
                waitTime: 500,
                behavior: 'auto',
            }),
        );

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
            status: 'Reached end',
            attempts: 1,
            finalHeight: 1000,
        });
        expect(l.waitFor).toHaveBeenCalledWith({ state: 'attached', timeout: 5000 });
        expect(mockPage.waitForTimeout).toHaveBeenCalledWith(500);
        expect(mockPage.mouse.wheel).not.toHaveBeenCalled();
    });

    it('uses the window scrollHeight when no selector is set', async () => {
        mockPage.evaluate = vi.fn(async (...args) => {
            guardEvaluateArity(args);
            const [fn] = args;
            if (String(fn).includes('document.body.scrollHeight')) return 2000;
            return '';
        });

        const { status, json } = await callHandler(
            mockReq({ scrollToEnd: true, maxScrolls: 10, waitTime: 500 }),
        );

        expect(status).toBe(200);
        expect(json.success).toBe(true);
        expect(json.data).toMatchObject({
            status: 'Reached end',
            attempts: 1,
            finalHeight: 2000,
        });
        assertNoIllegalEvaluateArity(mockPage);
    });

    it('falls back to the page for scrollToEnd when the element has no overflow', async () => {
        const l = makeLocator();
        l.evaluate = vi.fn(async (fn) => {
            if (String(fn).includes('clientHeight')) return { y: false, x: false };
            return undefined;
        });
        mockPage.locator = vi.fn(() => l);
        mockPage.evaluate = vi.fn(async (...args) => {
            guardEvaluateArity(args);
            if (String(args[0]).includes('document.body.scrollHeight')) return 2000;
            return '';
        });

        const { status, json } = await callHandler(
            mockReq({
                selector: '#amount',
                scrollToEnd: true,
                maxScrolls: 10,
                waitTime: 500,
                behavior: 'auto',
            }),
        );

        expect(status).toBe(200);
        expect(json.data).toMatchObject({
            status: 'Reached end',
            attempts: 1,
            finalHeight: 2000,
            target: 'the page',
            fallbackFrom: '#amount',
        });
        expect(l.waitFor).not.toHaveBeenCalled();
    });
});
