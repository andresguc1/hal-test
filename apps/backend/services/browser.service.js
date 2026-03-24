import { chromium, firefox, webkit } from 'playwright';
import { randomUUID } from 'crypto';
import { DEVICE_PRESETS } from '../utils/constants.js';
import { STORAGE_RUNS_DIR } from '../config/paths.js';

const MAX_BROWSERS = 3;

class BrowserManager {
    constructor() {
        this.browsers = new Map();
        this.lastAccessed = new Map();

        // --- Idle Garbage Collector ---
        // Sweeps every 5 minutes to close sessions idle for > 15 minutes
        this.idleInterval = setInterval(
            () => {
                const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes fallback for slow PCs
                const now = Date.now();
                for (const [id, lastTime] of this.lastAccessed.entries()) {
                    if (now - lastTime > IDLE_TIMEOUT) {
                        console.log(`[GC] Browser ${id} closed due to idle timeout`);
                        this.delete(id).catch(() => {});
                    }
                }
            },
            3 * 1000 * 60,
        ); // 3 minutes sweep
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

        // FORCE headless mode in production (servers don't have X11/Display)
        // BYPASS this if we are in HAL_CLI_MODE (local execution via NPX/Launcher)
        const isProduction = process.env.NODE_ENV === 'production';
        const isCliMode = process.env.HAL_CLI_MODE === 'true';

        if (isProduction && !headless && !isCliMode) {
            console.log('[BrowserService] Production environment detected - forcing headless mode');
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
            // Split by space respecting single/double quotes if necessary
            // For initial simplicity: split by space
            launchArgs = args.split(' ').filter((arg) => arg.length > 0);
        } else if (Array.isArray(args)) {
            launchArgs = args;
        }

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
                '--disable-features=CDPScreenshotNewSurface',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--no-zygote',
                '--disable-gpu-sandbox',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu-compositing',
                '--font-render-hinting=none',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--js-flags="--max-old-space-size=4096"',
                '--disable-webgl',
                '--disable-webgl2',
                '--disable-3d-apis',
                '--mute-audio',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-disk-cache',
                '--disable-application-cache',
            ];

            if (headless) {
                stabilityArgs.push('--disable-software-rasterizer');
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

        return { browserId, browser };
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

    keys() {
        return this.browsers.keys();
    }
}

export const browserService = new BrowserManager();
