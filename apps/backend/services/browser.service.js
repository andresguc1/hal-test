import { chromium, firefox, webkit } from 'playwright';
import { randomUUID } from 'crypto';

const MAX_BROWSERS = 3;

class BrowserManager {
    constructor() {
        this.browsers = new Map();
        this.lastAccessed = new Map();
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
            timeout,
        } = options;

        // FORCE headless mode in production (servers don't have X11/Display)
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction && !headless) {
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

        // 3. Configure Maximize Window
        // If the user passes --start-maximized, --start-fullscreen or --kiosk manually in args,
        // we must detect it to ensure the controller applies viewport: null
        if (
            launchArgs.includes('--start-maximized') ||
            launchArgs.includes('--start-fullscreen') ||
            launchArgs.includes('--kiosk')
        ) {
            maximizeWindow = true;
        }

        // To maximize in Chromium/Playwright, --start-maximized and viewport null are typically used
        if (maximizeWindow) {
            if (browserType === 'chromium' && !launchArgs.includes('--start-maximized')) {
                launchArgs.push('--start-maximized');
            } else if (browserType === 'firefox') {
                // Firefox does not support --start-maximized, we simulate with a large fixed size
                // Firefox uses single-dash arguments for width/height
                if (!launchArgs.some((arg) => arg.startsWith('-width'))) {
                    launchArgs.push('-width', '1920');
                }
                if (!launchArgs.some((arg) => arg.startsWith('-height'))) {
                    launchArgs.push('-height', '1080');
                }
            }
            // WebKit handles window size differently,
            // but viewport: null helps the page take the available size.
        }

        console.log(
            `[BrowserService] Launching ${browserType} (Headless: ${headless}, Maximize: ${maximizeWindow})`,
        );

        const browser = await browserEngine.launch({
            headless,
            args: launchArgs,
            ...(slowMo && { slowMo }),
            ...(timeout && { timeout }),
        });

        const browserId = randomUUID().split('-')[0];

        // We also save if maximize was requested to use it when creating contexts/pages
        this.set(browserId, {
            browser,
            launchMethod: 'launch',
            options: { ...options, launchArgs, maximizeWindow },
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
