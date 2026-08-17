import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';

const selectOption = (req, res) =>
    executePlaywrightAction(req, res, 'select_option', async (page, opts) => {
        const { selector, selectionCriteria, selectionValue } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : undefined;

        if (!selector) throw new Error(req.t('errors.selector_required'));

        const targetSelector = await normalizeSelectorForDotId(page, selector);

        let valuesToSelect = {};
        const runOptions = {};
        if (timeout) runOptions.timeout = timeout;

        if (selectionValue !== '' && selectionValue !== null && selectionValue !== undefined) {
            if (selectionCriteria === 'value') {
                valuesToSelect.value = selectionValue;
            } else if (selectionCriteria === 'label') {
                valuesToSelect.label = selectionValue;
            } else if (selectionCriteria === 'index') {
                valuesToSelect.index = parseInt(selectionValue, 10);
            } else {
                throw new Error(
                    req.t('errors.invalid_selection_criteria', { criteria: selectionCriteria }),
                );
            }
        }

        let resolvedTarget = targetSelector;
        let resolvedTargetType = 'original_selector';

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

                    if (!selectionValue) {
                        valuesToSelect = await locator.evaluate((el) => el.value);
                    }
                }
            }
        } catch (err) {
            console.warn('[WARN] Failed to inspect element in select_option:', err.message);
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
                selectionCriteria,
                selectionValue,
                timeout,
                resolvedTarget: resolvedTargetType,
                implicitSelection: !selectionValue && resolvedTargetType === 'parent_select',
            },
        };
    });

export default selectOption;
