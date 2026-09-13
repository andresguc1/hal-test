import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';
import {
    applyCheckbox,
    assertCheckedState,
    findLabelCheckboxLocator,
    readState,
} from '../utils/checkboxUtils.js';

/**
 * Sets the state of checkbox(es) — native inputs OR ARIA [role=checkbox] —
 * in a single node execution.
 *
 * Modes:
 *  - Single:   { selector, action } where action ∈ check | uncheck | toggle
 *  - Multiple: { fields: [{ strategy: 'css'|'label', target, action }] }
 *
 * The live state is always re-read from the DOM after each action. When
 * `verifyState` is enabled (default), the reached state is additionally
 * asserted with Playwright-style polling (expect(locator).toBeChecked()).
 */

const shouldVerifyState = (opts, action) => opts.verifyState !== false && action !== 'toggle';

/** Resolves the target locator for a css|label strategy. */
const resolveCheckboxLocator = async (page, { strategy, target }, timeout) => {
    if (strategy === 'label') {
        return await findLabelCheckboxLocator(page, target);
    }

    const normalized = await normalizeSelectorForDotId(page, target);
    const locator = buildPlaywrightLocator(page, normalized);
    await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });
    return { locator, source: normalized };
};

const setCheckbox = (req, res) =>
    executePlaywrightAction(req, res, 'set_checkbox', async (page, opts) => {
        const { action = 'check', fields } = opts;
        const timeout = normalizeTimeout(opts.timeout);
        const targetRequired =
            req.t('errors.select_option_value_required') || 'Target is required.';

        const multi = Array.isArray(fields) && fields.length > 0;

        if (multi) {
            const results = [];
            for (const field of fields) {
                const { strategy = 'css', target, action: fAction = 'check' } = field;
                if (!target || !String(target).trim()) throw new Error(targetRequired);

                const { locator, source } = await resolveCheckboxLocator(
                    page,
                    { strategy, target: String(target).trim(), action: fAction },
                    timeout,
                );

                const state = await applyCheckbox(page, locator, fAction, { timeout });

                const verifiedState = shouldVerifyState(opts, fAction)
                    ? await assertCheckedState(locator, fAction === 'check', { timeout })
                    : state;

                results.push({
                    strategy,
                    target: String(target).trim(),
                    action: fAction,
                    source,
                    checked: verifiedState === 'checked',
                    ...(shouldVerifyState(opts, fAction)
                        ? { verification: 'toBeChecked' }
                        : { verification: 'readState' }),
                });

                if (opts.delayAfterEach) {
                    await page.waitForTimeout(Number(opts.delayAfterEach)).catch(() => {});
                }
            }

            const checkedCount = results.filter((r) => r.checked).length;
            return {
                message: req.t('actions.set_checkbox.success', {
                    selector: `${checkedCount}/${results.length} checkboxes`,
                    action: 'set',
                }),
                data: {
                    selector: opts.selector || `[${results.length} checkboxes]`,
                    action: 'set',
                    total: results.length,
                    ok: results.length,
                    fields: results,
                },
                traceDetails: { mode: 'multiple', results },
            };
        }

        const { selector } = opts;
        if (!selector) throw new Error(req.t('errors.selector_required'));

        const targetSelector = await normalizeSelectorForDotId(page, selector);
        const locator = buildPlaywrightLocator(page, targetSelector);

        await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });

        const beforeState = await readState(locator).catch(() => 'unknown');
        const state = await applyCheckbox(page, locator, action, { timeout });

        const verifiedState = shouldVerifyState(opts, action)
            ? await assertCheckedState(locator, action === 'check', { timeout })
            : state;

        return {
            message: req.t('actions.set_checkbox.success', {
                selector: targetSelector,
                action,
            }),
            data: {
                selector: targetSelector,
                action,
                checked: verifiedState === 'checked',
                selected: action === 'check',
                verification: shouldVerifyState(opts, action) ? 'toBeChecked' : 'readState',
                beforeState,
                afterState: verifiedState,
            },
            traceDetails: {
                selector: targetSelector,
                action,
                checked: verifiedState === 'checked',
                verification: shouldVerifyState(opts, action) ? 'toBeChecked' : 'readState',
                beforeState,
                afterState: verifiedState,
            },
        };
    });

export default setCheckbox;
