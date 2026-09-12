import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';

const hover = (req, res) =>
    executePlaywrightAction(req, res, 'hover', async (page, opts) => {
        const { selector } = opts;
        const timeout = normalizeTimeout(opts.timeout);

        if (!selector) {
            throw new Error(req.t('errors.selector_required'));
        }

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const locator = buildPlaywrightLocator(page, targetSelector);
        await locator.hover(playTimeout(timeout));

        return {
            message: req.t('actions.hover.success', { selector: targetSelector }),
            traceDetails: { selector: targetSelector, timeout },
        };
    });

export default hover;
