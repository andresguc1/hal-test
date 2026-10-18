import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Handler-level tests for the target-resolution decision in assert.handler.
 *
 * A missing/not-yet-attached target must NOT hard-fail the node before the
 * assertion strategies (which auto-wait) get a chance to run. These tests pin
 * the fall-through behaviour:
 *   - slow / late-attaching elements still pass (Playwright auto-wait),
 *   - absence assertions (not_exists / hidden) pass instead of throwing
 *     "Target element not found",
 *   - a genuine failure keeps the actionable "Tried: …" diagnostics,
 *   - an aborted run reports an abort, not a phantom selector problem.
 */

vi.mock('../core/ActionExecutor.js', () => ({
    executePlaywrightAction: async (_req, _res, _action, executor, page) =>
        executor(page || globalThis.__assertTestPage, _req.body),
}));

const buildPlaywrightLocator = vi.fn(() => globalThis.__assertPrimaryLocator);
vi.mock('../core/selector-utils.js', () => ({
    resolveTarget: vi.fn(),
    buildPlaywrightLocator: (...args) => buildPlaywrightLocator(...args),
}));

// Only the run's own abort signal means "cancelled"; the combined req.signal
// also fires on a per-node wall-clock timeout and must not be read as one.
const getSignal = vi.fn(() => null);
vi.mock('../services/ActiveRunManager.js', () => ({
    activeRunManager: { getSignal: (...args) => getSignal(...args) },
}));

import { resolveTarget } from '../core/selector-utils.js';
import assertNode from '../plugins/core-assertion/handlers/assert.handler.js';

const makeLocator = ({ attached = false, count = 0, text = '' } = {}) => ({
    waitFor: vi.fn(async () => {
        if (!attached) throw new Error('Timeout 5000ms exceeded');
    }),
    count: vi.fn(async () => count),
    innerText: vi.fn(async () => text),
    _attached: attached,
});

const runAssert = async (body, { page } = {}) => {
    globalThis.__assertTestPage = page || { locator: () => makeLocator() };
    const req = {
        body: { ...body, runId: body.runId || 'run-1' },
        t: (key, fallback) => fallback || key,
    };
    const res = {};
    let thrown = null;
    let payload = null;
    try {
        payload = await assertNode(req, res);
    } catch (err) {
        thrown = err;
    }
    return { payload, thrown };
};

const noneResolution = (locator, extra = {}) => ({
    locator,
    usedSelector: '#showOverview',
    selectorType: 'id',
    resolution: 'none',
    aborted: false,
    candidatesTried: [
        { selector: '#showOverview', status: 'not-attached', error: 'Timeout 1500ms exceeded' },
        { selector: 'div#showOverview', status: 'not-attached', error: 'Timeout 1500ms exceeded' },
    ],
    errors: [],
    ...extra,
});

beforeEach(() => {
    vi.clearAllMocks();
    getSignal.mockReturnValue(null);
});

describe('assert target resolution fall-through', () => {
    it('passes for a late-attaching element instead of failing with "target not found"', async () => {
        const locator = makeLocator({ attached: true });
        resolveTarget.mockResolvedValueOnce(noneResolution(locator));

        const { payload, thrown } = await runAssert({
            target: { selector: '#showOverview', candidates: {}, scope: 'element' },
            assertion: { type: 'existence', operator: 'exists' },
        });

        expect(thrown).toBeNull();
        expect(payload.success).toBe(true);
        expect(payload.data.targetResolution.resolution).toBe('primary-not-attached');
    });

    it('passes absence assertions (not_exists) on an element that is not present', async () => {
        const locator = makeLocator({ attached: false, count: 0 });
        resolveTarget.mockResolvedValueOnce(noneResolution(locator));

        const { payload, thrown } = await runAssert({
            target: { selector: '#showOverview', candidates: {}, scope: 'element' },
            assertion: { type: 'existence', operator: 'not_exists' },
        });

        expect(thrown).toBeNull();
        expect(payload.success).toBe(true);
    });

    it('keeps the "Tried: …" diagnostics when a presence assertion genuinely fails', async () => {
        const locator = makeLocator({ attached: false, count: 0 });
        resolveTarget.mockResolvedValueOnce(noneResolution(locator));

        const { thrown } = await runAssert({
            target: { selector: '#showOverview', candidates: {}, scope: 'element' },
            assertion: { type: 'existence', operator: 'exists' },
        });

        expect(thrown).not.toBeNull();
        expect(thrown.message).toContain('Tried:');
        expect(thrown.message).toContain('#showOverview');
    });

    it('reports an abort instead of a missing element when the run was cancelled', async () => {
        const locator = makeLocator();
        resolveTarget.mockResolvedValueOnce(noneResolution(locator, { aborted: true }));
        getSignal.mockReturnValue({ aborted: true });

        const { thrown } = await runAssert({
            target: { selector: '#showOverview', candidates: {}, scope: 'element' },
            assertion: { type: 'existence', operator: 'exists' },
        });

        expect(thrown).not.toBeNull();
        expect(thrown.message.toLowerCase()).toContain('aborted');
    });

    it('does NOT report a cancellation when only the per-node timeout aborted the probe', async () => {
        // resolution.aborted is true (the combined signal fired) but the RUN
        // was never cancelled — this is the wall-clock-timeout case that used
        // to masquerade as "the browser/page closed".
        const locator = makeLocator({ attached: true });
        resolveTarget.mockResolvedValueOnce(noneResolution(locator, { aborted: true }));
        getSignal.mockReturnValue(null);

        const { payload, thrown } = await runAssert({
            target: { selector: '#showOverview', candidates: {}, scope: 'element' },
            assertion: { type: 'existence', operator: 'exists' },
        });

        expect(thrown).toBeNull();
        expect(payload.success).toBe(true);
        expect(payload.data.targetResolution.resolution).toBe('primary-not-attached');
    });
});
