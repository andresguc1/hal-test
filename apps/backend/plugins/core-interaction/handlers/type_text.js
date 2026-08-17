import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const typeText = (req, res) =>
    executePlaywrightAction(req, res, 'type_text', async (page, opts) => {
        const { selector, text, clearBeforeType, delay } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : undefined;

        if (!selector) throw new Error(req.t('errors.selector_required'));
        if (text === undefined || text === null) throw new Error(req.t('errors.text_required'));

        const actionOptions = { timeout };
        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const locator = buildPlaywrightLocator(page, targetSelector);

        if (clearBeforeType) {
            if (delay > 0) {
                await locator.fill('', actionOptions);
                await locator.type(text, { ...actionOptions, delay });
            } else {
                await locator.fill(text, actionOptions);
            }
        } else {
            await locator.type(text, { ...actionOptions, delay: delay || 0 });
        }

        let screenshotData = null;
        try {
            await page.waitForTimeout(200);
            const screenshot = await page.screenshot({
                fullPage: false,
                type: 'png',
            });
            screenshotData = screenshot.toString('base64');
        } catch (err) {
            console.warn('[WARN] Failed to take automatic screenshot in type_text:', err.message);
        }

        return {
            message: req.t('actions.type_text.success', { selector }),
            data: { screenshot: screenshotData },
            traceDetails: { selector, textLength: text.length, delay, clearBeforeType },
        };
    });

export default typeText;
