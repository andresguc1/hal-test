import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('playwright', () => ({
    chromium: {
        launch: vi.fn().mockResolvedValue({
            newContext: vi.fn().mockResolvedValue({
                newPage: vi.fn().mockResolvedValue({
                    goto: vi.fn(),
                    close: vi.fn(),
                    isClosed: vi.fn().mockReturnValue(false),
                }),
                close: vi.fn(),
                pages: vi.fn().mockReturnValue([]),
                isClosed: vi.fn().mockReturnValue(false),
            }),
            close: vi.fn(),
            isConnected: vi.fn().mockReturnValue(true),
            contexts: vi.fn().mockReturnValue([]),
            version: vi.fn().mockReturnValue('mock-version'),
            process: vi.fn().mockReturnValue(null),
        }),
    },
    firefox: { launch: vi.fn() },
    webkit: { launch: vi.fn() },
}));

vi.mock('../config/paths.js', () => ({
    STORAGE_DIR: '/tmp/test-storage',
    STORAGE_RUNS_DIR: '/tmp/test-storage/runs',
}));

vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        default: {
            ...actual,
            existsSync: vi.fn().mockReturnValue(true),
            mkdirSync: vi.fn(),
        },
        existsSync: vi.fn().mockReturnValue(true),
        mkdirSync: vi.fn(),
    };
});

// Avoid the 30s interval interfering with assertions.
vi.useFakeTimers();

import { browserService, resolveEffectiveHeadless } from '../services/browser.service.js';
import { validateBrowser, createIsolatedContext } from '../core/browser-utils.js';

const launchProfile = (overrides = {}) =>
    browserService.launchBrowser({ browserType: 'chromium', headless: false, ...overrides });

describe('Fase 2 - Session Registry', () => {
    afterEach(async () => {
        for (const id of Array.from(browserService.keys())) {
            await browserService.delete(id).catch(() => {});
        }
        browserService.sessionsByRun.clear();
        browserService.runByBrowser.clear();
        browserService.runContext.clear();
    });

    it('auto-registers the run session when launched with a runId', async () => {
        const { browserId } = await launchProfile({ runId: 'run-1', nodeId: 'n1' });
        expect(browserService.getRunSessionBrowserId('run-1')).toBe(browserId);
        expect(browserService.get(browserId).runId).toBe('run-1');
    });

    it('does not register when launched without a runId', async () => {
        const { browserId } = await launchProfile();
        expect(browserService.getRunSessionBrowserId('run-x')).toBeNull();
        expect(browserService.get(browserId).runId).toBeNull();
    });

    it('registerRunSession returns false for unknown browsers', () => {
        expect(browserService.registerRunSession('run-1', 'ghost-id')).toBe(false);
    });

    it('re-binds ownership when the run switches sessions', async () => {
        const { browserId: first } = await launchProfile({ runId: 'run-1' });
        const { browserId: second } = await launchProfile({ runId: 'run-1' });
        browserService.registerRunSession('run-1', second);
        expect(browserService.getRunSessionBrowserId('run-1')).toBe(second);
        expect(browserService.runByBrowser.has(first)).toBe(false);
    });

    it('releaseRun closes the owned browser and unbinds both maps', async () => {
        const { browserId } = await launchProfile({ runId: 'run-1' });
        const spy = vi.spyOn(browserService, 'delete');
        const closedId = await browserService.releaseRun('run-1');
        expect(closedId).toBe(browserId);
        expect(spy).toHaveBeenCalledWith(browserId);
        expect(browserService.getRunSessionBrowserId('run-1')).toBeNull();
        expect(browserService.runByBrowser.has(browserId)).toBe(false);
        expect(browserService.has(browserId)).toBe(false);
    });

    it('releaseRun is idempotent for runs without a session', async () => {
        expect(await browserService.releaseRun('run-none')).toBeNull();
    });

    it('delete() unbinds the run registry', async () => {
        const { browserId } = await launchProfile({ runId: 'run-1' });
        await browserService.delete(browserId);
        expect(browserService.getRunSessionBrowserId('run-1')).toBeNull();
    });

    it('validateBrowser resolves missing id to the run-owned session, not latest', async () => {
        const { browserId: owned } = await launchProfile({ runId: 'run-owned' });
        const { browserId: latest } = await launchProfile(); // no run → becomes "latest"
        expect(latest).not.toBe(owned);

        const req = { body: { runId: 'run-owned' }, t: (k) => k };
        const result = validateBrowser(req, 'nonexistent-id');
        expect(result.error).toBe(false);
        expect(result.browserId).toBe(owned);
    });

    it('validateBrowser falls back to latest when the run has no session', async () => {
        const { browserId: latest } = await launchProfile();
        const req = { body: { runId: 'run-unknown' }, t: (k) => k };
        const result = validateBrowser(req, null);
        expect(result.error).toBe(false);
        expect(result.browserId).toBe(latest);
    });

    it('validateBrowser honors a valid explicit browserId', async () => {
        const { browserId } = await launchProfile({ runId: 'run-1' });
        const req = { body: { runId: 'run-1' }, t: (k) => k };
        const result = validateBrowser(req, browserId);
        expect(result.error).toBe(false);
        expect(result.browserId).toBe(browserId);
    });
});

