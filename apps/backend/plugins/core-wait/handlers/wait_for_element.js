import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const waitForElement = (req, res) =>
    executePlaywrightAction(req, res, 'wait_for_element', async (page, opts) => {
        const { selector, condition = 'visible', timeout = 30000, scrollIntoView = false } = opts;

        try {
            const targetSelector = await normalizeSelectorForDotId(page, selector);
            const locator = buildPlaywrightLocator(page, targetSelector);

            if (scrollIntoView) {
                try {
                    await locator.waitFor({ state: 'attached', timeout });
                    await locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
                } catch (err) {
                    console.warn(
                        `[WARN] Scroll attempt failed for '${targetSelector}':`,
                        err.message,
                    );
                }
            }

            const playwrightState = condition;

            await locator.waitFor({ state: playwrightState, timeout });

            const messages = {
                visible: req.t('actions.wait_for_element.visible', { selector: targetSelector }),
                hidden: req.t('actions.wait_for_element.hidden', { selector: targetSelector }),
                attached: req.t('actions.wait_for_element.attached', { selector: targetSelector }),
                detached: req.t('actions.wait_for_element.detached', { selector: targetSelector }),
            };

            return {
                message: messages[condition] || req.t('actions.wait_for_element.condition_met'),
                data: {
                    selector: targetSelector,
                    condition,
                    conditionMet: true,
                },
                traceDetails: {
                    selector: targetSelector,
                    condition,
                    timeout,
                },
            };
        } catch (error) {
            if (error.name === 'TimeoutError' || error.message.includes('Timeout')) {
                throw new Error(req.t('errors.wait_timeout', { selector, condition, timeout }));
            }
            throw error;
        }
    });

export default waitForElement;
