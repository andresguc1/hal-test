import { BaseStrategy, registerStrategy } from '../InteractionStrategy.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../core/selector-utils.js';

export class AriaComboboxStrategy extends BaseStrategy {
    get requiresMenuOpen() {
        return true;
    }

    get supportsMultiSelect() {
        return false;
    }

    async detect(page, containerSelector, timeout = 30000) {
        const { detectOptions } = await import('../OptionDetector.js');
        const result = await detectOptions(page, containerSelector, { timeout });
        const baseOptions = result.options || [];

        const comboboxTrigger = await this.findComboboxTrigger(page, containerSelector);
        const popupOptions = await this.detectPopupOptions(page, comboboxTrigger, timeout);

        return [...baseOptions, ...popupOptions];
    }

    async findComboboxTrigger(page, containerSelector) {
        const container = await normalizeSelectorForDotId(page, containerSelector);
        const containerLocator = buildPlaywrightLocator(page, container).first();

        const trigger = containerLocator.locator('[role="combobox"]').first();
        const count = await trigger.count();
        if (count > 0) return trigger;

        return containerLocator;
    }

    async detectPopupOptions(page, trigger, _timeout) {
        const options = [];

        try {
            const ariaControls = await trigger.getAttribute('aria-controls').catch(() => null);
            let popupLocator;

            if (ariaControls) {
                popupLocator = page.locator(`#${ariaControls}`).first();
            } else {
                popupLocator = page
                    .locator('[role="listbox"], [role="menu"], [role="tree"], [role="dialog"]')
                    .first();
            }

            const popupCount = await popupLocator.count();
            if (popupCount === 0) return options;

            await popupLocator.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});

            const optionLocators = popupLocator.locator('[role="option"]');
            const optionCount = await optionLocators.count();

            for (let i = 0; i < optionCount; i++) {
                const opt = optionLocators.nth(i);
                const label = await opt.textContent().catch(() => '');
                const value = (await opt.getAttribute('data-value').catch(() => null)) || label;
                const selected =
                    (await opt.getAttribute('aria-selected').catch(() => 'false')) === 'true';

                options.push({
                    type: 'aria_option',
                    label: label?.trim() || `Option ${i}`,
                    value,
                    selected,
                    checked: selected,
                    enabled: true,
                    visible: true,
                    locator: `[role="option"]:nth-of-type(${i + 1})`,
                    index: i,
                });
            }
        } catch (err) {
            console.warn('[AriaComboboxStrategy] Popup detection failed:', err.message);
        }

        return options;
    }

    async execute(ctx) {
        const { page, containerSelector, selectedOptions, detectedOptions, timeout, menuOpen } =
            ctx;
        const runOptions = { timeout };

        const comboboxOptions = detectedOptions.filter((o) => o.type === 'aria_option');

        const selections = selectedOptions.filter(
            (s) => this.normalizeAction(s.action) === 'SELECT',
        );

        if (selections.length === 0) {
            return {
                applied: [],
                evidence: [],
                actionCount: 0,
                optionCount: detectedOptions.length,
            };
        }

        const trigger = await this.findComboboxTrigger(page, containerSelector);
        const triggerCount = await trigger.count();

        if (triggerCount === 0) {
            throw new Error('Could not find combobox trigger element');
        }

        const evidence = [];
        const applied = [];
        let actionCount = 0;

        if (!menuOpen) {
            try {
                const isExpanded =
                    (await trigger.getAttribute('aria-expanded').catch(() => 'false')) === 'true';
                if (!isExpanded) {
                    await trigger.click({ timeout: 5000 });
                    await this.safeWait(page, 300);
                }
            } catch (err) {
                console.warn('[AriaComboboxStrategy] Failed to open combobox:', err.message);
            }
        }

        for (const sel of selections) {
            const option = this.findOption(comboboxOptions, sel);

            if (!option) {
                evidence.push({
                    label: sel.label,
                    value: sel.value,
                    type: 'aria_option',
                    before: 'Unknown',
                    action: 'SELECT',
                    after: null,
                    result: 'FAIL',
                    message: `Option "${sel.label || sel.value}" not found in combobox options`,
                });
                continue;
            }

            const before = option.selected;

            if (before === true) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: 'Selected',
                    action: 'SELECT',
                    after: 'Selected',
                    result: 'PASS',
                    message: 'Already selected. No interaction performed.',
                });
                continue;
            }

            const optionLocator = page
                .locator(`[role="option"]:has-text("${option.label.replace(/"/g, '\\"')}")`)
                .first();

            try {
                await optionLocator.waitFor({ state: 'visible', timeout: 5000 });
                await optionLocator.click(runOptions);

                // Add to applied immediately (matching old behavior)
                applied.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    action: 'SELECT',
                    selected: true,
                });
                actionCount++;

                await this.safeWait(page, 100);

                const after = await this.readState(optionLocator, option);
                const pass = after === true;

                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: 'Unselected',
                    action: 'SELECT',
                    after: after ? 'Selected' : 'Unselected',
                    result: pass ? 'PASS' : 'FAIL',
                    message: pass
                        ? null
                        : `Expected Selected but found ${after ? 'Selected' : 'Unselected'}`,
                });
            } catch (err) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: 'Unselected',
                    action: 'SELECT',
                    after: null,
                    result: 'FAIL',
                    message: err.message,
                });
                throw new Error(
                    `Failed to select combobox option "${option.label}": ${err.message}`,
                );
            }
        }

        return { applied, evidence, actionCount, optionCount: detectedOptions.length };
    }
}

registerStrategy('combobox', AriaComboboxStrategy);
export default AriaComboboxStrategy;
