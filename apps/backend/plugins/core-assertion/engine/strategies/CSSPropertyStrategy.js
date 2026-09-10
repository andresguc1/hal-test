/* global window */
import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';

/**
 * CSSPropertyStrategy
 *
 * Verifies a computed CSS property value of an element.
 *
 * Operators:
 *  - equals          (default) — property value === expected
 *  - not_equals      — property value !== expected
 *  - contains        — property value includes expected (substring)
 *  - not_contains    — property value does not include expected
 *  - regex           — expected matches as RegExp against property value
 *  - not_regex       — expected does not match
 *
 * Options: cssProperty (required), caseSensitive, regex, regexFlags.
 * The property is resolved via window.getComputedStyle().
 */
export class CSSPropertyStrategy extends BaseAssertionStrategy {
    get type() {
        return 'css_property';
    }

    get operators() {
        return ['equals', 'not_equals', 'contains', 'not_contains', 'regex', 'not_regex'];
    }

    async execute(_page, locator, assertion, { timeout = 5000 } = {}) {
        const operator = assertion.operator || 'equals';
        const propertyName = assertion.cssProperty || assertion.property;
        const expected = this.resolveExpected(assertion);
        const caseSensitive = assertion.caseSensitive === true;
        const useRegex =
            assertion.regex === true || operator === 'regex' || operator === 'not_regex';
        const flags = assertion.regexFlags || '';

        if (!propertyName) {
            return {
                passed: false,
                actual: null,
                expected: expected ?? operator,
                message:
                    'CSS property name is required (use "cssProperty" field, e.g. "display", "color", "font-size").',
            };
        }

        try {
            await locator.waitFor({ state: 'attached', timeout });
        } catch (err) {
            return {
                passed: false,
                actual: 'absent',
                expected,
                message: `Element was not found within ${timeout}ms, so its CSS property could not be read.`,
            };
        }

        const actualValue = await locator
            .evaluate((el, prop) => {
                const style = window.getComputedStyle(el);
                return style.getPropertyValue(prop);
            }, propertyName)
            .catch(() => '');

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
                      ? `Expected CSS property "${propertyName}" NOT to match /${expected}/${flags} but it did.`
                      : `Expected CSS property "${propertyName}" to match /${expected}/${flags} but it did not.`,
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
                    message: `Unsupported operator "${operator}" for CSS property assertions.`,
                };
        }

        return {
            passed,
            actual: actualValue,
            expected,
            message: passed
                ? undefined
                : `Expected CSS property "${propertyName}" ${this.describeOperator(operator)} "${expected}" but found "${this.truncate(actualValue)}".`,
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

registerAssertionStrategy(CSSPropertyStrategy);
export default CSSPropertyStrategy;
