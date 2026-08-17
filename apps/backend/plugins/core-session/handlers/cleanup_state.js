import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
/* eslint-disable no-undef */

const cleanupStateAction = (req, res) =>
    executePlaywrightAction(req, res, 'cleanup_state', async (page, opts, browserId, context) => {
        await context.clearCookies();
        // Clear local and session storage
        await page.evaluate(() => {
            try {
                window.localStorage.clear();
                window.sessionStorage.clear();
            } catch (e) {
                // Ignore cleanup errors
            }
        });
        return { message: req.t('actions.cleanup_state.success') };
    });

export default cleanupStateAction;
