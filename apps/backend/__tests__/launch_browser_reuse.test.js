import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mocks referenced by vi.mock factories (hoisting-safe).
const { mocks } = vi.hoisted(() => ({
    mocks: {
        getLatest: vi.fn(),
        keys: vi.fn(),
        delete: vi.fn(),
        launchBrowser: vi.fn(),
        get: vi.fn(),
    },
}));

// Replace only the browserService singleton; keep real computeProfileHash.
vi.mock('../services/browser.service.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        browserService: {
            getLatest: mocks.getLatest,
            keys: mocks.keys,
            delete: mocks.delete,
            launchBrowser: mocks.launchBrowser,
            get: mocks.get,
        },
    };
});

vi.mock('../services/VariableManager.js', () => ({
    variableManager: { resolveRecursive: (body) => ({ ...body }) },
}));

vi.mock('../services/ExecutionLogger.js', () => ({
    executionLogger: { logStep: vi.fn() },
}));

vi.mock('../socket.js', () => ({
    emitExecutionStatus: vi.fn(),
}));

vi.mock('../core/ActionExecutor.js', () => ({
    smartEmitLog: vi.fn(),
}));

vi.mock('../database/init.js', () => ({
    Run: { findByPk: vi.fn().mockResolvedValue(null) },
}));

vi.mock('../core/browser-utils.js', () => ({
    getOrCreateContext: vi.fn().mockResolvedValue({
        pages: () => [],
        newPage: vi.fn(),
    }),
}));

import { computeProfileHash } from '../services/browser.service.js';
import launchBrowserAction from '../plugins/core-browser/handlers/launch_browser.js';

// Payload equivalent to what the frontend payloadBuilders produces.
const baseBody = {
    browserType: 'chromium',
    headless: false,
    devicePreset: 'Desktop',
    slowMo: 0,
    args: '',
    executablePath: '',
    maximizeWindow: false,
    width: 0,
    height: 0,
    isMobile: false,
    hasTouch: false,
    networkProfile: 'No throttling',
    offline: false,
    debugMode: true,
};

const createReqRes = (body) => {
    let result = null;
    const req = { body, t: (key) => key };
    const res = {
        statusCode: 200,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            result = data;
            return this;
        },
    };
    return { req, res, getResult: () => result };
};

describe('launch_browser handler - Debug Mode reuse (Fase 1)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.delete.mockResolvedValue();
        mocks.launchBrowser.mockResolvedValue({ browserId: 'sess-b', version: 'v-1' });
        mocks.get.mockReturnValue({
            browser: { isConnected: () => true },
            options: { headless: false },
        });
        mocks.keys.mockReturnValue(['sess-a']);
    });

    it('reuses the existing browser when the profile hash is unchanged', async () => {
        mocks.getLatest.mockReturnValue({
            browser: { isConnected: () => true },
            options: { headless: false },
            profileHash: computeProfileHash(baseBody),
        });

        const { req, res, getResult } = createReqRes({ ...baseBody });
        await launchBrowserAction(req, res);

        const result = getResult();
        expect(result.reused).toBe(true);
        expect(result.browserId).toBe('sess-a');
        expect(mocks.delete).not.toHaveBeenCalled();
        expect(mocks.launchBrowser).not.toHaveBeenCalled();
    });

    it('restarts the browser when the engine changes (chromium -> firefox)', async () => {
        mocks.getLatest.mockReturnValue({
            browser: { isConnected: () => true },
            options: { browserType: 'chromium', headless: false },
            profileHash: computeProfileHash({ ...baseBody, browserType: 'chromium' }),
        });

        const { req, res, getResult } = createReqRes({
            ...baseBody,
            browserType: 'firefox',
        });
        await launchBrowserAction(req, res);

        expect(mocks.delete).toHaveBeenCalledWith('sess-a');
        expect(mocks.launchBrowser).toHaveBeenCalledTimes(1);
        expect(mocks.launchBrowser).toHaveBeenCalledWith(
            expect.objectContaining({ browserType: 'firefox' }),
        );
        expect(getResult().browserId).toBe('sess-b');
        expect(getResult().reused).toBeUndefined();
    });

    it('restarts the browser when headless toggles', async () => {
        mocks.getLatest.mockReturnValue({
            browser: { isConnected: () => true },
            options: { headless: false },
            profileHash: computeProfileHash({ ...baseBody, headless: false }),
        });

        const { req, res } = createReqRes({ ...baseBody, headless: true });
        await launchBrowserAction(req, res);

        expect(mocks.delete).toHaveBeenCalledWith('sess-a');
        expect(mocks.launchBrowser).toHaveBeenCalledWith(
            expect.objectContaining({ headless: true }),
        );
    });

    it('restarts the browser when the device preset changes', async () => {
        mocks.getLatest.mockReturnValue({
            browser: { isConnected: () => true },
            options: { devicePreset: 'Desktop' },
            profileHash: computeProfileHash({ ...baseBody, devicePreset: 'Desktop' }),
        });

        const { req, res } = createReqRes({ ...baseBody, devicePreset: 'iPhone SE' });
        await launchBrowserAction(req, res);

        expect(mocks.delete).toHaveBeenCalledWith('sess-a');
        expect(mocks.launchBrowser).toHaveBeenCalledWith(
            expect.objectContaining({ devicePreset: 'iPhone SE' }),
        );
    });

    it('restarts the browser when HTTP credentials change user', async () => {
        mocks.getLatest.mockReturnValue({
            browser: { isConnected: () => true },
            options: { httpCredentials: { username: 'admin' } },
            profileHash: computeProfileHash(baseBody),
        });

        const { req, res } = createReqRes({
            ...baseBody,
            httpCredentials: { username: 'alice', password: 'pw', origin: 'https://a' },
        });
        await launchBrowserAction(req, res);

        expect(mocks.delete).toHaveBeenCalledWith('sess-a');
        expect(mocks.launchBrowser).toHaveBeenCalledTimes(1);
    });

    it('reuses the session when unrelated fields (network profile) change', async () => {
        mocks.getLatest.mockReturnValue({
            browser: { isConnected: () => true },
            options: { headless: false },
            profileHash: computeProfileHash(baseBody),
        });

        const { req, res, getResult } = createReqRes({
            ...baseBody,
            networkProfile: 'Slow 4G',
            offline: true,
        });
        await launchBrowserAction(req, res);

        expect(getResult().reused).toBe(true);
        expect(mocks.delete).not.toHaveBeenCalled();
    });

    it('reuses the session when only the credentials password changes', async () => {
        const withCreds = { ...baseBody, httpCredentials: { username: 'admin', password: 'pw1' } };
        mocks.getLatest.mockReturnValue({
            browser: { isConnected: () => true },
            options: { httpCredentials: { username: 'admin', password: 'pw1' } },
            profileHash: computeProfileHash(withCreds),
        });

        const { req, res, getResult } = createReqRes({
            ...baseBody,
            httpCredentials: { username: 'admin', password: 'pw2' },
        });
        await launchBrowserAction(req, res);

        expect(getResult().reused).toBe(true);
        expect(mocks.delete).not.toHaveBeenCalled();
    });

    it('launches fresh when no connected browser exists', async () => {
        mocks.getLatest.mockReturnValue(null);

        const { req, res, getResult } = createReqRes({ ...baseBody });
        await launchBrowserAction(req, res);

        expect(mocks.launchBrowser).toHaveBeenCalledTimes(1);
        expect(getResult().reused).toBeUndefined();
        expect(getResult().browserId).toBe('sess-b');
    });
});
