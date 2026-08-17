import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const backAction = (req, res) =>
    executePlaywrightAction(req, res, 'go_back', async (page) => {
        const response = await page.goBack();
        if (response === null) {
            const error = new Error(req.t('actions.back.error_no_history'));
            error.status = 400;
            throw error;
        }
        return {
            message: req.t('actions.back.success'),
            responseExtra: { newUrl: page.url() },
            traceDetails: { url: page.url() },
        };
    });

export default backAction;
