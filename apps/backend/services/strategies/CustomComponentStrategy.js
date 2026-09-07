import { BaseStrategy, registerStrategy } from '../InteractionStrategy.js';
import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../../core/selector-utils.js';

export class CustomComponentStrategy extends BaseStrategy {
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

        const customOptions = await this.detectCustomOptions(page, containerSelector, timeout);

        return [...baseOptions, ...customOptions];
    }

    async detectCustomOptions(page, containerSelector, _timeout) {
        const options = [];

        try {
            const container = await normalizeSelectorForDotId(page, containerSelector);
            const containerLocator = buildPlaywrightLocator(page, container).first();

            const isExpanded =
                (await containerLocator.getAttribute('aria-expanded').catch(() => 'false')) ===
                'true';
            if (!isExpanded) {
                await containerLocator.click({ timeout: 3000 }).catch(() => {});
                await this.safeWait(page, 300);
            }

            const optionSelectors = [
                '[role="option"]',
                '[role="menuitem"]',
                '[role="treeitem"]',
                'li',
                '[data-option]',
                '.option',
                '.dropdown-item',
                '[data-testid*="option"]',
            ];

            for (const selector of optionSelectors) {
                const elements = containerLocator.locator(selector);
                const count = await elements.count().catch(() => 0);
                if (count === 0) continue;

                for (let i = 0; i < count; i++) {
                    const el = elements.nth(i);
                    const label = await el.textContent().catch(() => '');
                    const value = (await el.getAttribute('data-value').catch(() => null)) || label;
                    const selected =
                        (await el.getAttribute('aria-selected').catch(() => 'false')) === 'true' ||
                        (await el.getAttribute('data-selected').catch(() => 'false')) === 'true' ||
                        (await el
                            .evaluate(
                                (e) =>
                                    e.classList.contains('selected') ||
                                    e.classList.contains('active'),
                            )
                            .catch(() => false));

                    if (label && label.trim()) {
                        options.push({
                            type: 'custom_component',
                            label: label.trim(),
                            value,
                            selected,
                            checked: selected,
                            enabled: true,
                            visible: true,
                            locator: selector + ':nth-of-type(' + (i + 1) + ')',
                            index: i,
                        });
                    }
                }

                if (options.length > 0) break;
            }
        } catch (err) {
            console.warn('[CustomComponentStrategy] Custom option detection failed:', err.message);
        }

        return options;
    }

    async execute(ctx) {
        const { page, containerSelector, selectedOptions, detectedOptions, timeout, menuOpen } =
            ctx;
        const runOptions = { timeout };

        const customOptions = detectedOptions.filter((o) => o.type === 'custom_component');

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

        const container = await normalizeSelectorForDotId(page, containerSelector);
        const containerLocator = buildPlaywrightLocator(page, container).first();
        const containerCount = await containerLocator.count();

        if (containerCount === 0) {
            throw new Error('Could not find custom component container');
        }

        const evidence = [];
        const applied = [];
        let actionCount = 0;

        if (!menuOpen) {
            try {
                const isExpanded =
                    (await containerLocator.getAttribute('aria-expanded').catch(() => 'false')) ===
                    'true';
                if (!isExpanded) {
                    await containerLocator.click({ timeout: 5000 });
                    await this.safeWait(page, 300);
                }
            } catch (err) {
                console.warn(
                    '[CustomComponentStrategy] Failed to open custom dropdown:',
                    err.message,
                );
            }
        }

        for (const sel of selections) {
            const option = this.findOption(customOptions, sel);

            if (!option) {
                evidence.push({
                    label: sel.label,
                    value: sel.value,
                    type: 'custom_component',
                    before: 'Unknown',
                    action: 'SELECT',
                    after: null,
                    result: 'FAIL',
                    message: `Option "${sel.label || sel.value}" not found in custom component options`,
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

            const optionLocator = containerLocator.locator(option.locator).first();

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
                throw new Error(`Failed to select custom option "${option.label}": ${err.message}`);
            }
        }

        return { applied, evidence, actionCount, optionCount: detectedOptions.length };
    }
}

registerStrategy('custom', CustomComponentStrategy);
export default CustomComponentStrategy;
