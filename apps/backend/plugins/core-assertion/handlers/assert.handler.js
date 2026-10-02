import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';
import { resolveTarget, buildPlaywrightLocator } from '../../../core/selector-utils.js';
import { assertionEngine } from '../engine/AssertionEngine.js';
import { variableManager } from '../../../services/VariableManager.js';

/**
 * Unified `assert` node handler.
 *
 * Evaluates one or more assertions against a resolved target using the
 * AssertionEngine strategy registry.
 *
 * Request shape:
 * {
 *   target: { selector, scope: 'element'|'collection'|'page', selectorType, candidates },
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

        // Check if any assertion is a "hidden" visibility check
        const hasHiddenAssertion = list.some(
            (a) => a.type === 'visibility' && a.operator === 'hidden',
        );

        const resolution = await resolveTarget({
            page,
            target,
            scope,
            timeout,
            signal: req.signal,
        });

        let locator;
        let resolutionInfo = resolution;

        if (resolution.resolution === 'none') {
            if (hasHiddenAssertion) {
                // For hidden assertions, Playwright considers "not attached" as "hidden"
                // Create a locator from the primary selector and let the assertion engine handle it
                const primary = target?.selector;
                locator = buildPlaywrightLocator(page, primary);
                resolutionInfo = {
                    ...resolution,
                    resolution: 'hidden-assertion-fallback',
                    usedSelector: primary,
                };
            } else {
                const details = resolution.candidatesTried
                    .map((c) => `${c.selector} (${c.status}${c.error ? `: ${c.error}` : ''})`)
                    .join(' | ');
                throw new Error(
                    req.t(
                        'actions.assert.target_not_found',
                        `Target element not found. Tried: ${details || 'no candidates'}`,
                    ),
                );
            }
        } else {
            locator = resolution.locator;
        }

        // Get run variables for snapshot access (mutability assertions)
        const runId = req.body.runId;
        const variables = runId ? variableManager.getAll(runId) : {};

        const results = await assertionEngine.evaluate({
            page,
            locator,
            assertions: list,
            options: { ...playTimeout(timeout) },
            variables,
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
                targetResolution: {
                    usedSelector: resolutionInfo.usedSelector,
                    selectorType: resolutionInfo.selectorType,
                    resolution: resolutionInfo.resolution,
                    candidatesTried: resolutionInfo.candidatesTried,
                },
            },
            traceDetails: {
                target,
                timeout,
                softFail,
                total: totalCount,
                passed: passedCount,
                targetResolution: {
                    usedSelector: resolutionInfo.usedSelector,
                    selectorType: resolutionInfo.selectorType,
                    resolution: resolutionInfo.resolution,
                    candidatesTried: resolutionInfo.candidatesTried,
                },
            },
        };
    });

export default assertNode;
