import { BaseStrategy, registerStrategy } from '../InteractionStrategy.js';

export class CheckboxGroupStrategy extends BaseStrategy {
    get supportsMultiSelect() {
        return true;
    }

    async execute(ctx) {
        const { page, containerSelector, selectedOptions, detectedOptions, timeout, _menuOpen } =
            ctx;
        const runOptions = { timeout };

        const checkboxOptions = detectedOptions.filter(
            (o) => o.type === 'checkbox' || o.type === 'aria_checkbox',
        );

        const selections = selectedOptions.filter((s) => {
            const action = this.normalizeAction(s.action);
            return action === 'CHECK' || action === 'UNCHECK';
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
            const action = this.normalizeAction(sel.action);
            const option = this.findOption(checkboxOptions, sel);

            if (!option) {
                evidence.push({
                    label: sel.label,
                    value: sel.value,
                    type: 'checkbox',
                    before: 'Unknown',
                    action,
                    after: null,
                    result: 'FAIL',
                    message: `Option "${sel.label || sel.value}" not found in detected checkboxes`,
                });
                continue;
            }

            if (option.enabled === false) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: option.checked ? 'Checked' : 'Unchecked',
                    action,
                    after: option.checked ? 'Checked' : 'Unchecked',
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
                    before: option.checked ? 'Checked' : 'Unchecked',
                    action,
                    after: option.checked ? 'Checked' : 'Unchecked',
                    result: 'FAIL',
                    message: 'Option is hidden and cannot be interacted with.',
                });
                continue;
            }

            const before = option.checked;

            if (
                (action === 'CHECK' && before === true) ||
                (action === 'UNCHECK' && before === false)
            ) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: before ? 'Checked' : 'Unchecked',
                    action,
                    after: before ? 'Checked' : 'Unchecked',
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
                    before: before ? 'Checked' : 'Unchecked',
                    action,
                    after: null,
                    result: 'FAIL',
                    message: 'Could not resolve locator for option',
                });
                throw new Error(`Could not resolve locator for option "${option.label}"`);
            }

            try {
                if (action === 'CHECK') {
                    await target.check(runOptions);
                } else {
                    await target.uncheck(runOptions).catch(async () => {
                        await target.click(runOptions);
                    });
                }

                // Add to applied immediately (matching old behavior)
                applied.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    action,
                    selected: action === 'CHECK',
                });
                actionCount++;

                await this.safeWait(page);

                const after = await this.readState(target, option);
                const targetState = action === 'CHECK';
                const pass = after === targetState;

                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: before ? 'Checked' : 'Unchecked',
                    action,
                    after: after === null ? 'Unknown' : after ? 'Checked' : 'Unchecked',
                    result: pass ? 'PASS' : 'FAIL',
                    message: pass
                        ? null
                        : `Expected ${targetState ? 'Checked' : 'Unchecked'} but found ${after === null ? 'Unknown' : after ? 'Checked' : 'Unchecked'}`,
                });
            } catch (err) {
                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: before ? 'Checked' : 'Unchecked',
                    action,
                    after: null,
                    result: 'FAIL',
                    message: err.message,
                });
                throw new Error(
                    `Failed to ${action.toLowerCase()} checkbox "${option.label}": ${err.message}`,
                );
            }
        }

        return { applied, evidence, actionCount, optionCount: detectedOptions.length };
    }
}

registerStrategy('checkbox-group', CheckboxGroupStrategy);
export default CheckboxGroupStrategy;
