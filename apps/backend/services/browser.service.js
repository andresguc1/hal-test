import { chromium, firefox, webkit } from 'playwright';
import { createHash, randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { DEVICE_PRESETS } from '../utils/constants.js';
import { STORAGE_DIR, STORAGE_RUNS_DIR } from '../config/paths.js';
import fs from 'fs';

// Redirect Playwright/Chromium temp files to /var/tmp to avoid /tmp ENOSPC issues
// while keeping the path short enough (<108 chars) to avoid UNIX socket SIGTRAP crashes.
const BROWSER_TMP_DIR = '/var/tmp/hal_browser_tmp';
if (!fs.existsSync(BROWSER_TMP_DIR)) {
    fs.mkdirSync(BROWSER_TMP_DIR, { recursive: true });
}
process.env.TMPDIR = BROWSER_TMP_DIR;

const MAX_BROWSERS = parseInt(process.env.HAL_MAX_BROWSERS || '5', 10);

// -----------------------------------------------------------------------------
// SESSION SEAL (Fase 6)
// -- Marker written into the browser process cmdline (`--hal-session=<id>`).
//    Lets us identify OUR orphaned OS processes in `ps` and kill exactly them
//    (never a stranger's browser). Injected for Chromium only: Chromium ignores
//    unknown `--flag` switches safely, while Firefox/WebKit launch configs do
//    not tolerate arbitrary flags.
// -----------------------------------------------------------------------------
export const SESSION_SEAL_PREFIX = '--hal-session=';

const execFileAsync = promisify(execFile);

// -----------------------------------------------------------------------------
// SESSION PROFILE HASH (Fase 1)
// -- Canonical fingerprint of the options that define a browser PROCESS.
//    Reuse in Debug Mode is decided by comparing this hash, not by manually
//    diffing options (which missed `browserType`, mixing engines silently).
// -----------------------------------------------------------------------------

// Fields that directly affect the OS process identity (viewport → window-size
// args, user-agent, flags). Context-only concerns (network throttling, touch)
// belong to a future ContextPool and intentionally do NOT restart here.
const SCALAR_PROFILE_FIELDS = [
    'browserType',
    'headless',
    'devicePreset',
    'width',
    'height',
    'slowMo',
    'args',
    'executablePath',
    'recordVideo',
];

// Booleans whose default is `false`/absent: absent and false are equivalent.
const OPTIONAL_BOOLEAN_FIELDS = ['maximizeWindow', 'isMobile', 'hasTouch'];

const normalizeProfileValue = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === '' ||
        value === 0 || // 0 = "use default"
        value === false
    ) {
        return undefined;
    }
    return value;
};

/**
 * Computes a canonical hash for the browser launch options.
 * Equal hashes ⇒ the running browser process is safe to reuse.
 * Different hashes (engine, headless, viewport, preset, credentials, args…)
 * ⇒ the existing process must be closed and a new one launched.
 *
 * @param {Object} [options={}] - Raw launch options (pre-coercion is fine).
 * @returns {string} - Stable, short sha256 fingerprint.
 */
export function computeProfileHash(options = {}) {
    const parts = [];

    for (const field of SCALAR_PROFILE_FIELDS) {
        parts.push(`${field}:${JSON.stringify(normalizeProfileValue(options[field]))}`);
    }

    for (const field of OPTIONAL_BOOLEAN_FIELDS) {
        parts.push(`${field}:${options[field] === true ? 'true' : 'false'}`);
    }

    const creds = options.httpCredentials;
    const credKey = creds
        ? `httpCredentials:${normalizeProfileValue(creds.username) ?? ''}:${
              normalizeProfileValue(creds.origin) ?? ''
          }`
        : 'httpCredentials:none';
    parts.push(credKey);

    return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 20);
}

// Best-effort reference to the OS process backing the browser (for future
// orphan reaping). Returns null when Playwright does not expose it.
function captureProcessRef(browser) {
    try {
        return typeof browser.process === 'function' ? (browser.process() ?? null) : null;
    } catch {
        return null;
    }
}

/**
 * Single source of truth for the effective `headless` value of a launch.
 * Unifies the two auto-launch paths (ActionExecutor implicit launch and
 * browser-utils.getActivePage) so explicit node configuration always wins,
 * interactive/debug sessions default to a visible window and production
 * (non-CLI) sessions default to headless.
 *
 * @returns {boolean}
 */
