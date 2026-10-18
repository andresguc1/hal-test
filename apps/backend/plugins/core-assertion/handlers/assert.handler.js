import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';
import { resolveTarget, buildPlaywrightLocator } from '../../../core/selector-utils.js';
import { assertionEngine } from '../engine/AssertionEngine.js';
import { variableManager } from '../../../services/VariableManager.js';
import { activeRunManager } from '../../../services/ActiveRunManager.js';

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
        const runId = req.body.runId;
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
            // Distinguish a genuine run cancellation (user pressed Stop / the
            // browser was torn down) from a per-node wall-clock timeout.
            // req.signal is a COMBINED signal — AbortSignal.any([runSignal,
            // AbortSignal.timeout(wallClockMs)]) — so req.signal.aborted is
            // ALSO true whenever the node simply ran out of time. Deciding
            // "cancelled" from it produced the misleading "the run was
            // cancelled, or the browser/page closed" error on a healthy run.
            // Only the run's own abort signal means cancellation.
            const runCancelled = activeRunManager.getSignal(runId)?.aborted === true;
            if (runCancelled) {
                throw new Error(
                    req.t(
                        'actions.assert.target_resolution_aborted',
                        `Target resolution for "${target?.selector}" was aborted before the element could be checked. The run was cancelled, or the browser/page closed.`,
                    ),
                );
            }

            // Timed-out or transient probe abort, or the target simply did not
            // attach within the quick probe window. Do NOT hard-fail:
            // Playwright assertions auto-wait, and the assertion may well be an
            // absence check (not_exists / hidden) or a slow-rendering target.
            // A real wall-clock overrun is still surfaced truthfully by
            // _withNodeTimeout after the engine runs.
            const primary = target?.selector;
            locator = resolution.locator || buildPlaywrightLocator(page, primary);
            resolutionInfo = {
                ...resolution,
                resolution: hasHiddenAssertion
                    ? 'hidden-assertion-fallback'
                    : 'primary-not-attached',
                usedSelector: primary,
            };
        } else {
            locator = resolution.locator;
        }

        // Get run variables for snapshot access (mutability assertions)
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
            // If the selector never attached, add the candidates we tried so
            // the failure stays as actionable as the old "Target element not
            // found" message, without failing early (which broke slow pages).
            let hint = '';
            if (resolutionInfo.resolution === 'primary-not-attached') {
                const tried = (resolutionInfo.candidatesTried || [])
                    .map((c) => `${c.selector} (${c.status})`)
                    .join(' | ');
                if (tried) hint = ` Tried: ${tried}.`;
            }
            throw new Error(
                req.t(
                    'actions.assert.hard_failed',
                    `Assertion failed (${passedCount}/${totalCount} passed). ${details}${hint}`,
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
