/* global document */
import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';
import { playTimeout } from '../../../../core/timeout-utils.js';

/**
 * StateStrategy
 *
 * Verifies the interactive state of an element.
 *
 * Operators:
 *  - enabled         (default) — element is enabled (not disabled)
 *  - disabled        — element is disabled
 *  - checked         — checkbox/radio is checked
 *  - unchecked       — checkbox/radio is not checked
 *  - selected        — option is selected
 *  - not_selected    — option is not selected
 *  - focused         — element has focus
 *  - not_focused     — element does not have focus
 *  - readonly        — element is readonly
 *  - not_readonly    — element is not readonly
 *  - required        — element has required attribute
 *  - not_required    — element does not have required attribute
 *
 * Uses Playwright's isEnabled(), isChecked(), isVisible(), etc. with proper
 * fallback for elements that don't support the state.
 */
export class StateStrategy extends BaseAssertionStrategy {
    get type() {
        return 'state';
    }

    get operators() {
        return [
            'enabled',
            'disabled',
            'checked',
            'unchecked',
            'selected',
            'not_selected',
            'focused',
            'not_focused',
            'readonly',
            'not_readonly',
            'required',
            'not_required',
        ];
    }

    async execute(_page, locator, assertion, { timeout = 0 } = {}) {
        const operator = assertion.operator || 'enabled';

        try {
            await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });
        } catch (err) {
            return {
                passed: false,
                actual: 'absent',
                expected: operator,
                message: 'Element was not found, so its state could not be evaluated.',
            };
        }

        const count = await locator.count();
        if (count === 0) {
            return {
                passed: false,
                actual: 'absent',
                expected: operator,
                message: `Element not found (count: 0).`,
            };
        }

        let passed;
        let actual;
        let expected;
        let message;

        try {
            switch (operator) {
                case 'enabled': {
                    actual = await locator.isEnabled();
                    passed = actual === true;
                    expected = 'enabled';
                    message = !passed
                        ? 'Element is disabled or not an interactive element.'
                        : undefined;
                    break;
                }
                case 'disabled': {
                    actual = await locator.isEnabled();
                    passed = actual === false;
                    expected = 'disabled';
                    message = !passed ? 'Element is enabled.' : undefined;
                    break;
                }
                case 'checked': {
                    actual = await locator.isChecked();
                    passed = actual === true;
                    expected = 'checked';
                    message = !passed
                        ? 'Element is not checked (or not a checkbox/radio).'
                        : undefined;
                    break;
                }
                case 'unchecked': {
                    actual = await locator.isChecked();
                    passed = actual === false;
                    expected = 'unchecked';
                    message = !passed ? 'Element is checked.' : undefined;
                    break;
                }
                case 'selected': {
                    actual = await locator.evaluate((el) => el.selected ?? false);
                    passed = actual === true;
                    expected = 'selected';
                    message = !passed
                        ? 'Option is not selected (or not an option element).'
                        : undefined;
                    break;
                }
                case 'not_selected': {
                    actual = await locator.evaluate((el) => el.selected ?? false);
                    passed = actual === false;
                    expected = 'not selected';
                    message = !passed ? 'Option is selected.' : undefined;
                    break;
                }
                case 'focused': {
                    actual = await locator.evaluate((el) => el === document.activeElement);
                    passed = actual === true;
                    expected = 'focused';
                    message = !passed ? 'Element does not have focus.' : undefined;
                    break;
                }
                case 'not_focused': {
                    actual = await locator.evaluate((el) => el === document.activeElement);
                    passed = actual === false;
                    expected = 'not focused';
                    message = !passed ? 'Element has focus.' : undefined;
                    break;
                }
                case 'readonly': {
                    actual = await locator.evaluate((el) => el.readOnly === true);
                    passed = actual === true;
                    expected = 'readonly';
                    message = !passed ? 'Element is not readonly.' : undefined;
                    break;
                }
                case 'not_readonly': {
                    actual = await locator.evaluate((el) => el.readOnly === true);
                    passed = actual === false;
                    expected = 'not readonly';
                    message = !passed ? 'Element is readonly.' : undefined;
                    break;
                }
                case 'required': {
                    actual = await locator.evaluate((el) => el.required === true);
                    passed = actual === true;
                    expected = 'required';
                    message = !passed ? 'Element does not have required attribute.' : undefined;
                    break;
                }
                case 'not_required': {
                    actual = await locator.evaluate((el) => el.required === true);
                    passed = actual === false;
                    expected = 'not required';
                    message = !passed ? 'Element has required attribute.' : undefined;
                    break;
                }
                default:
                    return {
                        passed: false,
                        actual: null,
                        expected: operator,
                        message: `Unsupported operator "${operator}" for state assertions.`,
                    };
            }
        } catch (err) {
            return {
                passed: false,
                actual: 'error',
                expected: operator,
                message: `Failed to evaluate state: ${err.message}`,
            };
        }

        return {
            passed,
            actual: String(actual),
            expected,
            message,
        };
    }
}

registerAssertionStrategy(StateStrategy);
export default StateStrategy;