export function resolveEffectiveHeadless({ explicitHeadless, debugMode } = {}) {
    if (explicitHeadless !== undefined && explicitHeadless !== null) {
        return explicitHeadless === true || explicitHeadless === 'true';
    }
    if (debugMode) return false; // interactive debugging → visible window
    const isProduction = process.env.NODE_ENV === 'production';
    const isCliMode = process.env.HAL_CLI_MODE === 'true';
    return isProduction && !isCliMode;
}

function isProcessAlive(pid) {
    if (!pid || typeof pid !== 'number' || pid <= 0) return null; // unknown
    try {
        process.kill(pid, 0);
        return true;
    } catch (e) {
        // EPERM means the process exists but belongs to another user → alive.
        return e?.code === 'EPERM' ? true : false;
    }
}

class BrowserManager {
    constructor() {
        this.browsers = new Map();
        this.lastAccessed = new Map();
        this._acquireQueue = []; // Pending browser slot requests (for PerformanceRunner)

        // --- SESSION SEAL (Fase 6) ---
        // Set to true once any Chromium session is stamped with --hal-session=,
        // so orphan detection avoids useless `ps` scans before that.
        this._hasSealedSessions = false;

        // --- SESSION REGISTRY (Fase 2) ---
        // runId -> latest browserId owned by that run; browserId -> runId (reverse)
        this.sessionsByRun = new Map();
        this.runByBrowser = new Map();

        // --- CONTEXT POOL (Fase 3) ---
        // browserId -> { runId, profileHash, context } (profile-aware context reuse)
        this.runContext = new Map();

        // --- Idle Garbage Collector ---
        // Sweeps frequently to close sessions idle for > 2 minutes
        this.idleInterval = setInterval(() => {
            const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes (reduced from 5)
            const now = Date.now();
            for (const [id, lastTime] of this.lastAccessed.entries()) {
                if (now - lastTime > IDLE_TIMEOUT) {
                    const owner = this.browsers.get(id)?.runId || 'n/a';
                    console.log(`[GC] Browser ${id} closed due to idle timeout (owner=${owner})`);
                    this.delete(id).catch(() => {});
                }
            }
            // Also drop stale/dead sessions whose OS process already crashed.
            this.reapOrphans().catch(() => {});
        }, 30 * 1000); // 30 seconds sweep (faster)
    }

