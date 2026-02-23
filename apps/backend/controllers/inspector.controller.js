import { browserService } from '../services/browser.service.js';
import { startInspector, stopInspector } from '../services/inspector.service.js';

export const startInspectorAction = async (req, res) => {
    try {
        const { browserId } = req.body;

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

        // 2. Get Active Page (Search all contexts)
        const contexts = browser.contexts();
        if (contexts.length === 0) {
            return res.status(400).json({
                success: false,
                message: req.t ? req.t('errors.no_active_pages') : 'No active contexts found',
            });
        }

        // Try to find a page in any context, preferring the first context's last page
        let page = null;
        for (const ctx of contexts) {
            const pages = ctx.pages();
            if (pages.length > 0) {
                page = pages[pages.length - 1];
                break;
            }
        }

        if (!page) {
            return res.status(400).json({
                success: false,
                message: req.t
                    ? req.t('errors.no_active_pages')
                    : 'No active pages found in any context. Please open a URL first.',
            });
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
