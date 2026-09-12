import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';

/**
 * Selects a single radio button (native input or ARIA [role=radio]).
 *
 * `selector` points directly at the radio input (or its label). The result is
 * verified by reading the live state after the action.
 */
const setRadio = (req, res) =>
    executePlaywrightAction(req, res, 'set_radio', async (page, opts) => {
        const { selector } = opts;
        const timeout = normalizeTimeout(opts.timeout);

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const runOptions = playTimeout(timeout);
        const locator = buildPlaywrightLocator(page, targetSelector);

        await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });

        // check() only works on native radio inputs; ARIA [role=radio] elements
        // are selected via click.
        await locator.check(runOptions).catch(async () => {
            await locator.click(runOptions);
        });

        if (page && typeof page.waitForTimeout === 'function') {
            await page.waitForTimeout(50).catch(() => {});
        }

        const checked = await locator
            .isChecked()
            .catch(async () =>
                locator.evaluate(
                    (el) => el.getAttribute('aria-checked') === 'true' || el.checked === true,
                ),
            );

        if (checked !== true) {
            throw new Error(
                `Failed to select radio "${targetSelector}": element is not checked after the action.`,
            );
        }

        return {
            message: req.t('actions.set_radio.success', { selector: targetSelector }),
            data: { selector: targetSelector, checked: true, selected: true },
            traceDetails: { selector: targetSelector, checked },
        };
    });

export default setRadio;
