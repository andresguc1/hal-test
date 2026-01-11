import { browserService } from '../services/browser.service.js';
import { startInspector } from '../services/inspector.service.js';

export const startInspectorAction = async (req, res) => {
    try {
        const { browserId } = req.body;

        // 1. Get Browser
        const entry = browserService.get(browserId);
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: req.t('errors.browser_not_found', { id: browserId || 'latest' }),
            });
        }

        const browser = entry.browser || entry;

        // 2. Get Active Page
        // Simple logic: Get the first page of the first context
        // In a multi-tab scenario, we might need more specific logic or user input
        const contexts = browser.contexts();
        if (contexts.length === 0) {
            return res.status(400).json({
                success: false,
                message: req.t('errors.no_active_pages'),
            });
        }

        const pages = contexts[0].pages();
        if (pages.length === 0) {
            return res.status(400).json({
                success: false,
                message: req.t('errors.no_active_pages'),
            });
        }

        // Use the last opened page usually (focused one)
        const page = pages[pages.length - 1];

        // 3. Start Inspector
        await startInspector(page);

        return res.status(200).json({
            success: true,
            message: 'Inspector started',
        });
    } catch (error) {
        console.error('[InspectorController] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to start inspector',
            error: error.message,
        });
    }
};
