import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const findElement = (req, res) =>
    executePlaywrightAction(req, res, 'find_element', async (page, opts) => {
        const { selector, selectorType = 'css', timeout = 10000, visible = true } = opts;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const locator = buildPlaywrightLocator(page, targetSelector);

        const waitState = visible ? 'visible' : 'attached';

        try {
            await locator.waitFor({ state: waitState, timeout });
            const isVisible = await locator.isVisible();

            return {
                message: req.t('actions.find_element.success', { selector: targetSelector }),
                data: {
                    found: true,
                    visible: isVisible,
                    success: true,
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
        } catch (error) {
            // Element is absent (or never reached the requested state). This is
            // a normal, expected outcome when find_element is used to branch on
            // existence. Instead of throwing (which soft-fails the node in
            // Draft Mode and prevents the result from being stored), return a
            // consistent { found: false } payload so the variable
            // "{{<node>.found}}" resolves to false for downstream conditionals.
            // Only swallow not-found/timeout errors; genuine selector or
            // scripting errors continue to bubble up through the normal error
            // pipeline (healing, audit, failure status).
            const isNotFound =
                error?.name === 'TimeoutError' ||
                /timeout|waiting for|not found/i.test(error?.message || '');
            if (!isNotFound) throw error;

            return {
                message: req.t('actions.find_element.not_found', { selector: targetSelector }),
                data: {
                    found: false,
                    visible: false,
                    success: false,
                    selectorType,
                    state: waitState,
                },
                traceDetails: {
                    selector: targetSelector,
                    selectorType,
                    found: false,
                    visible: false,
                },
                responseExtra: { notFound: true },
            };
        }
    });

export default findElement;
