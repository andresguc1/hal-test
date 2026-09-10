import { BaseStrategy, registerStrategy } from '../InteractionStrategy.js';

export class RadioGroupStrategy extends BaseStrategy {
    get supportsMultiSelect() {
        return false;
    }

    validateUncheck(action, option) {
        if (action === 'UNCHECK') {
            throw new Error(
                `UNCHECK is not supported for the radio option "${option.label}". Radio options are mutually exclusive and are cleared by checking another option.`,
            );
        }
    }

    async execute(ctx) {
        const { page, containerSelector, selectedOptions, detectedOptions, timeout } = ctx;
        const runOptions = { timeout };

        const radioOptions = detectedOptions.filter(
            (o) => o.type === 'radio' || o.type === 'aria_radio',
        );

        // Validate ALL actions first - throw if UNCHECK is used on radio
        for (const sel of selectedOptions) {
            if (!sel) continue;
            const action = this.normalizeAction(sel.action);
            if (action === 'UNCHECK') {
                const option = this.findOption(radioOptions, sel);
                if (option) {
                    throw new Error(
                        `UNCHECK is not supported for the radio option "${option.label}". Radio options are mutually exclusive and are cleared by checking another option.`,
                    );
                }
            }
        }

        const selections = selectedOptions.filter(
            (s) => this.normalizeAction(s.action) === 'CHECK',
        );

        if (selections.length === 0) {
            return {
                applied: [],
                evidence: [],
                actionCount: 0,
                optionCount: detectedOptions.length,
            };
        }

        if (selections.length > 1) {
            console.warn(
                '[RadioGroupStrategy] Multiple selections provided for radio group, using first only',
            );
        }

        const sel = selections[0];
        const action = 'CHECK';
        const option = this.findOption(radioOptions, sel);

        const evidence = [];
        const applied = [];
        let actionCount = 0;

        if (!option) {
            evidence.push({
                label: sel.label,
                value: sel.value,
                type: 'radio',
                before: 'Unknown',
                action,
                after: null,
                result: 'FAIL',
                message: `Option "${sel.label || sel.value}" not found in detected radio options`,
            });
            return { applied, evidence, actionCount, optionCount: detectedOptions.length };
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
            return { applied, evidence, actionCount, optionCount: detectedOptions.length };
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
            return { applied, evidence, actionCount, optionCount: detectedOptions.length };
        }

        const target = await this.buildTargetLocator(page, option, containerSelector, {
            timeout,
        });
        if (!target) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: option.checked ? 'Checked' : 'Unchecked',
                action,
                after: null,
                result: 'FAIL',
                message: 'Could not resolve locator for option',
            });
            throw new Error(`Could not resolve locator for option "${option.label}"`);
        }

        // Fail fast with a descriptive error instead of letting check() block for
        // the full timeout on a locator that cannot resolve.
        try {
            await target.waitFor({ state: 'attached', timeout: Math.min(timeout, 5000) });
        } catch {
            const message = `Radio "${option.label}" (locator "${option.locator || ''}") not found in container "${containerSelector}". Verify the container selector or re-detect options.`;
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: option.checked ? 'Checked' : 'Unchecked',
                action,
                after: null,
                result: 'FAIL',
                message,
            });
            throw new Error(message);
        }

        // The detected/persisted `checked` flag is a snapshot from detection time
        // and can be stale at execution time. Read the LIVE state from the DOM so
        // an already-checked radio is only skipped when it ACTUALLY is checked.
        const before = await this.readState(target, option);

        if (before === true) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: 'Checked',
                action,
                after: 'Checked',
                result: 'PASS',
                message: 'Already selected. No interaction performed.',
            });
            return { applied, evidence, actionCount, optionCount: detectedOptions.length };
        }

        try {
            // check() only works on native radio inputs; radios built as ARIA
            // [role=radio] elements must be selected via click. Since the live
            // state was already verified above, a click is the correct action.
            await target.check(runOptions).catch(async () => {
                await target.click(runOptions);
            });

            // Add to applied immediately (matching old behavior)
            applied.push({
                label: option.label,
                value: option.value,
                type: option.type,
                action,
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
                before: before ? 'Checked' : 'Unchecked',
                action,
                after: after ? 'Checked' : 'Unchecked',
                result: pass ? 'PASS' : 'FAIL',
                message: pass
                    ? null
                    : `Expected Checked but found ${after ? 'Checked' : 'Unchecked'}`,
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
            throw new Error(`Failed to select radio option "${option.label}": ${err.message}`);
        }

        return { applied, evidence, actionCount, optionCount: detectedOptions.length };
    }
}

registerStrategy('radio-group', RadioGroupStrategy);
export default RadioGroupStrategy;
