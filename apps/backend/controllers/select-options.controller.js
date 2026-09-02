import { browserService } from '../services/browser.service.js';
import { detectOptions } from '../services/OptionDetector.js';

/**
 * POST /api/actions/select_option/detect
 *
 * Detects selectable options inside a container without mutating the page.
 * This is a design-time helper used by the frontend OptionPickerEditor.
 */
export const detectOptionsAction = async (req, res) => {
    try {
        const { browserId, containerSelector } = req.body;

        if (!containerSelector || typeof containerSelector !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'containerSelector is required',
            });
        }

        const entry = browserService.get(browserId);
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Browser not found',
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
