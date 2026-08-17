import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const closeContextAction = (req, res) =>
    executePlaywrightAction(
        req,
        res,
        'close_context',
        async (_page, _opts, _browserId, context) => {
            await context.close();
            return { message: req.t('actions.close_context.success') };
        },
    );

export default closeContextAction;
