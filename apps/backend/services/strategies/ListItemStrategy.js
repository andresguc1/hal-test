import { BaseStrategy, registerStrategy } from '../InteractionStrategy.js';

export class ListItemStrategy extends BaseStrategy {
    get supportsMultiSelect() {
        return true;
    }

    async execute(ctx) {
        const { page, containerSelector, selectedOptions, detectedOptions, timeout } = ctx;
        const runOptions = { timeout };

        // Handle both 'list' (legacy) and 'list_item' (canonical) types
        const listOptions = detectedOptions.filter(
            (o) => o.type === 'list_item' || o.type === 'list',
        );

        // Handle both SELECT and CHECK actions for backward compatibility
        const selections = selectedOptions.filter((s) => {
            const action = this.normalizeAction(s.action);
            return action === 'SELECT' || action === 'CHECK';
        });

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
            const originalAction = this.normalizeAction(sel.action);
            const option = this.findOption(listOptions, sel);

            if (!option) {
                evidence.push({
                    label: sel.label,
                    value: sel.value,
                    type: 'list_item',
                    before: 'Unknown',
                    action: originalAction,
                    after: null,
                    result: 'FAIL',
                    message: `Option "${sel.label || sel.value}" not found in detected list items`,
                });
                continue;
            }

            if (option.enabled === false) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: option.selected ? 'Selected' : 'Unselected',
                    action: originalAction,
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
                    action: originalAction,
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
                    action: originalAction,
                    after: 'Selected',
                    result: 'PASS',
                    message: 'Already in desired state. No interaction performed.',
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
                    action: originalAction,
                    after: null,
                    result: 'FAIL',
                    message: 'Could not resolve locator for option',
                });
                throw new Error(`Could not resolve locator for option "${option.label}"`);
            }

            try {
                await target.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
                await target.click(runOptions);

                // Add to applied immediately (matching old behavior) - preserve original action
                applied.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    action: originalAction,
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
                    action: originalAction,
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
                    action: originalAction,
                    after: null,
                    result: 'FAIL',
                    message: err.message,
                });
                throw new Error(`Failed to select list item "${option.label}": ${err.message}`);
            }
        }

        return { applied, evidence, actionCount, optionCount: detectedOptions.length };
    }
}

registerStrategy('list', ListItemStrategy);
export default ListItemStrategy;
