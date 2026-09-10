import { BaseStrategy, registerStrategy } from '../InteractionStrategy.js';
import {
    isNativeSelectElement,
    selectFromCustomDropdown,
    tryCustomDropdownRecovery,
} from './custom-dropdown.js';

export class NativeSelectStrategy extends BaseStrategy {
    get supportsMultiSelect() {
        return false;
    }

    validateUncheck(action, option) {
        if (action === 'UNCHECK') {
            throw new Error(
                `UNCHECK is not supported for the <select> option "${option.label}". Use CHECK to choose a different option.`,
            );
        }
    }

    async execute(ctx) {
        const { page, containerSelector, selectedOptions, detectedOptions, timeout } = ctx;
        const runOptions = { timeout };

        const target = await this.buildTargetLocator(page, detectedOptions[0], containerSelector, {
            timeout,
        });
        if (!target) {
            throw new Error('Could not resolve target <select> element');
        }

        const selectLocator = target.locator('xpath=ancestor::select').first();
        const count = await selectLocator.count();
        const finalLocator = count > 0 ? selectLocator : target;

        // Validate all actions first - throw if UNCHECK is used on select
        for (const sel of selectedOptions) {
            if (!sel) continue;
            const action = this.normalizeAction(sel.action);
            if (action === 'UNCHECK') {
                const option = this.findOption(detectedOptions, sel);
                if (option) {
                    throw new Error(
                        `UNCHECK is not supported for the <select> option "${option.label}". Use CHECK to choose a different option.`,
                    );
                }
            }
        }

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

        // The resolved element may not be a native <select> at all (misclassified
        // custom dropdown, e.g. a div/button-based component). selectOption() only
        // works on native <select>, so fall back to a click-to-open + click-by-label
        // interaction for those elements.
        const isNativeSelect = await isNativeSelectElement(finalLocator);
        if (isNativeSelect === false) {
            return selectFromCustomDropdown(this, {
                page,
                containerSelector,
                selections,
                detectedOptions,
                timeout,
                runOptions,
            });
        }

        const evidence = [];
        const applied = [];
        let actionCount = 0;

        for (const sel of selections) {
            const option = this.findOption(detectedOptions, sel);
            if (!option) {
                evidence.push({
                    label: sel.label,
                    value: sel.value,
                    type: 'native_select',
                    before: 'Unknown',
                    action: 'SELECT',
                    after: null,
                    result: 'FAIL',
                    message: `Option "${sel.label || sel.value}" not found in detected options`,
                });
                continue;
            }

            // Check disabled (matching old behavior)
            // For native selects, DO NOT check visibility - Playwright's selectOption() handles hidden <option> elements internally
            if (option.enabled === false) {
                throw new Error(`Option "${option.label}" is disabled and cannot be selected.`);
            }
            // Native <select> options are hidden by design (display:none when dropdown closed)
            // Playwright's selectOption() handles this internally - DO NOT check visibility

            const before = await this.readState(finalLocator, option);

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

            try {
                await finalLocator
                    .selectOption({ label: String(option.label) }, runOptions)
                    .catch(async () => {
                        await finalLocator.selectOption(
                            { value: String(option.value) },
                            runOptions,
                        );
                    });

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

                const after = await this.readState(finalLocator, option);
                const pass = after === true;

                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: before ? 'Selected' : 'Unselected',
                    action: 'SELECT',
                    after: after ? 'Selected' : 'Unselected',
                    result: pass ? 'PASS' : 'FAIL',
                    message: pass
                        ? null
                        : `Expected Selected but found ${after ? 'Selected' : 'Unselected'}`,
                });
            } catch (err) {
                // selectOption() can still fail even on a native-looking element (element
                // re-rendered, wrapped by a custom component, etc.). Before surfacing the
                // error, try the click-to-open flow once as a last resort.
                const recovered = await tryCustomDropdownRecovery(this, {
                    page,
                    containerSelector,
                    option,
                    timeout,
                    runOptions,
                });
                if (recovered) {
                    applied.push({
                        label: option.label,
                        value: option.value,
                        type: option.type,
                        action: 'SELECT',
                        selected: true,
                    });
                    actionCount++;
                    evidence.push({
                        label: option.label,
                        value: option.value,
                        type: option.type,
                        before: before ? 'Selected' : 'Unselected',
                        action: 'SELECT',
                        after: 'Selected',
                        result: 'PASS',
                        message: 'Recovered via custom dropdown click.',
                    });
                    continue;
                }

                evidence.push({
                    label: option.label,
                    value: option.value,
                    type: option.type,
                    before: before ? 'Selected' : 'Unselected',
                    action: 'SELECT',
                    after: null,
                    result: 'FAIL',
                    message: err.message,
                });
                throw new Error(`Failed to select option "${option.label}": ${err.message}`);
            }
        }

        return { applied, evidence, actionCount, optionCount: detectedOptions.length };
    }
}

registerStrategy('select', NativeSelectStrategy);
export default NativeSelectStrategy;
