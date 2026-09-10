import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';

/**
 * TextStrategy
 *
 * Verifies the visible text content of a target element.
 * Uses `innerText()` so only user-visible text is evaluated.
 *
 * Operators:
 *  - equals          — normalized text === expected
 *  - not_equals      — normalized text !== expected
 *  - contains        (default) — normalized text includes expected
 *  - not_contains    — normalized text does not include expected
 *  - empty           — trimmed text is empty
 *  - not_empty       — trimmed text is not empty
 *  - regex           — expected matches against the text as a RegExp
 *  - not_regex       — expected does not match the text
 *
 * Options: caseSensitive (default false), regex (force regex evaluation),
 * regexFlags (default '').
 */
export class TextStrategy extends BaseAssertionStrategy {
    get type() {
        return 'text';
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
        const operator = assertion.operator || 'contains';
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
                expected:
                    operator === 'empty' || operator === 'not_empty'
                        ? this.labelFor(operator)
                        : expected,
                message: `Element was not found within ${timeout}ms, so its text could not be read.`,
            };
        }

        const text = (await locator.innerText().catch(() => '')) || '';

        let passed;
        let actualText;
        let expectedText;
        let detail;

        if (operator === 'empty' || operator === 'not_empty') {
            const isEmpty = text.trim() === '';
            passed = operator === 'empty' ? isEmpty : !isEmpty;
            actualText = isEmpty ? '(empty)' : text;
            expectedText = operator === 'empty' ? '(empty)' : '(non-empty)';
            if (!passed) {
                detail =
                    operator === 'empty'
                        ? 'Expected the element text to be empty but it had content.'
                        : 'Expected the element text to be non-empty but it was empty.';
            }
        } else if (useRegex) {
            let regex;
            try {
                regex = new RegExp(expected, caseSensitive ? flags : `${flags}i`);
            } catch (err) {
                return {
                    passed: false,
                    actual: text,
                    expected,
                    message: `Invalid regular expression "${expected}": ${err.message}`,
                };
            }
            const found = regex.test(text);
            passed = operator === 'not_regex' ? !found : found;
            actualText = text;
            expectedText =
                operator === 'not_regex' ? `(not matching) ${expected}` : `(matching) ${expected}`;
            if (!passed && operator === 'not_regex') {
                detail = `Expected text NOT to match /${expected}/${flags} but it did.`;
            } else if (!passed) {
                detail = `Expected text to match /${expected}/${flags} but it did not.`;
            }
        } else {
            const haystack = caseSensitive ? text : text.toLowerCase();
            const needle = caseSensitive
                ? String(expected ?? '')
                : String(expected ?? '').toLowerCase();

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
                        actual: text,
                        expected,
                        message: `Unsupported operator "${operator}" for text assertions.`,
                    };
            }
            actualText = text;
            expectedText = expected;
            if (!passed) {
                detail = `Expected text ${this.describeOperator(operator)} "${expected}" but found "${this.truncate(text)}".`;
            }
        }

        return {
            passed,
            actual: actualText,
            expected: expectedText,
            message: detail,
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

    labelFor(operator) {
        return operator === 'empty' ? '(empty)' : '(non-empty)';
    }

    truncate(text, max = 120) {
        if (text.length <= max) return text;
        return `${text.slice(0, max)}…`;
    }
}

registerAssertionStrategy(TextStrategy);
export default TextStrategy;
