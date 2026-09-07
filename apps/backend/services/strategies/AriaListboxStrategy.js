import { BaseStrategy, registerStrategy } from '../InteractionStrategy.js';

export class AriaListboxStrategy extends BaseStrategy {
    get supportsMultiSelect() {
        return true;
    }

    async execute(ctx) {
        const { page, containerSelector, selectedOptions, detectedOptions, timeout } = ctx;
        const runOptions = { timeout };

        const listboxOptions = detectedOptions.filter((o) => o.type === 'aria_option');

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

        const evidence = [];
        const applied = [];
        let actionCount = 0;

        for (const sel of selections) {
            const option = this.findOption(listboxOptions, sel);

            if (!option) {
                evidence.push({
                    label: sel.label,
                    value: sel.value,
                    type: 'aria_option',
                    before: 'Unknown',
                    action: 'SELECT',
                    after: null,
                    result: 'FAIL',
                    message: `Option "${sel.label || sel.value}" not found in detected listbox options`,
                });
                continue;
            }

            if (option.enabled === false) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: option.selected ? 'Selected' : 'Unselected',
                    action: 'SELECT',
                    after: option.selected ? 'Selected' : 'Unselected',
                    result: 'FAIL',
                    message: 'Option is disabled and cannot be interacted with.',
                });
                continue;
            }

            if (option.visible === false) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: option.selected ? 'Selected' : 'Unselected',
                    action: 'SELECT',
                    after: option.selected ? 'Selected' : 'Unselected',
                    result: 'FAIL',
                    message: 'Option is hidden and cannot be interacted with.',
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

            const target = await this.buildTargetLocator(page, option, containerSelector, {
                timeout,
            });
            if (!target) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: 'Unselected',
                    action: 'SELECT',
                    after: null,
                    result: 'FAIL',
                    message: 'Could not resolve locator for option',
                });
                throw new Error(`Could not resolve locator for option "${option.label}"`);
            }

            try {
                await target.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
                await target.click(runOptions);

                // Add to applied immediately (matching old behavior)
                applied.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    action: 'SELECT',
                    selected: true,
                });
                actionCount++;

                await this.safeWait(page);

                const after = await this.readState(target, option);
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
                    `Failed to select listbox option "${option.label}": ${err.message}`,
                );
            }
        }

        return { applied, evidence, actionCount, optionCount: detectedOptions.length };
    }
}

registerStrategy('listbox', AriaListboxStrategy);
export default AriaListboxStrategy;
