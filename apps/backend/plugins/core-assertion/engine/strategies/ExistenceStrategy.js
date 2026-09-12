import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';
import { playTimeout } from '../../../../core/timeout-utils.js';

/**
 * ExistenceStrategy
 *
 * Verifies whether a target element exists (is attached) in the page.
 *
 * Operators:
 *  - exists       (default) — element must be present
 *  - not_exists            — element must be absent
 *
 * The `exists` operator waits up to the timeout for the element to be
 * attached, giving auto-healing behaviour for slow-rendering content.
 */
export class ExistenceStrategy extends BaseAssertionStrategy {
    get type() {
        return 'existence';
    }

    get operators() {
        return ['exists', 'not_exists'];
    }

    async execute(_page, locator, assertion, { timeout = 0 } = {}) {
        const operator = assertion.operator || 'exists';

        if (operator === 'not_exists') {
            const count = await locator.count();
            const isAbsent = count === 0;
            return {
                passed: isAbsent,
                actual: isAbsent ? 'absent' : 'present',
                expected: 'absent',
                message: isAbsent
                    ? undefined
                    : `Expected element to be absent but found ${count} match(es).`,
            };
        }

        try {
            await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });
            return {
                passed: true,
                actual: 'present',
                expected: 'present',
            };
        } catch (err) {
            const count = await locator.count();
            return {
                passed: false,
                actual: count > 0 ? 'present' : 'absent',
                expected: 'present',
                message: count > 0 ? 'Element was not attached.' : 'Element was not found.',
            };
        }
    }
}

registerAssertionStrategy(ExistenceStrategy);
export default ExistenceStrategy;
