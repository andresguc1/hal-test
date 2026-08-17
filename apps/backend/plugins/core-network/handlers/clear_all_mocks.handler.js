import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const clearAllMocks = (req, res) =>
    executePlaywrightAction(req, res, 'clear_all_mocks', async (page) => {
        await page.unrouteAll({ behavior: 'ignoreErrors' });

        return { message: req.t('actions.clear_all_mocks.success') };
    });

export default clearAllMocks;
