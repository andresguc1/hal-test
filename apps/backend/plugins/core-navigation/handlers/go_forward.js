import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const forwardAction = (req, res) =>
    executePlaywrightAction(req, res, 'go_forward', async (page) => {
        const response = await page.goForward();
        if (response === null) {
            const error = new Error(req.t('actions.forward.error_no_history'));
            error.status = 400;
            throw error;
        }
        return {
            message: req.t('actions.forward.success'),
            responseExtra: { newUrl: page.url() },
            traceDetails: { url: page.url() },
        };
    });

export default forwardAction;
