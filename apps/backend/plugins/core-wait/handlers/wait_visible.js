import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const waitVisible = (req, res) =>
    executePlaywrightAction(req, res, 'wait_visible', async (page, opts) => {
        const { selector, timeout = 15000, scrollIntoView = true } = opts;

        if (!selector) {
            throw new Error(req.t('errors.selector_required'));
        }

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const locator = buildPlaywrightLocator(page, targetSelector);

        if (scrollIntoView) {
            try {
                await locator.waitFor({ state: 'attached', timeout });
                await locator.scrollIntoViewIfNeeded();
            } catch (err) {
                console.warn(
                    `[WARN] Could not scroll to element '${targetSelector}': ${err.message}`,
                );
            }
        }

        await locator.waitFor({ state: 'visible', timeout });

        let screenshotData = null;
        try {
            await page.waitForTimeout(500);
            const screenshot = await page.screenshot({
                fullPage: false,
                type: 'png',
            });
            screenshotData = screenshot.toString('base64');
        } catch (err) {
            console.warn(
                '[WARN] Failed to take automatic screenshot in wait_visible:',
                err.message,
            );
        }

        return {
            message: req.t('actions.wait_visible.success'),
            data: { screenshot: screenshotData },
            traceDetails: { selector, timeout, scrollIntoView },
        };
    });

export default waitVisible;
