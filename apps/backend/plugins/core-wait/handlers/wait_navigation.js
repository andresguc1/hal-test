import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';

const waitNavigation = (req, res) =>
    executePlaywrightAction(req, res, 'wait_navigation', async (page, opts) => {
        const { url, waitUntil = 'load' } = opts;
        const timeout = normalizeTimeout(opts.timeout);

        const validStates = ['load', 'domcontentloaded', 'networkidle'];
        if (!validStates.includes(waitUntil)) {
            throw new Error(
                `Invalid waitUntil state: ${waitUntil}. Must be one of: ${validStates.join(', ')}`,
            );
        }

        try {
            if (url) {
                await page.waitForURL(url, { waitUntil, ...playTimeout(timeout) });
            } else {
                await page.waitForLoadState(waitUntil, playTimeout(timeout));
            }
        } catch (error) {
            throw new Error(
                `Wait navigation failed (url: ${url || 'current'}, state: ${waitUntil}, timeout: ${timeout}ms): ${error.message}`,
            );
        }

        return {
            message: req.t('actions.wait_navigation.success'),
            data: {
                waitedFor: waitUntil,
                timeout,
                url: page.url(),
            },
        };
    });

export default waitNavigation;
