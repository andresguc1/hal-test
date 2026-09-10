/**
 * AssertionBaseStrategy
 *
 * Base interface and shared registry for assertion strategies.
 * Each strategy knows how to verify a specific aspect of the DOM
 * (existence, visibility, text content, element count, …) and reports
 * a structured { passed, actual, expected, message } result.
 */

/**
 * @typedef {Object} AssertionConfig
 * @property {string} type - Strategy type (e.g. 'existence', 'visibility')
 * @property {string} operator - Operator within the strategy (e.g. 'contains')
 * @property {*} [expected] - Expected value to compare against
 * @property {boolean} [caseSensitive] - Case-sensitive string comparison
 * @property {boolean} [regex] - Treat expected as a regular expression
 * @property {string} [regexFlags] - Flags for regex evaluation
 */

/**
 * @typedef {Object} AssertionResult
 * @property {boolean} passed - Whether the assertion passed
 * @property {*} actual - Observed value
 * @property {*} expected - Expected value
 * @property {string} [message] - Human readable failure explanation
 */

const strategyRegistry = new Map();

/**
 * Base class for all assertion strategies.
 */
export class BaseAssertionStrategy {
    constructor() {
        if (this.constructor === BaseAssertionStrategy) {
            throw new Error('BaseAssertionStrategy is abstract and cannot be instantiated.');
        }
    }

    /**
     * Strategy type key(s) used to dispatch assertions.
     * Can be a string or an array of aliases.
     * @returns {string|string[]}
     */
    get type() {
        throw new Error('type getter must be implemented by subclass');
    }

    /**
     * List of supported operators for this strategy.
     * @returns {string[]}
     */
    get operators() {
        return [];
    }

    /**
     * Executes the assertion against a resolved Playwright locator.
     *
     * @param {import('playwright').Page} page
     * @param {import('playwright').Locator} locator
     * @param {AssertionConfig} assertion
     * @param {{ timeout?: number }} options
     * @returns {Promise<AssertionResult>}
     */
    async execute(_page, _locator, _assertion, _options) {
        throw new Error('execute() must be implemented by subclass');
    }

    /**
     * Resolves the expected value, honouring both `expected` and legacy `value`.
     * @param {AssertionConfig} assertion
     * @returns {*}
     */
    resolveExpected(assertion) {
        return assertion.expected ?? assertion.value ?? null;
    }
}

/**
 * Registers a strategy class under its type key(s).
 * @param {typeof BaseAssertionStrategy} StrategyClass
 */
export function registerAssertionStrategy(StrategyClass) {
    if (!(StrategyClass.prototype instanceof BaseAssertionStrategy)) {
        throw new Error(
            'registerAssertionStrategy() requires a class extending BaseAssertionStrategy',
        );
    }
    const instance = new StrategyClass();
    const types = Array.isArray(instance.type) ? instance.type : [instance.type];
    for (const type of types) {
        strategyRegistry.set(type, instance);
    }
}

/**
 * Gets a strategy instance for a type key.
 * @param {string} type
 * @returns {BaseAssertionStrategy|null}
 */
export function getAssertionStrategy(type) {
    return strategyRegistry.get(type) || null;
}

/**
 * Lists all registered strategy type keys.
 * @returns {string[]}
 */
export function getRegisteredAssertionTypes() {
    return Array.from(strategyRegistry.keys());
}

/**
 * Checks whether a strategy type is registered.
 * @param {string} type
 * @returns {boolean}
 */
export function hasAssertionStrategy(type) {
    return strategyRegistry.has(type);
}

export default {
    registerAssertionStrategy,
    getAssertionStrategy,
    getRegisteredAssertionTypes,
    hasAssertionStrategy,
    BaseAssertionStrategy,
};
