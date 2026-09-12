import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';
import { playTimeout } from '../../../../core/timeout-utils.js';

/**
 * CountStrategy
 *
 * Verifies the number of elements matched by a locator
 * (collection scope).
 *
 * Operators:
 *  - equals           (default) — count === expected
 *  - not_equals       — count !== expected
 *  - greater_than     — count > expected
 *  - less_than        — count < expected
 *  - greater_or_equal — count >= expected
 *  - less_or_equal    — count <= expected
 *  - between          — count >= min && count <= max
 *
 * When the operator implies a positive match count (e.g. equals 3) and the
 * collection is empty, the strategy waits up to the timeout for at least one
 * element to appear before re-counting, giving auto-healing behaviour.
 */
export class CountStrategy extends BaseAssertionStrategy {
    get type() {
        return 'count';
    }

    get operators() {
        return [
            'equals',
            'not_equals',
            'greater_than',
            'less_than',
            'greater_or_equal',
            'less_or_equal',
            'between',
        ];
    }

    async execute(_page, locator, assertion, { timeout = 0 } = {}) {
        const operator = assertion.operator || 'equals';
        const expected = Number(assertion.expected);
        const min = assertion.min !== undefined ? Number(assertion.min) : expected;
        const max = assertion.max !== undefined ? Number(assertion.max) : expected;

        const zeroFriendly =
            (operator === 'equals' && expected === 0) ||
            operator === 'less_than' ||
            operator === 'less_or_equal' ||
            ('between' === operator && !(max > 0));

        let count = await locator.count();
        if (count === 0 && !zeroFriendly) {
            try {
                await locator.first().waitFor({ state: 'attached', ...playTimeout(timeout) });
                count = await locator.count();
            } catch (err) {
                // Element collection never appeared; evaluate the operator with count 0.
            }
        }

        let passed;
        let expectedText;

        switch (operator) {
            case 'equals':
                passed = count === expected;
                expectedText = String(expected);
                break;
            case 'not_equals':
                passed = count !== expected;
                expectedText = `(not) ${expected}`;
                break;
            case 'greater_than':
                passed = count > expected;
                expectedText = `> ${expected}`;
                break;
            case 'less_than':
                passed = count < expected;
                expectedText = `< ${expected}`;
                break;
            case 'greater_or_equal':
                passed = count >= expected;
                expectedText = `>= ${expected}`;
                break;
            case 'less_or_equal':
                passed = count <= expected;
                expectedText = `<= ${expected}`;
                break;
            case 'between':
                passed = count >= min && count <= max;
                expectedText = `between ${min} and ${max}`;
                break;
            default:
                return {
                    passed: false,
                    actual: count,
                    expected: expectedText ?? expected,
                    message: `Unsupported operator "${operator}" for count assertions.`,
                };
        }

        return {
            passed,
            actual: count,
            expected: expectedText,
            message: passed
                ? undefined
                : `Expected element count ${expectedText} but found ${count}.`,
        };
    }
}

registerAssertionStrategy(CountStrategy);
export default CountStrategy;
