import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';
import { resolveTarget } from '../../../core/selector-utils.js';
import { variableManager } from '../../../services/VariableManager.js';

/**
 * capture_snapshot handler.
 *
 * Captures the current value of an element (text, value, html, or attribute)
 * and stores it in the run variables under a specified key. This snapshot
 * can later be used by a 'mutability' assertion to verify if content has
 * changed or remained unchanged.
 *
 * Request shape:
 * {
 *   target: { selector, scope: 'element'|'collection', selectorType, candidates },
 *   snapshotKey: string,              // Required: key to store the snapshot
 *   property: 'text' | 'value' | 'html' | 'attribute:{name}' (default: 'text'),
 *   timeout,
 * }
 */
const captureSnapshotNode = (req, res) =>
    executePlaywrightAction(req, res, 'capture_snapshot', async (page, opts) => {
        const { target, snapshotKey, property = 'text' } = opts;
        const timeout = normalizeTimeout(opts.timeout);

        if (!snapshotKey) {
            throw new Error(
                req.t(
                    'actions.capture_snapshot.key_required',
                    'snapshotKey is required to store the captured value.',
                ),
            );
        }

        if (!target || !target.selector) {
            throw new Error(
                req.t(
                    'actions.capture_snapshot.selector_required',
                    'A target selector is required to capture the snapshot.',
                ),
            );
        }

        const resolution = await resolveTarget({ page, target, scope: 'element', timeout });

        if (resolution.resolution === 'none') {
            const details = resolution.candidatesTried
                .map((c) => `${c.selector} (${c.status}${c.error ? `: ${c.error}` : ''})`)
                .join(' | ');
            throw new Error(
                req.t(
                    'actions.capture_snapshot.target_not_found',
                    `Target element not found for snapshot. Tried: ${details || 'no candidates'}`,
                ),
            );
        }

        const locator = resolution.locator;

        try {
            await locator.waitFor({ state: 'attached', ...playTimeout(timeout) });
        } catch (err) {
            throw new Error(
                req.t(
                    'actions.capture_snapshot.element_not_found',
                    'Element was not found, so its value could not be captured.',
                ),
            );
        }

        let currentValue;
        if (property === 'value') {
            currentValue = await locator.inputValue().catch(() => '');
        } else if (property === 'html') {
            currentValue = await locator.innerHTML().catch(() => '');
        } else if (property.startsWith('attribute:')) {
            const attrName = property.split(':')[1];
            currentValue = (await locator.getAttribute(attrName).catch(() => '')) ?? '';
        } else {
            currentValue = await locator.innerText().catch(() => '');
        }

        // Store in run variables via the variable manager
        // Note: variableManager.set(name, value, runId)
        const runId = req.body.runId;
        if (runId) {
            variableManager.set(snapshotKey, currentValue, runId);
        }

        return {
            message: req.t(
                'actions.capture_snapshot.success',
                `Snapshot captured and stored under key "${snapshotKey}".`,
            ),
            success: true,
            data: {
                snapshotKey,
                value: currentValue,
                property,
                targetResolution: {
                    usedSelector: resolution.usedSelector,
                    selectorType: resolution.selectorType,
                    resolution: resolution.resolution,
                    candidatesTried: resolution.candidatesTried,
                },
            },
            traceDetails: {
                target,
                property,
                timeout,
                targetResolution: {
                    usedSelector: resolution.usedSelector,
                    selectorType: resolution.selectorType,
                    resolution: resolution.resolution,
                    candidatesTried: resolution.candidatesTried,
                },
            },
        };
    });

export default captureSnapshotNode;
