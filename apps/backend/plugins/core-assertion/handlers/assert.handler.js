import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';
import {
    buildPlaywrightLocator,
    normalizeSelectorForDotId,
    convertPlaywrightLocator,
} from '../../../core/selector-utils.js';
import { assertionEngine } from '../engine/AssertionEngine.js';

/**
 * Unified `assert` node handler.
 *
 * Evaluates one or more assertions against a resolved target using the
 * AssertionEngine strategy registry.
 *
 * Request shape:
 * {
 *   target: { selector, scope: 'element'|'collection'|'page', selectorType },
 *   assertion: { type, operator, expected, … },   // single assertion
 *   assertions: [ … ],                            // or a list of assertions
 *   timeout, softFail, takeScreenshotOnFailure
 * }
 */
const assertNode = (req, res) =>
    executePlaywrightAction(req, res, 'assert', async (page, opts) => {
        const { target, assertion, assertions } = opts;
        const timeout = normalizeTimeout(opts.timeout);
        const softFail =
            opts.softFail === true ||
            opts.softFail === 'true' ||
            opts.continueOnError === true ||
            opts.continueOnError === 'true';

        const list = assertion
            ? [assertion, ...(Array.isArray(assertions) ? assertions : [])]
            : Array.isArray(assertions)
              ? assertions
              : [];

        if (list.length === 0) {
            throw new Error(
                req.t(
                    'actions.assert.no_assertions',
                    'No assertions provided. Add an "assertion" or an "assertions" list.',
                ),
            );
        }

        const scope = (target && target.scope) || 'element';
        const needsElementSelector = scope !== 'page';

        if (!target || (needsElementSelector && !target.selector)) {
            throw new Error(
                req.t(
                    'actions.assert.selector_required',
                    'A target selector is required to evaluate the assertion.',
                ),
            );
        }

        let locator;
        if (scope === 'page') {
            locator = page.locator('body');
        } else {
            const selector = convertPlaywrightLocator(target.selector);
            const normalized = await normalizeSelectorForDotId(page, selector);
            locator = buildPlaywrightLocator(page, normalized);
        }

        const results = await assertionEngine.evaluate({
            page,
            locator,
            assertions: list,
            options: { ...playTimeout(timeout) },
        });

        const totalCount = results.length;
        const passedCount = results.filter((r) => r.passed).length;
        const allPassed = passedCount === totalCount;
        const failedResults = results.filter((r) => !r.passed);

        if (!allPassed && !softFail) {
            const details = failedResults
                .map((r) => r.message || `Assertion "${r.type}:${r.operator}" failed.`)
                .join(' | ');
            throw new Error(
                req.t(
                    'actions.assert.hard_failed',
                    `Assertion failed (${passedCount}/${totalCount} passed). ${details}`,
                ),
            );
        }

        return {
            message: allPassed
                ? req.t('actions.assert.passed', `All ${totalCount} assertion(s) passed.`)
                : req.t(
                      'actions.assert.soft_failed',
                      `Assertion soft-failed (${passedCount}/${totalCount} passed).`,
                  ),
            success: true,
            data: {
                status: allPassed ? 'success' : 'softfailed',
                success: allPassed,
                passed: passedCount,
                failed: totalCount - passedCount,
                total: totalCount,
                softFailed: !allPassed,
                assertions: results,
            },
            traceDetails: {
                target,
                timeout,
                softFail,
                total: totalCount,
                passed: passedCount,
            },
        };
    });

export default assertNode;
