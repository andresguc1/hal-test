import { browserService } from '../services/browser.service.js';
import { startInspector, stopInspector } from '../services/inspector.service.js';

export const startInspectorAction = async (req, res) => {
    try {
        const { browserId, url } = req.body;

        // 1. Get Browser
        const entry = browserService.get(browserId);
        if (!entry) {
            const msg = req.t
                ? req.t('errors.browser_not_found', { id: browserId || 'latest' })
                : `Browser not found (${browserId || 'latest'})`;

            console.warn('[Inspector] No active browser found to start inspector.');

            return res.status(404).json({
                success: false,
                message: msg,
            });
        }

        const browser = entry.browser || entry;

        // Zombie Check: Is the browser actually alive?
        if (!browser || (typeof browser.isConnected === 'function' && !browser.isConnected())) {
            console.warn(
                `[Inspector] Browser ${browserId} is dead/disconnected. Purging from registry.`,
            );
            browserService.delete(browserId);
            return res.status(404).json({
                success: false,
                code: 'BROWSER_DISCONNECTED',
                message: 'The requested browser session has expired or was closed.',
            });
        }

        // 2. Get Active Page (Search all contexts)
        const contexts = browser.contexts();

        let page = null;
        if (contexts.length > 0) {
            for (const ctx of contexts) {
                const pages = ctx.pages();
                if (pages.length > 0) {
                    page = pages[pages.length - 1];
                    break;
                }
            }
        }

        if (!page) {
            console.log('[Inspector] No pages found. Creating a new page.');
            try {
                const context = contexts.length > 0 ? contexts[0] : await browser.newContext();
                page = await context.newPage();

                if (url) {
                    console.log(`[Inspector] Navigating to requested URL: ${url}`);
                    await page
                        .goto(url, { waitUntil: 'load' })
                        .catch((e) => console.warn('Failed to goto url:', e.message));
                }
            } catch (err) {
                return res.status(500).json({
                    success: false,
                    message: `Failed to create a new page: ${err.message}`,
                });
            }
        }

        // 3. Start Inspector
        await startInspector(page);

        return res.status(200).json({
            success: true,
            message: 'Inspector started',
        });
    } catch (error) {
        console.error('[InspectorController] Critical Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to start inspector',
            error: error.message || String(error),
        });
    }
};

export const getActiveSessionsAction = async (req, res) => {
    try {
        const ids = Array.from(browserService.keys());
        return res.status(200).json({
            success: true,
            sessions: ids,
        });
    } catch (error) {
        console.error('[Inspector Controller] Error fetching sessions:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
};

export const stopInspectorAction = async (req, res) => {
    try {
        const { browserId } = req.body;

        const entry = browserService.get(browserId);
        if (!entry) {
            // If browser is gone, inspector is gone.
            return res.status(200).json({ success: true, message: 'Browser not active' });
        }

        const browser = entry.browser || entry;
        const contexts = browser.contexts();
        if (contexts.length === 0) return res.status(200).json({ success: true });

        const pages = contexts[0].pages();
        if (pages.length === 0) return res.status(200).json({ success: true });

        const page = pages[pages.length - 1];

        await stopInspector(page);

        return res.status(200).json({
            success: true,
            message: 'Inspector stopped',
        });
    } catch (error) {
        console.error('[InspectorController] Stop Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to stop inspector',
            error: error.message || String(error),
        });
    }
};

/**
 * NEW: Remote Browser Bridge (Phase 3)
 * Launches a new browser and starts the inspector on a page.
 */
export const launchRemoteAction = async (req, res) => {
    try {
        const { url = 'https://www.google.com' } = req.body;

        console.log(`[Inspector] Launching remote browser for URL: ${url}`);

        // 1. Launch Browser (Headful chromium for visibility on the desktop/vnc)
        const { browserId, browser } = await browserService.launchBrowser({
            headless: false,
            browserType: 'chromium',
        });

        // 2. Create Page
        const context = await browser.newContext();
        const page = await context.newPage();

        // 3. Navigate
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 4. Start Inspector
        await startInspector(page);

        return res.status(200).json({
            success: true,
            browserId,
            message: 'Remote browser launched and inspector active',
        });
    } catch (error) {
        console.error('[InspectorController] Remote Launch Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to launch remote inspector',
            error: error.message,
        });
    }
};
