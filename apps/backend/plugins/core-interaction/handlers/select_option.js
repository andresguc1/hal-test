import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

/**
 * Native <select> dropdown (single or multiple).
 *
 * Selects an option by value, label or index on a native <select> element.
 * If the selector points at an <option> node, the parent <select> is used and
 * the option value is inferred automatically.
 */
const selectOption = (req, res) =>
    executePlaywrightAction(req, res, 'select_option', async (page, opts) => {
        const { selector, selectionCriteria, selectionValue } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : 30000;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        // Accept importer-style `value`/`label` keys as well as the canonical
        // `selectionCriteria`/`selectionValue` fields.
        let criteria = selectionCriteria;
        let valueToSelect = selectionValue;
        if (valueToSelect === undefined || valueToSelect === null || valueToSelect === '') {
            if (opts.value !== undefined && opts.value !== null && opts.value !== '') {
                criteria = 'value';
                valueToSelect = opts.value;
            } else if (opts.label !== undefined && opts.label !== null && opts.label !== '') {
                criteria = 'label';
                valueToSelect = opts.label;
            }
        }

        const targetSelector = await normalizeSelectorForDotId(page, selector);

        let valuesToSelect = {};
        const runOptions = {};
        if (timeout) runOptions.timeout = timeout;

        if (valueToSelect !== '' && valueToSelect !== null && valueToSelect !== undefined) {
            if (criteria === 'value') {
                valuesToSelect.value = valueToSelect;
            } else if (criteria === 'label') {
                valuesToSelect.label = valueToSelect;
            } else if (criteria === 'index') {
                valuesToSelect.index = parseInt(valueToSelect, 10);
            } else {
                throw new Error(req.t('errors.invalid_selection_criteria', { criteria }));
            }
        } else {
            throw new Error(req.t('errors.select_option_value_required'));
        }

        let resolvedTarget = targetSelector;
        let resolvedTargetType = 'original_selector';
        let isNativeSelect = false;

        try {
            const locator = buildPlaywrightLocator(page, targetSelector);
            await locator.waitFor({ state: 'attached', timeout: timeout || 30000 });
            const tagName = await locator.evaluate((el) => el.tagName);

            if (tagName === 'OPTION') {
                const selectLocator = locator.locator('xpath=ancestor::select').first();
                const count = await selectLocator.count();
                if (count > 0) {
                    resolvedTarget = selectLocator;
                    resolvedTargetType = 'parent_select';
                    isNativeSelect = true;
                }
            } else if (tagName === 'SELECT') {
                isNativeSelect = true;
            }
        } catch (err) {
            console.warn('[WARN] Failed to inspect element in select_option:', err.message);
        }

        if (!isNativeSelect) {
            throw new Error(req.t('errors.select_option_not_native', { selector: targetSelector }));
        }

        let result;
        if (resolvedTargetType === 'parent_select' && typeof resolvedTarget !== 'string') {
            result = await resolvedTarget.selectOption(valuesToSelect, runOptions);
        } else {
            result = await page.selectOption(resolvedTarget, valuesToSelect, runOptions);
        }

        return {
            message: req.t('actions.select_option.success'),
            data: { selected: result },
            traceDetails: {
                selector: targetSelector,
                selectionCriteria: criteria,
                selectionValue: valueToSelect,
                timeout,
                resolvedTarget: resolvedTargetType,
                isNativeSelect,
                implicitSelection: !valueToSelect && resolvedTargetType === 'parent_select',
            },
        };
    });

export default selectOption;
