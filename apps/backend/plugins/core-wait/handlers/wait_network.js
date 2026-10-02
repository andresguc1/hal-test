import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { clampTimeout } from '../../../core/timeout-utils.js';

/**
 * Hard ceiling on how long a single "wait until the network settles" may run.
 *
 * A network condition that never satisfies does not fail slowly, it hangs
 * forever, so the user's configured value is honoured when it is smaller and
 * only ever shortened. Matches the WAIT semantic's guardrail in the frontend
 * capability registry.
 */
const NETWORK_IDLE_CEILING_MS = 300000;

/**
 * Waits until no relevant request observed by this step has been in flight for
 * `idleMs`.
 *
 * Requests already in flight when the node started are not counted: Playwright
 * exposes no way to ask whether a Request is still pending (`failure()` is null
 * both for a pending request and for a completed one), and inferring it would
 * make the result depend on a guess. The wait therefore covers requests this
 * step actually sees, which is the same boundary `waitForLoadState` uses.
 *
 * On reaching the ceiling this resolves rather than rejects, reporting
 * `reachedCeiling` so the caller can say the network never settled instead of
 * reporting a quiet network that was not observed. A thrown timeout would be
 * indistinguishable from the far more common "the wait took a while".
 */
const waitNetwork = (req, res) =>
    executePlaywrightAction(req, res, 'wait_network', async (page, opts) => {
        const { idleTime = 1000, includeResources = true } = opts || {};
        const normalizedIdleTime = typeof idleTime === 'number' && idleTime >= 0 ? idleTime : 1000;
        const ceilingMs = clampTimeout(opts?.timeout, NETWORK_IDLE_CEILING_MS, 30000);

        const isRelevant = (request) => {
            if (includeResources) return true;
            const type = request.resourceType();
            return !['image', 'stylesheet', 'font', 'media'].includes(type);
        };

        const outcome = await new Promise((resolve) => {
            const pending = new Set();
            let observed = 0;
            let idleTimer = null;
            let ceilingTimer = null;
            let settled = false;

            // Named rather than anonymous so cleanup detaches these same three.
            // The previous version attached anonymous arrow functions, so its
            // cleanup removed a different set: every wait left a live listener
            // — and a closure holding the timer — attached to the page.
            const onRequest = (request) => {
                if (!isRelevant(request)) return;
                observed += 1;
                pending.add(request);
                clearTimeout(idleTimer);
            };
            const onSettled = (request) => {
                if (!isRelevant(request)) return;
                pending.delete(request);
                if (pending.size === 0) armIdleTimer();
            };

            const cleanup = () => {
                clearTimeout(idleTimer);
                clearTimeout(ceilingTimer);
                page.off('request', onRequest);
                page.off('requestfinished', onSettled);
                page.off('requestfailed', onSettled);
            };

            const finish = (reachedCeiling) => {
                if (settled) return;
                settled = true;
                cleanup();
                resolve({ reachedCeiling, observed, inFlight: pending.size });
            };

            function armIdleTimer() {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(() => finish(false), normalizedIdleTime);
            }

            page.on('request', onRequest);
            page.on('requestfinished', onSettled);
            page.on('requestfailed', onSettled);
            ceilingTimer = setTimeout(() => finish(true), ceilingMs);

            if (pending.size === 0) armIdleTimer();
        });

        return {
            message: req.t('actions.wait_network.success'),
            data: {
                idleTime: normalizedIdleTime,
                includeResources: Boolean(includeResources),
                ceilingMs,
                reachedCeiling: outcome.reachedCeiling,
                observedRequests: outcome.observed,
                inFlightAtExit: outcome.inFlight,
            },
        };
    });

export { NETWORK_IDLE_CEILING_MS };
export default waitNetwork;
