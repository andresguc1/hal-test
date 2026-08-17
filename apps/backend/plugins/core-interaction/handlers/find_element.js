import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const findElement = (req, res) =>
    executePlaywrightAction(req, res, 'find_element', async (page, opts) => {
        const { selector, selectorType = 'css', timeout = 10000, visible = true } = opts;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const locator = buildPlaywrightLocator(page, targetSelector);

        const waitState = visible ? 'visible' : 'attached';

        await locator.waitFor({ state: waitState, timeout });
        const isVisible = await locator.isVisible();

        return {
            message: req.t('actions.find_element.success', { selector: targetSelector }),
            data: {
                found: true,
                visible: isVisible,
                selectorType,
                state: waitState,
            },
            traceDetails: {
                selector: targetSelector,
                selectorType,
                found: true,
                visible: isVisible,
            },
        };
    });

export default findElement;
