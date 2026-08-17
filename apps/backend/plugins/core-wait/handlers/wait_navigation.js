import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const waitNavigation = (req, res) =>
    executePlaywrightAction(req, res, 'wait_navigation', async (page, opts) => {
        const { url, waitUntil = 'load', timeout = 30000 } = opts;

        const validStates = ['load', 'domcontentloaded', 'networkidle'];
        if (!validStates.includes(waitUntil)) {
            throw new Error(
                `Invalid waitUntil state: ${waitUntil}. Must be one of: ${validStates.join(', ')}`,
            );
        }

        try {
            if (url) {
                await page.waitForURL(url, { waitUntil, timeout: Number(timeout) });
            } else {
                await page.waitForLoadState(waitUntil, { timeout: Number(timeout) });
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
