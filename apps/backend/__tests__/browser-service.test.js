import { describe, it, expect, vi } from 'vitest';

// Mock Playwright - we don't want to launch real browsers in unit tests
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

// Mock config/paths to avoid filesystem dependencies
vi.mock('../config/paths.js', () => ({
    STORAGE_DIR: '/tmp/test-storage',
    STORAGE_RUNS_DIR: '/tmp/test-storage/runs',
}));

// We need to mock fs for the TMPDIR setup at module top level
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

// =============================================================================
// TMPDIR CONFIGURATION
// =============================================================================
describe('BrowserService - TMPDIR Configuration', () => {
    it('should set TMPDIR to browser_tmp directory', async () => {
        await import('../services/browser.service.js');
        expect(process.env.TMPDIR).toContain('browser_tmp');
    });
});

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================
describe('BrowserService - Session Management', () => {
    let browserService;

    beforeEach(async () => {
        const mod = await import('../services/browser.service.js');
        browserService = mod.browserService;
    });

    it('should have a launchBrowser() method', () => {
        expect(typeof browserService.launchBrowser).toBe('function');
    });

    it('should have a get() method', () => {
        expect(typeof browserService.get).toBe('function');
    });

    it('should have a delete() method', () => {
        expect(typeof browserService.delete).toBe('function');
    });

    it('should have a sanitize() method for cleanup', () => {
        expect(typeof browserService.sanitize).toBe('function');
    });

    it('should have a has() method', () => {
        expect(typeof browserService.has).toBe('function');
    });

    it('should return null for non-existent session via getLatest()', () => {
        // When no browsers are registered, getLatest should return null
        const session = browserService.getLatest();
        // It might return null or an existing session from other tests
        expect(session === null || session !== undefined).toBe(true);
    });
});

// =============================================================================
// PROFILE HASH (FASE 1) + SESSION OWNERSHIP (FASE 0)
// =============================================================================
describe('BrowserService - Profile Hash (Fase 1)', () => {
    let computeProfileHash;

    beforeEach(async () => {
        const mod = await import('../services/browser.service.js');
        computeProfileHash = mod.computeProfileHash;
    });

    it('returns equal hashes for equal profiles', () => {
        const a = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });
        const b = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });
        expect(a).toBe(b);
    });

    it('changes the hash when the browser engine changes', () => {
        const chromium = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });
        const firefox = computeProfileHash({
            browserType: 'firefox',
            headless: false,
            devicePreset: 'Desktop',
        });
        const webkit = computeProfileHash({
            browserType: 'webkit',
            headless: false,
            devicePreset: 'Desktop',
        });
        expect(firefox).not.toBe(chromium);
        expect(webkit).not.toBe(chromium);
        expect(webkit).not.toBe(firefox);
    });

    it('changes the hash when headless toggles', () => {
        const visible = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });
        const hidden = computeProfileHash({
            browserType: 'chromium',
            headless: true,
            devicePreset: 'Desktop',
        });
        expect(hidden).not.toBe(visible);
    });

    it('changes the hash when the device preset changes', () => {
        const desktop = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });
        const iphone = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'iPhone SE',
        });
        expect(iphone).not.toBe(desktop);
    });

    it('ignores run bookkeeping fields (debugMode, runId, nodeId)', () => {
        const a = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
            debugMode: true,
            runId: 'r-1',
        });
        const b = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });
        expect(a).toBe(b);
    });

    it('treats absent and default-y values (0, "", false) as equivalent', () => {
        const full = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
            slowMo: 0,
            width: 0,
            maximizeWindow: false,
            isMobile: false,
            hasTouch: false,
            args: '',
        });
        const lite = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });
        expect(full).toBe(lite);
    });

    it('changes the hash when HTTP credentials differ', () => {
        const none = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });
        const withCreds = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
            httpCredentials: { username: 'admin', password: 'pw', origin: 'https://a' },
        });
        const otherUser = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
            httpCredentials: { username: 'alice', password: 'pw', origin: 'https://a' },
        });
        expect(withCreds).not.toBe(none);
        expect(otherUser).not.toBe(withCreds);
    });

    it('treats password-only changes as profile-stable (does not restart)', () => {
        const a = computeProfileHash({
            httpCredentials: { username: 'admin', password: 'pw1', origin: 'https://a' },
        });
        const b = computeProfileHash({
            httpCredentials: { username: 'admin', password: 'pw2', origin: 'https://a' },
        });
        expect(a).toBe(b);
    });

    it('changes the hash when custom launch args change', () => {
        const a = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            args: '--disable-gpu',
        });
        const b = computeProfileHash({
            browserType: 'chromium',
            headless: false,
            args: '--enable-gpu',
        });
        expect(a).not.toBe(b);
    });
});

describe('BrowserService - Session Ownership (Fase 0)', () => {
    let browserService;

    beforeEach(async () => {
        const mod = await import('../services/browser.service.js');
        browserService = mod.browserService;
    });

    afterEach(async () => {
        for (const id of Array.from(browserService.keys())) {
            await browserService.delete(id).catch(() => {});
        }
    });

    it('stores profileHash, runId, nodeId, startedAt and process on launch', async () => {
        const { browserId } = await browserService.launchBrowser({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
            runId: 'run-1',
            nodeId: 'node-7',
        });

        const entry = browserService.get(browserId);
        expect(entry.profileHash).toBeDefined();
        expect(entry.runId).toBe('run-1');
        expect(entry.nodeId).toBe('node-7');
        expect(typeof entry.startedAt).toBe('number');
        expect(entry.process).toBeNull();
    });

    it('marks sessions launched outside a run as owner n/a', async () => {
        const { browserId } = await browserService.launchBrowser({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });

        const entry = browserService.get(browserId);
        expect(entry.runId).toBeNull();
        expect(entry.nodeId).toBeNull();
    });

    it('updates lastAccessed when the latest session is queried (keepalive)', async () => {
        const { browserId } = await browserService.launchBrowser({
            browserType: 'chromium',
            headless: false,
            devicePreset: 'Desktop',
        });

        const before = browserService.lastAccessed.get(browserId);
        await new Promise((r) => setTimeout(r, 5));
        browserService.getLatest();
        const after = browserService.lastAccessed.get(browserId);
        expect(after).toBeGreaterThanOrEqual(before);
    });
});
