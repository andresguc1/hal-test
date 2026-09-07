import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../../core/selector-utils.js';
import { discoverOptions } from '../../../services/OptionDiscoveryService.js';
import { writeOptions } from '../../../services/OptionWriter.js';
import { getStrategy } from '../../../services/InteractionStrategy.js';

const selectOption = (req, res) =>
    executePlaywrightAction(req, res, 'select_option', async (page, opts) => {
        const {
            selector,
            selectionCriteria,
            selectionValue,
            containerSelector,
            selectedOptions,
            expandMenu,
        } = opts;
        const timeout = opts.timeout ? Number(opts.timeout) : 30000;

        const hasNewMode =
            (containerSelector && containerSelector.trim().length > 0) ||
            (Array.isArray(selectedOptions) && selectedOptions.length > 0);

        // ---------------------------------------------------------------
        // NEW MODE: containerSelector + auto-detected options + multi selection
        // ---------------------------------------------------------------
        if (hasNewMode) {
            if (!containerSelector || !containerSelector.trim()) {
                throw new Error(req.t('errors.select_option_container_required'));
            }

            // 1. Detect options FIRST (before any clicks that might close the menu)
            const detection = await discoverOptions(page, containerSelector, { timeout });

            if (!detection.options || detection.options.length === 0) {
                throw new Error(
                    req.t('errors.select_option_no_options', {
                        selector: containerSelector,
                        message: detection.analysisNotes?.join(' ') || '',
                    }),
                );
            }

            // 2. Determine if menu needs to be opened based on strategy
            const groupType = detection.groupType;
            const strategy = getStrategy(groupType);
            const shouldOpenMenu = expandMenu !== false && strategy.requiresMenuOpen;

            let menuOpen = false;
            if (shouldOpenMenu) {
                try {
                    const trigger = buildPlaywrightLocator(page, containerSelector).first();
                    await trigger.waitFor({ state: 'attached', timeout });
                    const isExpanded =
                        (await trigger.getAttribute('aria-expanded').catch(() => 'false')) ===
                        'true';
                    if (!isExpanded) {
                        await trigger.click({ timeout });
                        await page.waitForTimeout(300);
                    }
                    menuOpen = true;
                } catch (err) {
                    console.warn('[select_option] trigger click failed:', err.message);
                }
            }

            // 3. Write selections using strategy-based OptionWriter
            const result = await writeOptions(page, {
                containerSelector,
                selectedOptions,
                options: detection.options,
                timeout,
                menuOpen,
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
                    detectionNotes: detection.analysisNotes,
                    strategyUsed: groupType,
                    menuOpened: menuOpen,
                },
                ...(failures.length > 0
                    ? { warnings: failures.map((f) => f.message).filter(Boolean) }
                    : {}),
            };
        }

        // ---------------------------------------------------------------
        // LEGACY MODE: single <select> via selector + selectionCriteria/Value
        // Only used when NO containerSelector and NO selectedOptions provided
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

                    if (!valueToSelect) {
                        valuesToSelect = await locator.evaluate((el) => el.value);
                    }
                }
            } else if (tagName === 'SELECT') {
                isNativeSelect = true;
            }
        } catch (err) {
            console.warn('[WARN] Failed to inspect element in select_option:', err.message);
        }

        let result;

        if (isNativeSelect) {
            // Native <select>: use Playwright's selectOption (the only correct API)
            if (resolvedTargetType === 'parent_select' && typeof resolvedTarget !== 'string') {
                result = await resolvedTarget.selectOption(valuesToSelect, runOptions);
            } else {
                result = await page.selectOption(resolvedTarget, valuesToSelect, runOptions);
            }
        } else {
            // Custom dropdown (div/button-based): open trigger, then click the option by text/label
            const containerLocator = buildPlaywrightLocator(page, targetSelector).first();
            await containerLocator.waitFor({ state: 'attached', timeout: timeout || 30000 });
            await containerLocator.click({ timeout });
            await page.waitForTimeout(300);

            const optionText = valueToSelect || (criteria === 'label' ? selectionValue : undefined);
            if (optionText) {
                const optionLocator = containerLocator.getByText(String(optionText), {
                    exact: true,
                });
                await optionLocator.waitFor({ state: 'visible', timeout });
                await optionLocator.click({ timeout });
            } else {
                // Fallback: click first available option in the expanded menu
                const firstOption = containerLocator
                    .locator('role=option, [role="option"], li, div[data-option]')
                    .first();
                await firstOption.waitFor({ state: 'visible', timeout });
                await firstOption.click({ timeout });
            }
            result = { selected: optionText || 'custom-option' };
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
