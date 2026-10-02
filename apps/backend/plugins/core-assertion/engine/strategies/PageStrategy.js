import { BaseAssertionStrategy, registerAssertionStrategy } from '../AssertionBaseStrategy.js';
import { assertionWindow } from '../../../../core/timeout-utils.js';

/**
 * PageStrategy
 *
 * Verifies page-level properties that don't require a specific element locator.
 * The locator is ignored; the page object is used directly.
 *
 * Operators:
 *  - url_equals        (default) — page.url() === expected
 *  - url_not_equals    — page.url() !== expected
 *  - url_contains      — page.url() includes expected
 *  - url_not_contains  — page.url() does not include expected
 *  - url_regex         — expected matches as RegExp against page URL
 *  - url_not_regex     — expected does not match
 *  - title_equals      — page.title() === expected
 *  - title_not_equals  — page.title() !== expected
 *  - title_contains    — page.title() includes expected
 *  - title_not_contains — page.title() does not include expected
 *  - title_regex       — expected matches as RegExp against page title
 *  - title_not_regex   — expected does not match
 *
 * The scope should be "page" in the target configuration.
 * No element waiting is performed.
 */
export class PageStrategy extends BaseAssertionStrategy {
    get type() {
        return 'page';
    }

    get operators() {
        return [
            'url_equals',
            'url_not_equals',
            'url_contains',
            'url_not_contains',
            'url_regex',
            'url_not_regex',
            'title_equals',
            'title_not_equals',
            'title_contains',
            'title_not_contains',
            'title_regex',
            'title_not_regex',
        ];
    }

    async execute(page, _locator, assertion, { timeout = 0 } = {}) {
        // One evaluation of the assertion against a single snapshot of the
        // page. `permanent` marks the failures that retrying cannot fix, so
        // the poll below returns immediately for those instead of burning the
        // whole window on an operator that will never work.
        const evaluateOnce = async () => {
            const operator = assertion.operator || 'url_contains';
            const expected = this.resolveExpected(assertion);
            const caseSensitive = assertion.caseSensitive === true;
            const useRegex = assertion.regex === true || operator.includes('_regex');
            const flags = assertion.regexFlags || '';

            let actualValue;
            let propertyName;

            if (operator.startsWith('url_')) {
                propertyName = 'url';
                actualValue = page.url();
            } else if (operator.startsWith('title_')) {
                propertyName = 'title';
                try {
                    actualValue = await page.title();
                } catch (err) {
                    return {
                        passed: false,
                        actual: 'error',
                        expected,
                        message: `Failed to get page title: ${err.message}`,
                    };
                }
            } else {
                return {
                    passed: false,
                    actual: null,
                    expected: operator,
                    message: `Unsupported operator "${operator}" for page assertions.`,
                    permanent: true,
                };
            }

            if (useRegex) {
                let regex;
                try {
                    const sanitizedFlags = (flags || '').replace(/[^gimusdy]/g, '');
                    regex = new RegExp(
                        expected,
                        caseSensitive ? sanitizedFlags : `${sanitizedFlags}i`,
                    );
                } catch (err) {
                    return {
                        passed: false,
                        actual: actualValue,
                        expected,
                        message: `Invalid regular expression "${expected}": ${err.message}`,
                        permanent: true,
                    };
                }
                const found = regex.test(actualValue);
                const passed = operator.endsWith('_not_regex') ? !found : found;
                return {
                    passed,
                    actual: actualValue,
                    expected: passed
                        ? expected
                        : operator.endsWith('_not_regex')
                          ? `(not matching) ${expected}`
                          : `(matching) ${expected}`,
                    message: passed
                        ? undefined
                        : operator.endsWith('_not_regex')
                          ? `Expected page ${propertyName} NOT to match /${expected}/${flags} but it did.`
                          : `Expected page ${propertyName} to match /${expected}/${flags} but it did not.`,
                };
            }

            const haystack = caseSensitive ? actualValue : actualValue.toLowerCase();
            const needle = caseSensitive
                ? String(expected ?? '')
                : String(expected ?? '').toLowerCase();

            let passed;
            if (operator.endsWith('_not_equals')) {
                passed = haystack !== needle;
            } else if (operator.endsWith('_not_contains')) {
                passed = !haystack.includes(needle);
            } else if (operator.endsWith('_not_regex')) {
                // handled above
            } else if (operator.endsWith('_equals')) {
                passed = haystack === needle;
            } else if (operator.endsWith('_contains')) {
                passed = haystack.includes(needle);
            } else if (operator.endsWith('_regex')) {
                // handled above
            } else {
                return {
                    passed: false,
                    actual: actualValue,
                    expected,
                    message: `Unsupported operator "${operator}" for page assertions.`,
                    permanent: true,
                };
            }

            return {
                passed,
                actual: actualValue,
                expected,
                message: passed
                    ? undefined
                    : `Expected page ${propertyName} ${this.describeOperator(operator)} "${expected}" but found "${this.truncate(actualValue)}".`,
            };
        };

        let result = await evaluateOnce();
        if (result.passed || result.permanent) {
            return this.stripInternalFlags(result);
        }

        // A URL or title is routinely expected to arrive after this step runs:
        // a redirect that has not landed yet, or a title written by a
        // client-side script. Every other strategy in this engine re-reads its
        // target until the window expires; page-level assertions read a single
        // snapshot, so the configured timeout had nothing to bound and a check
        // that became true two seconds later failed as though it never would.
        //
        // Polled here rather than through expect() because there is no locator
        // to hand it — the condition is derived from page state — which is the
        // same reason the sibling strategies poll by hand.
        const deadline = Date.now() + assertionWindow(timeout);
        while (!result.passed && Date.now() <= deadline) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            result = await evaluateOnce();
            if (result.permanent) break;
        }

        return this.stripInternalFlags(result);
    }

    /**
     * Drops the bookkeeping keys the engine does not know about, so they
     * cannot leak into a step result.
     */
    stripInternalFlags(result) {
        const { permanent: _permanent, ...rest } = result;
        return rest;
    }

    describeOperator(operator) {
        if (operator.endsWith('_equals')) return 'to equal';
        if (operator.endsWith('_not_equals')) return 'not to equal';
        if (operator.endsWith('_contains')) return 'to contain';
        if (operator.endsWith('_not_contains')) return 'not to contain';
        if (operator.endsWith('_regex')) return 'to match regex';
        if (operator.endsWith('_not_regex')) return 'not to match regex';
        return 'to match';
    }

    truncate(text, max = 120) {
        if (text.length <= max) return text;
        return `${text.slice(0, max)}…`;
    }
}

registerAssertionStrategy(PageStrategy);
export default PageStrategy;
