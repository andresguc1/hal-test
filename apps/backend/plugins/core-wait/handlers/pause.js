import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const pause = (req, res) =>
    executePlaywrightAction(req, res, 'pause', async (page, opts) => {
        const { duration } = opts;

        await page.waitForTimeout(duration);

        return {
            message: req.t('actions.pause.success', { duration }),
            traceDetails: { duration },
        };
    });

export default pause;
