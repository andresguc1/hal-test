import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const handleHooksAction = (req, res) =>
    executePlaywrightAction(req, res, 'handle_hooks', async (page, opts) => {
        const { hookScript } = opts;
        if (hookScript) {
            await page.evaluate(hookScript);
            return { message: req.t('actions.handle_hooks.success') };
        }
        return { message: req.t('actions.handle_hooks.no_script') };
    });

export default handleHooksAction;
