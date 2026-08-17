import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { DEVICE_PRESETS } from '../../../utils/constants.js';
import { browserService } from '../../../services/browser.service.js';

const resizeViewportAction = (req, res) =>
    executePlaywrightAction(req, res, 'resize_viewport', async (page, opts) => {
        const { devicePreset } = opts;
        let { width, height } = opts;

        // If a preset is provided, use its dimensions
        if (devicePreset && DEVICE_PRESETS[devicePreset]) {
            width = DEVICE_PRESETS[devicePreset].width;
            height = DEVICE_PRESETS[devicePreset].height;
        }

        if (!width || !height) {
            const error = new Error(req.t('errors.width_height_required'));
            error.status = 400;
            throw error;
        }

        const w = Number(width);
        const h = Number(height);

        // 1. Resize Internal Viewport
        await page.setViewportSize({ width: w, height: h });

        // 2. Attempt to resize physical window if headful
        try {
            const browser = page.context().browser();
            if (browser) {
                const browserId = req.body.browserId;
                const entry = browserService.get(browserId);

                // If we are in headful (headless=false), we try to resize the window via CDP or window calls
                if (entry && !entry.options.headless) {
                    console.log(`[ResizeViewport] Attempting physical resize to ${w}x${h}`);

                    // Chromium specific: using CDP instance to resize window
                    const session = await page.context().newCDPSession(page);
                    const { windowId } = await session.send('Browser.getWindowForTarget');
                    await session.send('Browser.setWindowBounds', {
                        windowId,
                        bounds: { width: w + 20, height: h + 100 }, // Add broad padding for headful UI
                    });
                    await session.detach();
                }
            }
        } catch (err) {
            console.warn('[ResizeViewport] Could not resize physical window:', err.message);
        }

        return {
            message: req.t('actions.resize_viewport.success', { width: w, height: h }),
            traceDetails: { width: w, height: h, devicePreset },
        };
    });

export default resizeViewportAction;
