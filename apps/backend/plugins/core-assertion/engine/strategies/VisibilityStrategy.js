import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';
import { playTimeout } from '../../../../core/timeout-utils.js';

/**
 * VisibilityStrategy
 *
 * Verifies whether a target element is visible or hidden.
 *
 * Operators:
 *  - visible (default) — element must be visible
 *  - hidden            — element must be hidden
 *
 * Follows Playwright's `toBeHidden()` semantics: an element passes a
 * "hidden" assertion when it is either not attached or not visible.
 */
export class VisibilityStrategy extends BaseAssertionStrategy {
    get type() {
        return 'visibility';
    }

    get operators() {
        return ['visible', 'hidden'];
    }

    async execute(_page, locator, assertion, { timeout = 0 } = {}) {
        const operator = assertion.operator || 'visible';

        if (operator === 'visible') {
            try {
                await locator.waitFor({ state: 'visible', ...playTimeout(timeout) });
                return {
                    passed: true,
                    actual: 'visible',
                    expected: 'visible',
                };
            } catch (err) {
                const count = await locator.count();
                const visible = count > 0 ? await locator.isVisible().catch(() => false) : false;
                return {
                    passed: false,
                    actual: count === 0 ? 'absent' : visible ? 'visible' : 'hidden',
                    expected: 'visible',
                    message: count === 0 ? 'Element was not found.' : 'Element is not visible.',
                };
            }
        }

        const count = await locator.count();
        const visible = count > 0 ? await locator.isVisible().catch(() => false) : false;
        const passed = count === 0 || !visible;
        return {
            passed,
            actual: count === 0 ? 'absent' : visible ? 'visible' : 'hidden',
            expected: 'hidden',
            message: passed ? undefined : 'Element is visible but expected to be hidden.',
        };
    }
}

registerAssertionStrategy(VisibilityStrategy);
export default VisibilityStrategy;