describe('Fase 3 - Context Pool', () => {
    afterEach(async () => {
        for (const id of Array.from(browserService.keys())) {
            await browserService.delete(id).catch(() => {});
        }
        browserService.runContext.clear();
    });

    it('getRunContext returns the bound context when profile matches', async () => {
        const { browserId } = await launchProfile();
        const ctx = { isClosed: () => false, close: vi.fn() };
        browserService.bindRunContext(browserId, null, 'hash-a', ctx);
        expect(browserService.getRunContext(browserId, 'hash-a')).toBe(ctx);
    });

    it('getRunContext returns null on profile drift', async () => {
        const { browserId } = await launchProfile();
        const ctx = { isClosed: () => false, close: vi.fn() };
        browserService.bindRunContext(browserId, null, 'hash-a', ctx);
        expect(browserService.getRunContext(browserId, 'hash-b')).toBeNull();
    });

    it('getRunContext returns null for a closed context', async () => {
        const { browserId } = await launchProfile();
        browserService.bindRunContext(browserId, null, 'hash-a', { isClosed: () => true });
        expect(browserService.getRunContext(browserId, 'hash-a')).toBeNull();
    });

    it('getRunContext returns null when nothing is bound', async () => {
        const { browserId } = await launchProfile();
        expect(browserService.getRunContext(browserId, 'hash-a')).toBeNull();
    });

    it('delete() closes and drops the bound context', async () => {
        const { browserId } = await launchProfile();
        const closeSpy = vi.fn();
        const ctx = { isClosed: () => false, close: closeSpy };
        browserService.bindRunContext(browserId, null, 'hash-a', ctx);
        await browserService.delete(browserId);
        expect(closeSpy).toHaveBeenCalled();
        expect(browserService.runContext.has(browserId)).toBe(false);
    });

    it('createIsolatedContext spawns a fresh context not recorded in the pool', async () => {
        const { browserId } = await launchProfile({ devicePreset: 'Desktop' });
        const browserInstance = browserService.get(browserId).browser;
        const newContextSpy = browserInstance.newContext;

        const fresh = await createIsolatedContext({ body: {}, t: (k) => k }, browserId);
        expect(fresh.browserId).toBe(browserId);
        expect(fresh.page).toBeDefined();
        expect(fresh.context).toBeDefined();
        expect(newContextSpy).toHaveBeenCalled();
        expect(browserService.runContext.has(browserId)).toBe(false);
    });

    it('createIsolatedContext rejects when the browser is missing', async () => {
        await expect(
            createIsolatedContext({ body: {}, t: (k) => k }, 'ghost-id'),
        ).rejects.toThrow();
    });
});

describe('Fase 4 - Orphan Reaping', () => {
    let killSpy;

    beforeEach(() => {
        killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true);
    });

    afterEach(() => {
        killSpy.mockRestore();
        for (const id of Array.from(browserService.keys())) {
            browserService.browsers.delete(id);
            browserService.lastAccessed.delete(id);
        }
        browserService.sessionsByRun.clear();
        browserService.runByBrowser.clear();
    });

    it('reaps a session whose OS process is dead', async () => {
        const { browserId } = await launchProfile();
        browserService.get(browserId).process = { pid: 424242 };
        killSpy.mockImplementation(() => {
            const err = new Error('ESRCH');
            err.code = 'ESRCH';
            throw err;
        });
        const reaped = await browserService.reapOrphans();
        expect(reaped).toBe(1);
        expect(browserService.has(browserId)).toBe(false);
    });

    it('keeps a session whose OS process is alive', async () => {
        const { browserId } = await launchProfile();
        browserService.get(browserId).process = { pid: process.pid };
        const reaped = await browserService.reapOrphans();
        expect(reaped).toBe(0);
        expect(browserService.has(browserId)).toBe(true);
    });

    it('keeps sessions without a process reference', async () => {
        const { browserId } = await launchProfile(); // process is null from the mock
        const reaped = await browserService.reapOrphans();
        expect(reaped).toBe(0);
        expect(browserService.has(browserId)).toBe(true);
    });
});

describe('Fase 4 - drain', () => {
    afterEach(async () => {
        browserService.sessionsByRun.clear();
        browserService.runByBrowser.clear();
        browserService.runContext.clear();
    });

    it('closes every session and clears registries', async () => {
        const { browserId: a } = await launchProfile({ runId: 'run-1' });
        const { browserId: b } = await launchProfile();
        browserService.bindRunContext(a, 'run-1', 'h', { isClosed: () => false, close: vi.fn() });

        await browserService.drain();

        expect(browserService.has(a)).toBe(false);
        expect(browserService.has(b)).toBe(false);
        expect(browserService.getRunSessionBrowserId('run-1')).toBeNull();
        expect(browserService.runContext.size).toBe(0);
    });
});

describe('Fase 5 - unified headless policy', () => {
    const ENV = { NODE_ENV: process.env.NODE_ENV, HAL_CLI_MODE: process.env.HAL_CLI_MODE };

    afterEach(() => {
        process.env.NODE_ENV = ENV.NODE_ENV;
        process.env.HAL_CLI_MODE = ENV.HAL_CLI_MODE;
    });

    it('explicit node configuration always wins', () => {
        process.env.NODE_ENV = 'development';
        expect(resolveEffectiveHeadless({ explicitHeadless: true, debugMode: true })).toBe(true);
        expect(resolveEffectiveHeadless({ explicitHeadless: false, debugMode: false })).toBe(false);
        expect(resolveEffectiveHeadless({ explicitHeadless: 'true' })).toBe(true);
    });

    it('debug sessions default to a visible window', () => {
        process.env.NODE_ENV = 'production';
        expect(resolveEffectiveHeadless({ debugMode: true })).toBe(false);
    });

    it('production (non-CLI) defaults to headless', () => {
        process.env.NODE_ENV = 'production';
        delete process.env.HAL_CLI_MODE;
        expect(resolveEffectiveHeadless({})).toBe(true);
    });

    it('CLI mode is interactive by default even in production', () => {
        process.env.NODE_ENV = 'production';
        process.env.HAL_CLI_MODE = 'true';
        expect(resolveEffectiveHeadless({})).toBe(false);
    });
});
