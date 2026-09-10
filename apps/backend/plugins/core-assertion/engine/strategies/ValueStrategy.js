import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';

/**
 * ValueStrategy
 *
 * Verifies the `value` property of a form element (input, select, textarea).
 *
 * Operators:
 *  - equals          (default) — value === expected
 *  - not_equals      — value !== expected
 *  - contains        — value includes expected
 *  - not_contains    — value does not include expected
 *  - empty           — value is empty string
 *  - not_empty       — value is not empty
 *  - regex           — expected matches as RegExp against value
 *  - not_regex       — expected does not match
 *
 * Options: caseSensitive, regex, regexFlags.
 */
export class ValueStrategy extends BaseAssertionStrategy {
    get type() {
        return 'value';
    }

    get operators() {
        return [
            'equals',
            'not_equals',
            'contains',
            'not_contains',
            'empty',
            'not_empty',
            'regex',
            'not_regex',
        ];
    }

    async execute(_page, locator, assertion, { timeout = 5000 } = {}) {
        const operator = assertion.operator || 'equals';
        const expected = this.resolveExpected(assertion);
        const caseSensitive = assertion.caseSensitive === true;
        const useRegex =
            assertion.regex === true || operator === 'regex' || operator === 'not_regex';
        const flags = assertion.regexFlags || '';

        try {
            await locator.waitFor({ state: 'attached', timeout });
        } catch (err) {
            return {
                passed: false,
                actual: 'absent',
                expected,
                message: `Element was not found within ${timeout}ms, so its value could not be read.`,
            };
        }

        const actualValue = (await locator.inputValue().catch(() => '')) || '';

        if (operator === 'empty' || operator === 'not_empty') {
            const isEmpty = actualValue === '';
            const passed = operator === 'empty' ? isEmpty : !isEmpty;
            return {
                passed,
                actual: isEmpty ? '(empty)' : actualValue,
                expected: operator === 'empty' ? '(empty)' : '(non-empty)',
                message: passed
                    ? undefined
                    : operator === 'empty'
                      ? `Expected element value to be empty but found "${actualValue}".`
                      : `Expected element value to be non-empty but it was empty.`,
            };
        }

        if (useRegex) {
            let regex;
            try {
                regex = new RegExp(expected, caseSensitive ? flags : `${flags}i`);
            } catch (err) {
                return {
                    passed: false,
                    actual: actualValue,
                    expected,
                    message: `Invalid regular expression "${expected}": ${err.message}`,
                };
            }
            const found = regex.test(actualValue);
            const passed = operator === 'not_regex' ? !found : found;
            return {
                passed,
                actual: actualValue,
                expected:
                    operator === 'not_regex'
                        ? `(not matching) ${expected}`
                        : `(matching) ${expected}`,
                message: passed
                    ? undefined
                    : operator === 'not_regex'
                      ? `Expected element value NOT to match /${expected}/${flags} but it did.`
                      : `Expected element value to match /${expected}/${flags} but it did not.`,
            };
        }

        const haystack = caseSensitive ? actualValue : actualValue.toLowerCase();
        const needle = caseSensitive
            ? String(expected ?? '')
            : String(expected ?? '').toLowerCase();

        let passed;
        switch (operator) {
            case 'equals':
                passed = haystack === needle;
                break;
            case 'not_equals':
                passed = haystack !== needle;
                break;
            case 'contains':
                passed = haystack.includes(needle);
                break;
            case 'not_contains':
                passed = !haystack.includes(needle);
                break;
            default:
                return {
                    passed: false,
                    actual: actualValue,
                    expected,
                    message: `Unsupported operator "${operator}" for value assertions.`,
                };
        }

        return {
            passed,
            actual: actualValue,
            expected,
            message: passed
                ? undefined
                : `Expected element value ${this.describeOperator(operator)} "${expected}" but found "${this.truncate(actualValue)}".`,
        };
    }

    describeOperator(operator) {
        switch (operator) {
            case 'equals':
                return 'to equal';
            case 'not_equals':
                return 'not to equal';
            case 'contains':
                return 'to contain';
            case 'not_contains':
                return 'not to contain';
            default:
                return 'to match';
        }
    }

    truncate(text, max = 120) {
        if (text.length <= max) return text;
        return `${text.slice(0, max)}…`;
    }
}

registerAssertionStrategy(ValueStrategy);
export default ValueStrategy;
