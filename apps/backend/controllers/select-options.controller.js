import { browserService } from '../services/browser.service.js';
import { detectOptions, detectOptionsStatic } from '../services/OptionDetector.js';

/**
 * POST /api/actions/select_option/detect
 *
 * Detects selectable options inside a container without mutating the page.
 * This is a design-time helper used by the frontend OptionPickerEditor.
 * Supports both live browser detection and static HTML analysis for native selects.
 */
export const detectOptionsAction = async (req, res) => {
    try {
        const { browserId, containerSelector, staticHtml } = req.body;

        if (!containerSelector || typeof containerSelector !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'containerSelector is required',
            });
        }

        // If staticHtml is provided, use static analysis (no browser needed)
        // This enables detection for native <select> elements from saved page snapshots
        if (staticHtml && typeof staticHtml === 'string') {
            try {
                const result = await detectOptionsStatic(staticHtml, containerSelector);
                return res.status(200).json({
                    success: true,
                    data: result,
                    detectionMode: 'static',
                });
            } catch (staticErr) {
                console.warn(
                    '[OptionDetector] Static detection failed, falling back to live:',
                    staticErr.message,
                );
                // Fall through to live detection
            }
        }

        // Live browser detection (requires active browser session)
        const entry = browserService.get(browserId);
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: browserId
                    ? `Browser not found (ID: ${browserId})`
                    : 'Browser not found. Launch a browser session and load the page before detecting options.',
            });
        }

        const browser = entry.browser || entry;
        const contexts = browser.contexts();
        if (!contexts || contexts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No browser context available',
            });
        }

        let page = null;
        for (const ctx of contexts) {
            const pages = ctx.pages();
            if (pages.length > 0) {
                page = pages[pages.length - 1];
                break;
            }
        }

        if (!page || page.isClosed()) {
            return res.status(404).json({
                success: false,
                message: 'No active page',
            });
        }

        const result = await detectOptions(page, containerSelector);

        return res.status(200).json({
            success: true,
            data: result,
            detectionMode: 'live',
        });
    } catch (error) {
        console.error('[OptionDetector] Detect Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to detect options',
            error: error.message || String(error),
        });
    }
};

/**
 * POST /api/actions/select_option/page_content
 *
 * Returns the full HTML content of the active page for a given browser session.
 * Used for static detection of native <select> elements.
 */
export const getPageContentAction = async (req, res) => {
    try {
        const { browserId } = req.body;

        if (!browserId) {
            return res.status(400).json({
                success: false,
                message: 'browserId is required',
            });
        }

        const entry = browserService.get(browserId);
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: `Browser not found (ID: ${browserId})`,
            });
        }

        const browser = entry.browser || entry;
        const contexts = browser.contexts();
        if (!contexts || contexts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No browser context available',
            });
        }

        let page = null;
        for (const ctx of contexts) {
            const pages = ctx.pages();
            if (pages.length > 0) {
                page = pages[pages.length - 1];
                break;
            }
        }

        if (!page || page.isClosed()) {
            return res.status(404).json({
                success: false,
                message: 'No active page',
            });
        }

        const html = await page.content();

        return res.status(200).json({
            success: true,
            data: { html },
        });
    } catch (error) {
        console.error('[OptionDetector] Get Page Content Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get page content',
            error: error.message || String(error),
        });
    }
};
