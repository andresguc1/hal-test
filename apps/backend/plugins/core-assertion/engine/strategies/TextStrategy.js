import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';
import { playTimeout } from '../../../../core/timeout-utils.js';

/**
 * TextStrategy
 *
 * Verifies the visible text content of a target element.
 * Uses `innerText()` so only user-visible text is evaluated.
 *
 * Operators:
 *  - equals          (default) — Cypress `contains` semantics: expected text
 *                    exists in the visible text, as a part or the complete text
 *  - not_equals      — expected text does not exist in the visible text
 *  - contains        — same as equals (substring match)
 *  - not_contains    — same as not_equals (no substring match)
 *  - starts_with     — normalized text starts with expected
 *  - ends_with       — normalized text ends with expected
 *  - empty           — normalized text is empty
 *  - not_empty       — normalized text is not empty
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
            'starts_with',
            'ends_with',
            'empty',
            'not_empty',
            'regex',
            'not_regex',
        ];
    }

    /**
     * Normalizes text the same way Playwright's web-first matchers do:
     * every run of whitespace (spaces, tabs, newlines, line separators) is
     * collapsed into a single space and the result is trimmed on both ends.
     * This makes Equals/Contains comparisons insensitive to formatting and
     * line breaks while keeping them distinct operators.
     * @param {*} value
     * @returns {string}
     */
    static normalizeText(value) {
        return String(value ?? '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    async execute(_page, locator, assertion, { timeout = 0 } = {}) {
        const operator = assertion.operator || 'contains';
        const expected = this.resolveExpected(assertion);
        const caseSensitive = assertion.caseSensitive === true;
        const useRegex =
            assertion.regex === true || operator === 'regex' || operator === 'not_regex';
        const sanitizedFlags = (flags) => (flags || '').replace(/[^gimusdy]/g, '');
        const regexFlags = sanitizedFlags(assertion.regexFlags);

        const diagnostics = {
            operator,
            type: this.type,
            caseSensitive,
            ...(useRegex ? { regex: true, regexFlags: assertion.regexFlags || '' } : {}),
        };

        try {
            await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });
        } catch (err) {
            return {
                passed: false,
                actual: 'absent',
                expected:
                    operator === 'empty' || operator === 'not_empty'
                        ? this.labelFor(operator)
                        : expected,
                message: 'Element was not found, so its text could not be read.',
                ...diagnostics,
            };
        }

        // Web-first semantics: keep re-reading the element's visible text until
        // the assertion passes or the retry window elapses. A bounded 500 ms
        // window is used when no timeout is configured so dynamic content has a
        // chance to settle without slowing down fast-fail assertions.
        const retryWindow = timeout > 0 ? timeout : 500;
        const deadline = Date.now() + retryWindow;
        const poll = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        const readText = async () => (await locator.innerText().catch(() => '')) || '';
        const evaluate = (text) =>
            this.evaluate(text, {
                operator,
                expected,
                caseSensitive,
                useRegex,
                regexFlags,
            });

        let text = await readText();
        let verdict = evaluate(text);
        while (!verdict.passed && Date.now() <= deadline) {
            await poll(100);
            text = await readText();
            verdict = evaluate(text);
        }

        return { actual: text, ...verdict, ...diagnostics };
    }

    /**
     * Evaluates one snapshot of visible text against the configured operator.
     * Returns the { passed, actual, expected, message } shape used by the
     * assertion engine, enriched with diagnostics by `execute`.
     */
    evaluate(text, { operator, expected, caseSensitive, useRegex, regexFlags }) {
        if (operator === 'empty' || operator === 'not_empty') {
            const isEmpty = TextStrategy.normalizeText(text) === '';
            const passed = operator === 'empty' ? isEmpty : !isEmpty;
            return {
                passed,
                expected: operator === 'empty' ? '(empty)' : '(non-empty)',
                message: !passed
                    ? operator === 'empty'
                        ? 'Expected the element text to be empty but it had content.'
                        : 'Expected the element text to be non-empty but it was empty.'
                    : undefined,
            };
        }

        if (useRegex) {
            let regex;
            try {
                const flags = caseSensitive ? regexFlags : `${regexFlags}i`;
                regex = new RegExp(expected, flags);
            } catch (sanitizeError) {
                return {
                    passed: false,
                    expected,
                    message: `Invalid regular expression "${expected}": ${sanitizeError.message}`,
                };
            }
            const found = regex.test(text);
            const passed = operator === 'not_regex' ? !found : found;
            return {
                passed,
                expected:
                    operator === 'not_regex'
                        ? `(not matching) ${expected}`
                        : `(matching) ${expected}`,
                message: !passed
                    ? operator === 'not_regex'
                        ? `Expected text NOT to match /${expected}/${regex.flags} but it did.`
                        : `Expected text to match /${expected}/${regex.flags} but it did not.`
                    : undefined,
            };
        }

        const haystack = TextStrategy.normalizeText(text);
        const needle = TextStrategy.normalizeText(expected);
        const ciHaystack = caseSensitive ? haystack : haystack.toLowerCase();
        const ciNeedle = caseSensitive ? needle : needle.toLowerCase();

        let passed;
        switch (operator) {
            case 'equals':
                // Cypress `contains` semantics: the expected text passes when it
                // exists as any part of the visible text (partial or complete).
                // An empty expected value resolves to the empty-text check.
                passed =
                    ciNeedle.length === 0 ? ciHaystack.length === 0 : ciHaystack.includes(ciNeedle);
                break;
            case 'not_equals':
                passed =
                    ciNeedle.length === 0
                        ? ciHaystack.length !== 0
                        : !ciHaystack.includes(ciNeedle);
                break;
            case 'contains':
                passed = ciHaystack.includes(ciNeedle);
                break;
            case 'not_contains':
                passed = !ciHaystack.includes(ciNeedle);
                break;
            case 'starts_with':
                passed = ciHaystack.startsWith(ciNeedle);
                break;
            case 'ends_with':
                passed = ciHaystack.endsWith(ciNeedle);
                break;
            default:
                return {
                    passed: false,
                    expected,
                    message: `Unsupported operator "${operator}" for text assertions.`,
                };
        }

        return {
            passed,
            expected,
            message: !passed
                ? `Expected text ${this.describeOperator(operator)} "${needle}" but found "${this.truncate(haystack)}".`
                : undefined,
        };
    }

    describeOperator(operator) {
        switch (operator) {
            case 'equals':
                return 'to contain';
            case 'not_equals':
                return 'not to contain';
            case 'contains':
                return 'to contain';
            case 'not_contains':
                return 'not to contain';
            case 'starts_with':
                return 'to start with';
            case 'ends_with':
                return 'to end with';
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
