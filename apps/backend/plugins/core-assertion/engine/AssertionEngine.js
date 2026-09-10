/**
 * AssertionEngine
 *
 * Central dispatcher for DOM assertion strategies.
 *
 * The engine resolves each assertion configuration to a registered strategy
 * and evaluates it against a resolved Playwright locator. Hard failures are
 * surfaced as rejection-friendly structured results so callers can decide
 * whether to throw (hard fail) or continue (soft fail).
 *
 * Strategies are registered on import via AssertionBaseStrategy, so merely
 * importing this module guarantees the default strategy set is available.
 */

import {
    getAssertionStrategy,
    getRegisteredAssertionTypes,
    hasAssertionStrategy,
} from './AssertionBaseStrategy.js';

import './strategies/ExistenceStrategy.js';
import './strategies/VisibilityStrategy.js';
import './strategies/TextStrategy.js';
import './strategies/CountStrategy.js';
import './strategies/AttributeStrategy.js';
import './strategies/ValueStrategy.js';
import './strategies/StateStrategy.js';
import './strategies/CSSPropertyStrategy.js';
import './strategies/PageStrategy.js';

export class AssertionEngine {
    /**
     * Evaluates a list of assertions against a locator.
     *
     * @param {Object} params
     * @param {import('playwright').Page} params.page
     * @param {import('playwright').Locator} params.locator
     * @param {Array<Object>} params.assertions - [{ type, operator, expected, … }]
     * @param {{ timeout?: number }} [params.options]
     * @returns {Promise<Array<Object>>} Structured results per assertion
     */
    async evaluate({ page, locator, assertions = [], options = {} }) {
        const results = [];
        for (const assertion of assertions) {
            const type = assertion.type || assertion.assertType;

            if (!type) {
                results.push({
                    type: 'unknown',
                    operator: assertion.operator,
                    passed: false,
                    actual: null,
                    expected: assertion.expected ?? null,
                    skipped: true,
                    message:
                        'Assertion is missing a "type" (e.g. existence, visibility, text, count).',
                });
                continue;
            }

            const strategy = getAssertionStrategy(type);
            if (!strategy) {
                results.push({
                    type,
                    operator: assertion.operator,
                    passed: false,
                    actual: null,
                    expected: assertion.expected ?? null,
                    skipped: true,
                    message: `No assertion strategy registered for type "${type}".`,
                });
                continue;
            }

            try {
                const result = await strategy.execute(page, locator, assertion, {
                    timeout: options.timeout,
                });
                results.push({
                    type,
                    operator: assertion.operator,
                    passed: result.passed,
                    actual: result.actual,
                    expected: result.expected,
                    message: result.message,
                });
            } catch (err) {
                results.push({
                    type,
                    operator: assertion.operator,
                    passed: false,
                    actual: null,
                    expected: assertion.expected ?? null,
                    message: err.message,
                });
            }
        }
        return results;
    }

    /**
     * Checks whether a strategy type is registered.
     * @param {string} type
     * @returns {boolean}
     */
    hasStrategy(type) {
        return hasAssertionStrategy(type);
    }

    /**
     * Lists all registered strategy type keys.
     * @returns {string[]}
     */
    get availableTypes() {
        return getRegisteredAssertionTypes();
    }
}

export const assertionEngine = new AssertionEngine();
export default assertionEngine;
