import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { detectOptions } from '../../../services/OptionDetector.js';
import { writeOptions } from '../../../services/OptionWriter.js';

const selectOption = (req, res) =>
    executePlaywrightAction(req, res, 'select_option', async (page, opts) => {
        const {
            selector,
            selectionCriteria,
            selectionValue,
            containerSelector,
            selectedOptions,
            expandMenu = false,
        } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : 30000;

        const hasNewMode =
            (containerSelector && containerSelector.trim().length > 0) ||
            (Array.isArray(selectedOptions) && selectedOptions.length > 0);

        // ---------------------------------------------------------------
        // NEW MODE: container + auto-detected options + multi selection
        // ---------------------------------------------------------------
        if (hasNewMode) {
            if (!containerSelector || !containerSelector.trim()) {
                throw new Error(req.t('errors.select_option_container_required'));
            }

            if (expandMenu) {
                // For custom comboboxes / menus: click the trigger to expand the
                // options before detection.
                try {
                    const trigger = buildPlaywrightLocator(page, containerSelector).first();
                    await trigger.waitFor({ state: 'attached', timeout });
                    await trigger.click({ timeout });
                    await page.waitForTimeout(200);
                } catch (err) {
                    console.warn('[select_option] expandMenu click failed:', err.message);
                }
            }

            const detection = await detectOptions(page, containerSelector, { timeout });

            if (!detection.found || detection.options.length === 0) {
                throw new Error(
                    req.t('errors.select_option_no_options', {
                        selector: containerSelector,
                        message: detection.message || '',
                    }),
                );
            }

            const result = await writeOptions(page, {
                containerSelector,
                selectedOptions,
                options: detection.options,
                timeout,
            });

            const failures = (result.evidence || []).filter((e) => e.result === 'FAIL');

            return {
                message: req.t('actions.select_option.success'),
                data: {
                    selected: result.applied,
                    optionCount: result.optionCount,
                    actionCount: result.actionCount,
                    groupType: detection.groupType,
                    evidence: result.evidence || [],
                },
                traceDetails: {
                    containerSelector,
                    applied: result.applied.length,
                    actionCount: result.actionCount,
                    optionCount: result.optionCount,
                    value: Array.isArray(selectedOptions) ? selectedOptions.length : 0,
                    timeout,
                },
                ...(failures.length > 0
                    ? { warnings: failures.map((f) => f.message).filter(Boolean) }
                    : {}),
            };
        }

        // ---------------------------------------------------------------
        // LEGACY MODE: single <select> via selector + selectionCriteria/Value
        // ---------------------------------------------------------------
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

                    if (!valueToSelect) {
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
                selectionCriteria: criteria,
                selectionValue: valueToSelect,
                timeout,
                resolvedTarget: resolvedTargetType,
                implicitSelection: !valueToSelect && resolvedTargetType === 'parent_select',
            },
        };
    });

export default selectOption;
