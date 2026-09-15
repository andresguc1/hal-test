import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';
import { playTimeout } from '../../../../core/timeout-utils.js';

/**
 * AttributeStrategy
 *
 * Verifies an attribute value of a target element.
 *
 * Operators:
 *  - equals          (default) — attribute value === expected
 *  - not_equals      — attribute value !== expected
 *  - contains        — attribute value includes expected
 *  - not_contains    — attribute value does not include expected
 *  - empty           — attribute is absent or empty string
 *  - not_empty       — attribute exists and is not empty
 *  - regex           — expected matches as RegExp against attribute value
 *  - not_regex       — expected does not match
 *
 * Options: attribute (required), caseSensitive, regex, regexFlags.
 */
export class AttributeStrategy extends BaseAssertionStrategy {
    get type() {
        return 'attribute';
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

    async execute(_page, locator, assertion, { timeout = 0 } = {}) {
        const operator = assertion.operator || 'equals';
        const attributeName = assertion.attribute;
        const expected = this.resolveExpected(assertion);
        const caseSensitive = assertion.caseSensitive === true;
        const useRegex =
            assertion.regex === true || operator === 'regex' || operator === 'not_regex';
        const flags = assertion.regexFlags || '';

        if (!attributeName) {
            return {
                passed: false,
                actual: null,
                expected: expected ?? operator,
                message:
                    'Attribute name is required for attribute assertions (use "attribute" field).',
            };
        }

        try {
            await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });
        } catch (err) {
            return {
                passed: false,
                actual: 'absent',
                expected,
                message: 'Element was not found, so its attribute could not be read.',
            };
        }

        const actualValue = (await locator.getAttribute(attributeName).catch(() => null)) ?? '';

        if (operator === 'empty' || operator === 'not_empty') {
            const isEmpty = actualValue === '' || actualValue === null;
            const passed = operator === 'empty' ? isEmpty : !isEmpty;
            return {
                passed,
                actual: actualValue === '' ? '(empty)' : actualValue,
                expected: operator === 'empty' ? '(empty)' : '(non-empty)',
                message: passed
                    ? undefined
                    : operator === 'empty'
                      ? `Expected attribute "${attributeName}" to be empty but found "${actualValue}".`
                      : `Expected attribute "${attributeName}" to be present but it was empty or missing.`,
            };
        }

        if (useRegex) {
            let regex;
            try {
                const sanitizedFlags = (flags || '').replace(/[^gimusdy]/g, '');
                regex = new RegExp(expected, caseSensitive ? sanitizedFlags : `${sanitizedFlags}i`);
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
                      ? `Expected attribute "${attributeName}" NOT to match /${expected}/${flags} but it did.`
                      : `Expected attribute "${attributeName}" to match /${expected}/${flags} but it did not.`,
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
                    message: `Unsupported operator "${operator}" for attribute assertions.`,
                };
        }

        return {
            passed,
            actual: actualValue,
            expected: expected,
            message: passed
                ? undefined
                : `Expected attribute "${attributeName}" ${this.describeOperator(operator)} "${expected}" but found "${this.truncate(actualValue)}".`,
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

registerAssertionStrategy(AttributeStrategy);
export default AttributeStrategy;
