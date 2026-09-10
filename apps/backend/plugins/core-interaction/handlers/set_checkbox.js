import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { actionLabel, applyCheckbox, findLabelCheckboxLocator } from '../utils/checkboxUtils.js';

/**
 * Sets the state of checkbox(es) — native inputs OR ARIA [role=checkbox] —
 * in a single node execution.
 *
 * Modes:
 *  - Single:   { selector, action } where action ∈ check | uncheck | toggle
 *  - Multiple: { fields: [{ strategy: 'css'|'label', target, action }] }
 *
 * The live state is always re-read from the DOM after each action. If the
 * desired state is not reached, the action is retried once before failing.
 */

const assertMatches = (target, action, state, source) => {
    if (state !== actionLabel(action)) {
        throw new Error(
            `Failed to ${action} ${source}: state is ${state} after the action (retried once).`,
        );
    }
};

/** Resolves the target locator for a css|label strategy. */
const resolveCheckboxLocator = async (page, { strategy, target }, timeout) => {
    if (strategy === 'label') {
        return await findLabelCheckboxLocator(page, target);
    }

    const normalized = await normalizeSelectorForDotId(page, target);
    const locator = buildPlaywrightLocator(page, normalized);
    await locator.waitFor({ state: 'attached', timeout });
    return { locator, source: normalized };
};

const setCheckbox = (req, res) =>
    executePlaywrightAction(req, res, 'set_checkbox', async (page, opts) => {
        const { action = 'check', fields } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : 30000;
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
                if (fAction !== 'toggle') {
                    assertMatches(field.target, fAction, state, source);
                }

                results.push({
                    strategy,
                    target: String(target).trim(),
                    action: fAction,
                    checked: state === 'checked',
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

        await locator.waitFor({ state: 'attached', timeout });

        const state = await applyCheckbox(page, locator, action, { timeout });
        assertMatches(selector, action, state, targetSelector);

        return {
            message: req.t('actions.set_checkbox.success', {
                selector: targetSelector,
                action,
            }),
            data: {
                selector: targetSelector,
                action,
                checked: state === 'checked',
                selected: action === 'check',
            },
            traceDetails: { selector: targetSelector, action, checked: state === 'checked' },
        };
    });

export default setCheckbox;
