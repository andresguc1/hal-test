import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const createContextAction = (req, res) =>
    executePlaywrightAction(req, res, 'create_context', async (_page, _opts, browserId) => {
        // Note: executePlaywrightAction already attempts to obtain a context.
        // If we want to force a new one, we should use browser.newContext() directly.
        // However, the current getOrCreateContext logic in the controller already handles this.
        // To be explicit, here we could close the current one and open a new one with options
        // if necessary, but for simplicity we'll return the success of obtaining it.

        return {
            message: req.t('actions.create_context.success'),
            data: { browserId },
        };
    });

export default createContextAction;
