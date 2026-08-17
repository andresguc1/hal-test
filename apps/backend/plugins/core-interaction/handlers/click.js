import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const click = (req, res) =>
    executePlaywrightAction(req, res, 'click', async (page, opts) => {
        const { selector, button, clickCount, modifiers, force } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : undefined;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const clickOptions = { button, clickCount, modifiers, timeout, force };
        const locator = buildPlaywrightLocator(page, targetSelector);

        await locator.click(clickOptions);

        return {
            message: req.t('actions.click.success', { selector: targetSelector }),
            traceDetails: { selector: targetSelector, details: clickOptions },
        };
    });

export default click;
