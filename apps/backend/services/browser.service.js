import { chromium, firefox, webkit } from 'playwright';
import { randomUUID } from 'crypto';
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

class BrowserManager {
    constructor() {
        this.browsers = new Map();
        this.lastAccessed = new Map();
        this._acquireQueue = []; // Pending browser slot requests (for PerformanceRunner)

        // --- Idle Garbage Collector ---
        // Sweeps frequently to close sessions idle for > 2 minutes
        this.idleInterval = setInterval(() => {
            const IDLE_TIMEOUT = 2 * 60 * 1000; // 2 minutes (reduced from 5)
            const now = Date.now();
            for (const [id, lastTime] of this.lastAccessed.entries()) {
                if (now - lastTime > IDLE_TIMEOUT) {
                    console.log(`[GC] Browser ${id} closed due to idle timeout`);
                    this.delete(id).catch(() => {});
                }
            }
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
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-software-rasterizer',
                '--disable-extensions',
            ];

            if (headless) {
                // Additional headless specific flags if any
            }

            launchArgs.push(...stabilityArgs);
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
        };

        const browser = await browserEngine.launch(launchOptions);

        const browserId = randomUUID().split('-')[0];

        // We also save if maximize was requested to use it when creating contexts/pages
        this.set(browserId, {
            browser,
            launchMethod: 'launch',
            options: { ...options, launchArgs, maximizeWindow, recordVideo },
        });

        const version = browser.version();

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
        return ids.length > 0 ? this.browsers.get(ids[ids.length - 1]) : null;
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
        }
        this.browsers.delete(id);
        this.lastAccessed.delete(id);

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
