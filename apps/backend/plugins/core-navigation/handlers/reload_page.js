import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const reloadAction = (req, res) =>
    executePlaywrightAction(req, res, 'reload_page', async (page) => {
        await page.reload({ waitUntil: 'domcontentloaded' });
        return {
            message: req.t('actions.reload.success'),
            responseExtra: { newUrl: page.url() },
            traceDetails: { url: page.url() },
        };
    });

export default reloadAction;
