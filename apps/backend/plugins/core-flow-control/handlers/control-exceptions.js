import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const controlExceptionsAction = (req, res) =>
    executePlaywrightAction(req, res, 'control_exceptions', async (page) => {
        /* eslint-disable no-undef */
        await page.evaluate(() => {
            window.addEventListener('unhandledrejection', (event) => {
                console.warn('[PAGE UNHANDLED REJECTION]', event.reason);
            });

            window.addEventListener('error', (event) => {
                console.warn('[PAGE ERROR]', event.message);
            });
        });
        return { message: req.t('actions.control_exceptions.success') };
    });

export default controlExceptionsAction;