    /**
     * Acquires a browser slot, waiting if the pool is full.
     * Used by PerformanceRunner for controlled concurrency.
     *
     * @param {number} [timeoutMs=30000] - Maximum wait time for a slot
     * @returns {Promise<boolean>} Resolves true when a slot is available
     */
    async acquireSlot(timeoutMs = 30000) {
        if (this.browsers.size < MAX_BROWSERS) {
            return true;
        }

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                // Remove from queue on timeout
                const idx = this._acquireQueue.indexOf(releaseSlot);
                if (idx !== -1) this._acquireQueue.splice(idx, 1);
                reject(new Error(`Browser pool exhausted — timeout after ${timeoutMs}ms`));
            }, timeoutMs);

            const releaseSlot = () => {
                clearTimeout(timer);
                resolve(true);
            };

            this._acquireQueue.push(releaseSlot);
        });
    }

    /**
     * Returns the current pool utilization info.
     * @returns {{ active: number, max: number, queued: number }}
     */
    getPoolStatus() {
        return {
            active: this.browsers.size,
            max: MAX_BROWSERS,
            queued: this._acquireQueue.length,
        };
    }

    /**
     * Launches a new browser with the specified options.
     * @param {Object} options - Launch options (browserType, headless, slowMo, args, maximizeWindow, timeout).
     * @returns {Promise<{browserId: string, browser: import('playwright').Browser}>}
     */
    async launchBrowser(options = {}) {
        let {
            browserType = 'chromium',
            headless = false,
            slowMo,
            args = '',
            maximizeWindow = false,
            devicePreset = 'Desktop',
            timeout,
            recordVideo = true, // Default to true if not specified
            executablePath,
        } = options;

        if (slowMo !== undefined && slowMo !== null && slowMo !== '') {
            const parsed = Number(slowMo);
            if (!isNaN(parsed)) slowMo = parsed;
        }

        if (timeout !== undefined && timeout !== null && timeout !== '') {
            const parsed = Number(timeout);
            if (!isNaN(parsed)) timeout = parsed;
        }

        // --- HEADLESS LOGIC ---
        // Respect the user's manual preference if provided exactly.
        // Otherwise, force headless in production servers (except CLI mode).
        const isProduction = process.env.NODE_ENV === 'production';
        const isCliMode = process.env.HAL_CLI_MODE === 'true';

        if (options.headless !== undefined) {
            headless = options.headless === true || options.headless === 'true';
        } else if (isProduction && !isCliMode) {
            console.log(
                '[BrowserService] Production environment detected - defaulting to headless',
            );
            headless = true;
        }

        // 1. Select the browser engine
        let browserEngine;
        switch (browserType) {
            case 'firefox':
                browserEngine = firefox;
                break;
            case 'webkit':
                browserEngine = webkit;
                break;
            default:
                browserEngine = chromium;
        }

        // 2. Process arguments (args comes as a string from the frontend)
        let launchArgs = [];
        if (typeof args === 'string' && args.trim().length > 0) {
            launchArgs = args.split(' ').filter((arg) => arg.length > 0);
        } else if (Array.isArray(args)) {
            launchArgs = [...args];
        }

        // --- SANITIZATION & DEDUPLICATION ---
        // Explicitly remove flags known to cause crashes or conflicts
        const forbiddenFlags = [
            '--no-zygote',
            '--disable-features=CDPScreenshotNewSurface',
            '--enable-features=CDPScreenshotNewSurface',
        ];
        launchArgs = launchArgs.filter((arg) => !forbiddenFlags.includes(arg));

        // Deduplicate
        launchArgs = [...new Set(launchArgs)];

        // 3. Configure Window Size and Mobile Simulation
        const preset = DEVICE_PRESETS[devicePreset] || DEVICE_PRESETS.Desktop;
        const isActuallyMobile = devicePreset !== 'Desktop' && devicePreset !== 'Custom';

        // If it's a mobile preset, we ALWAYS force the preset size and ignore maximizeWindow
        const shouldMaximize = maximizeWindow && devicePreset === 'Desktop';

        // Use preset values unless 'Custom' is selected
        const finalWidth = devicePreset === 'Custom' ? options.width || 1280 : preset.width || 1280;
        const finalHeight =
            devicePreset === 'Custom' ? options.height || 720 : preset.height || 720;
        const isMobile = devicePreset === 'Custom' ? !!options.isMobile : !!preset.isMobile;

        if (shouldMaximize) {
            console.log('[BrowserService] Maximizing window');
            if (browserType === 'chromium' && !launchArgs.includes('--start-maximized')) {
                launchArgs.push('--start-maximized');
            } else if (browserType === 'firefox') {
                if (!launchArgs.some((arg) => arg.startsWith('-width'))) {
                    launchArgs.push('-width', '1920');
                }
                if (!launchArgs.some((arg) => arg.startsWith('-height'))) {
                    launchArgs.push('-height', '1080');
                }
            }
        } else {
            // For a perfect "Responsive" feel, we use --app mode if it's a mobile preset.
            // This removes the address bar/tabs, allowing the window to be as thin as needed
            // without being blocked by Chromium's minimum UI width.
            const winWidth = finalWidth;
            const winHeight = finalHeight;

            console.log(
                `[BrowserService] Responsive Window Mode: ${winWidth}x${winHeight} (No UI bars)`,
            );

            if (browserType === 'chromium') {
                launchArgs.push(`--window-size=${winWidth},${winHeight}`);

                if (isActuallyMobile && !headless) {
                    console.log('[BrowserService] Enabling App Mode for ultra-clean mobile view');
                    launchArgs.push(
                        '--app=data:text/html,<html><head><title>HaltTest Mobile</title></head><body></body></html>',
                    );
                }
            } else if (browserType === 'firefox') {
                launchArgs.push('-width', String(winWidth));
                launchArgs.push('-height', String(winHeight));
            } else if (browserType === 'webkit') {
                launchArgs.push(`--window-size=${winWidth},${winHeight}`);
            }
        }

        // Mobile simulation requires a specific User Agent
        const userAgent = devicePreset === 'Custom' ? null : preset.userAgent;
        if (isMobile || userAgent) {
            const finalUA =
                userAgent ||
                'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

            console.log(`[BrowserService] Applying User Agent: ${finalUA.substring(0, 50)}...`);
            launchArgs.push(`--user-agent=${finalUA}`);
        }

        // 4. Inject Stability Flags for Chromium
        if (browserType === 'chromium') {
            const stabilityArgs = [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions',
            ];

            if (headless) {
                // Headless has no visible window: disabling GPU/rasterizer is safe
                // and avoids GPU init hangs. In headful these flags would prevent
                // the window from rendering, so they are only applied here.
                stabilityArgs.push('--disable-gpu', '--disable-software-rasterizer');
            }

            launchArgs.push(...stabilityArgs);
        }

        // 5. Session Seal (Fase 6): stamp the process cmdline with our id so
        //    orphan reaping can find EXACTLY our browser OS processes later,
        //    even if we lose the Playwright handle (crash/GC). Chromium only.
        const browserId = randomUUID().split('-')[0];
        if (browserType === 'chromium') {
            launchArgs.push(`${SESSION_SEAL_PREFIX}${browserId}`);
            this._hasSealedSessions = true;
        }

        console.log(`[BrowserService] Final Launch Args: ${JSON.stringify(launchArgs)}`);

        console.log('---------------------------------------------------------');
        console.log(`[AUDIT] Launching ${browserType.toUpperCase()}`);
        console.log(`[AUDIT] Headless: ${headless}`);
        console.log(`[AUDIT] NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`[AUDIT] HAL_CLI_MODE: ${process.env.HAL_CLI_MODE}`);
        console.log(`[AUDIT] Target Viewport: ${finalWidth}x${finalHeight}`);
        console.log(`[AUDIT] Mobile Simulation: ${isMobile ? 'ACTIVE ✅' : 'DISABLED'}`);
        console.log(`[AUDIT] Device Preset: ${devicePreset}`);
        console.log('---------------------------------------------------------');

        const launchOptions = {
            headless,
            args: launchArgs,
            ...(slowMo && { slowMo }),
            ...(timeout && { timeout }),
            ...(executablePath && { executablePath }),
        };

        let browser;
        let launchMethod = 'launch';

        if (browserType === 'lightpanda') {
            const endpoint = process.env.LIGHTPANDA_ENDPOINT || 'ws://127.0.0.1:9222';
            console.log(`[BrowserService] Connecting to Lightpanda via CDP at ${endpoint}`);
            // Lightpanda uses the Chromium protocol
            browser = await chromium.connectOverCDP({
                endpointURL: endpoint,
                ...(slowMo && { slowMo }),
                ...(timeout && { timeout }),
            });
            launchMethod = 'connectOverCDP';
        } else {
            browser = await browserEngine.launch(launchOptions);
        }

        // --- SESSION PROFILE FINGERPRINT (Fase 1) ---
        const profileHash = computeProfileHash(options);

        // We also save if maximize was requested to use it when creating contexts/pages
        this.set(browserId, {
            browser,
            launchMethod,
            options: { ...options, headless, launchArgs, maximizeWindow, recordVideo },
            // --- SESSION OWNERSHIP (Fase 0) ---
            profileHash,
            runId: options.runId || null,
            nodeId: options.nodeId || null,
            startedAt: Date.now(),
            process: captureProcessRef(browser),
        });

        const version = browser.version();

        console.log(
            `[SESSION] Opened ${browserId} (${browserType}) owner=${options.runId || 'n/a'}:${
                options.nodeId || 'n/a'
            } profile=${profileHash}`,
        );

        // Bind the run to this session immediately so the pipeline can resolve
        // it strictly by runId even before the handler returns (Fase 2).
        if (options.runId) {
            this.registerRunSession(options.runId, browserId);
        }

        return { browserId, browser, version };
    }

    set(id, entry) {
        if (this.browsers.size >= MAX_BROWSERS) {
            this.evictOldest();
        }
        this.browsers.set(id, entry);
        this.touch(id);
    }

    get(id) {
        if (!id) return this.getLatest();
        this.touch(id);
        return this.browsers.get(id);
    }

    getLatest() {
        const ids = Array.from(this.browsers.keys());
        if (ids.length === 0) return null;
        const latestId = ids[ids.length - 1];
        this.touch(latestId);
        return this.browsers.get(latestId);
    }

    touch(id) {
        this.lastAccessed.set(id, Date.now());
    }

    async delete(id) {
        const entry = this.browsers.get(id);
        if (entry) {
            const browser = entry.browser || entry;
            try {
                // Try to close contexts first if possible
                if (typeof browser.contexts === 'function') {
                    const contexts = browser.contexts();
                    await Promise.allSettled(contexts.map((ctx) => ctx.close()));
                }
                await browser.close();
            } catch (e) {
                console.error(`[BrowserService] Error closing browser ${id}: ${e.message}`);
            }
            const uptime = entry.startedAt
                ? `${Math.round((Date.now() - entry.startedAt) / 1000)}s`
                : 'n/a';
            console.log(
                `[SESSION] Closed ${id} owner=${entry.runId || 'n/a'}:${entry.nodeId || 'n/a'} uptime=${uptime}`,
            );
        }
        this.browsers.delete(id);
        this.lastAccessed.delete(id);

        // Unbind from the run registry (Fase 2)
        const boundRun = this.runByBrowser.get(id);
        if (boundRun) {
            this.runByBrowser.delete(id);
            if (this.sessionsByRun.get(boundRun) === id) {
                this.sessionsByRun.delete(boundRun);
            }
        }

        // Drop any bound context record (Fase 3)
        const ctxRecord = this.runContext.get(id);
        if (ctxRecord?.context) {
            try {
                await ctxRecord.context.close().catch(() => {});
            } catch {
                /* already closed */
            }
        }
        this.runContext.delete(id);

        // Release slot to next waiting worker (performance runner semaphore)
        if (this._acquireQueue.length > 0) {
            const next = this._acquireQueue.shift();
            next();
        }
    }

    evictOldest() {
        let oldest = null;
        let oldestTime = Infinity;

        for (const [id, time] of this.lastAccessed.entries()) {
            if (time < oldestTime) {
                oldestTime = time;
                oldest = id;
            }
        }

        if (oldest) {
            console.log(`[EVICT] Browser ${oldest} evicted due to limit`);
            this.delete(oldest).catch(() => {});
        }
    }

    has(id) {
        return this.browsers.has(id);
    }

    // =========================================================================
    // SESSION REGISTRY (Fase 2) — strict per-run session ownership
    // =========================================================================

    /**
     * Binds a browserId to a runId. Called by ExecutionService after any
     * handler returns a live browserId, and automatically after launchBrowser.
     * @returns {boolean}
     */
    registerRunSession(runId, browserId) {
        if (!runId || !browserId || !this.browsers.has(browserId)) return false;
        const prev = this.sessionsByRun.get(runId);
        if (prev && prev !== browserId) {
            // Re-ownership: the run switched sessions (e.g. component launched
            // its own browser). The previous entry is NOT closed here — the
            // caller may still be using it; the idle GC covers orphans.
            this.runByBrowser.delete(prev);
        }
        this.sessionsByRun.set(runId, browserId);
        this.runByBrowser.set(browserId, runId);
        const entry = this.browsers.get(browserId);
        if (entry) entry.runId = runId;
        return true;
    }

    /**
     * Strict per-run resolution: the browserId a run owns, or null.
     * @returns {string|null}
     */
    getRunSessionBrowserId(runId) {
        if (!runId) return null;
        const id = this.sessionsByRun.get(runId);
        return id && this.browsers.has(id) ? id : null;
    }

    /**
     * Closes the browser owned by a run and unbinds it from the registry.
     * Idempotent: returns null if the run has no session.
     * @returns {Promise<string|null>}
     */
    async releaseRun(runId) {
        const browserId = this.getRunSessionBrowserId(runId);
        if (!browserId) return null;
        this.sessionsByRun.delete(runId);
        this.runByBrowser.delete(browserId);
        await this.delete(browserId).catch(() => {});
        return browserId;
    }

    // =========================================================================
    // CONTEXT POOL (Fase 3) — profile-aware, per-browser context reuse
    // =========================================================================

    /**
     * Stores the context bound to a browser under its run + profile signature.
     * An older bound context with a different profile is closed (profile drift).
     */
    bindRunContext(browserId, runId, profileHash, context) {
        const existing = this.runContext.get(browserId);
        if (existing?.context && existing.context !== context && !existing.context.isClosed?.()) {
            existing.context.close().catch(() => {});
        }
        this.runContext.set(browserId, { runId, profileHash, context });
    }

    /**
     * Returns the stored context for a browser IF it matches the requested
     * profile and is still alive. Otherwise null (caller creates a new one).
     */
    getRunContext(browserId, profileHash) {
        const record = this.runContext.get(browserId);
        if (!record?.context) return null;
        if (record.profileHash !== profileHash) return null; // profile drift
        try {
            if (record.context.isClosed?.()) return null;
        } catch {
            return null;
        }
        return record.context;
    }

    // =========================================================================
    // ORPHAN REAPING (Fase 4) — dead-process detection + drain
    // =========================================================================

    /**
     * Scans registered sessions whose OS process died (crash/SIGKILL) but whose
     * Playwright handle is still registered, and drops them. Does NOT touch
     * external/unknown processes initially — unless a process carries OUR
     * --hal-session= seal (Fase 6), in which case it is killed by pid exactly.
     * @returns {Promise<number>} count of removed registered sessions.
     */
    async reapOrphans() {
        let reaped = 0;
        for (const id of Array.from(this.browsers.keys())) {
            const entry = this.browsers.get(id);
            const pid = entry?.process?.pid;
            if (pid && isProcessAlive(pid) === false) {
                console.log(
                    `[SESSION] Stale session ${id} (pid ${pid}) dead — removing. owner=${entry.runId || 'n/a'}`,
                );
                await this.delete(id).catch(() => {});
                reaped++;
            }
        }
        return reaped;
    }

    /**
     * Fase 6 — finds our own orphaned OS processes via the session seal.
     * Cross-platform process-table scan (POSIX `ps`; safe no-op elsewhere).
     * @returns {Promise<Array<{pid:number, sessionId:string}>>} sealed
     *          processes whose session id is NOT registered (we lost the handle).
     */
    async _scanProcessTable() {
        if (process.platform === 'win32') return [];
        try {
            const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,command='], {
                timeout: 5000,
            });
            const strays = [];
            const sealRe = new RegExp(`${SESSION_SEAL_PREFIX}([\\w]+)`);
            for (const line of stdout.split('\n')) {
                if (!line.includes(SESSION_SEAL_PREFIX)) continue;
                const pidMatch = line.trim().match(/^(\d+)\s+/);
                const idMatch = line.match(sealRe);
                if (pidMatch && idMatch) {
                    strays.push({ pid: Number(pidMatch[1]), sessionId: idMatch[1] });
                }
            }
            return strays;
        } catch {
            return []; // ps unavailable or no permission — degrades gracefully
        }
    }

    /**
     * Fase 6 — kills orphaned OS processes stamped with our seal, but only if
     * their session id is no longer registered (real orphans: we lost/never had
     * the handle, yet the browser process is still running).
     * @returns {Promise<number>} number of orphan OS processes killed.
     */
    async killOrphans() {
        if (!this._hasSealedSessions) return 0;
        const sealed = await this._scanProcessTable();
        let killed = 0;
        for (const { pid, sessionId } of sealed) {
            if (this.browsers.has(sessionId)) continue; // still owned — ignore
            try {
                process.kill(pid, 'SIGTERM');
                console.log(
                    `[SESSION] Killed orphan OS process pid=${pid} (seal=${sessionId}) — no live session owns it.`,
                );
                killed++;
            } catch {
                // Already gone or not ours anymore
            }
        }
        return killed;
    }

    /**
     * Sanitized, serializable snapshot of every active session — for the
     * inspector "Sessions" panel and observability. Never exposes the browser
     * handle itself.
     */
    listSessions() {
        const list = [];
        for (const [id, entry] of this.browsers.entries()) {
            list.push({
                browserId: id,
                browserType: entry.options?.browserType || 'chromium',
                headless: !!entry.options?.headless,
                launchMethod: entry.launchMethod || 'launch',
                runId: entry.runId || null,
                nodeId: entry.nodeId || null,
                profileHash: entry.profileHash || null,
                startedAt: entry.startedAt || null,
                uptimeMs: entry.startedAt ? Date.now() - entry.startedAt : null,
                pid: entry.process?.pid ?? null,
            });
        }
        return list;
    }

    /**
     * Full lifecycle drain: reap orphans, close every registered session and
     * reset all registries. Used by graceful shutdown and manual sanitize.
     */
    async drain() {
        await this.reapOrphans();
        await this.killOrphans();
        await this.sanitize();
        this.runContext.clear();
    }

    async sanitize() {
        console.log('[BrowserService] 🧹 Manual sanitization requested...');
        const ids = Array.from(this.browsers.keys());
        for (const id of ids) {
            await this.delete(id).catch(() => {});
        }

        // Cleanup only internal app instances
        console.log('[BrowserService] 🧹 Internal session cleanup complete.');

        // ⚠️ SAFETY: We intentionally do NOT run a global `pkill -f chrome` here.
        // That approach kills ALL chrome/chromium processes on the system — including:
        //   - Other VU browsers during performance tests
        //   - The user's personal Chrome browser
        //   - Other Playwright instances from CI runners
        //
        // Instead, Playwright's browser.close() (called in this.delete()) handles
        // graceful shutdown of the process tree it owns. If orphans persist after
        // close(), they will be reaped by the OS or by the idle GC sweep.
    }

    keys() {
        return this.browsers.keys();
    }
}

export const browserService = new BrowserManager();
