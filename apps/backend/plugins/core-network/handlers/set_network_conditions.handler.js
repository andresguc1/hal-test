import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { applyNetworkConditions } from '../../../core/browser-utils.js';

const setNetworkConditions = (req, res) =>
    executePlaywrightAction(req, res, 'set_network_conditions', async (page, opts) => {
        const { profile } = opts;

        await applyNetworkConditions(page, {
            ...opts,
            networkProfile: opts.profile,
            forceThrottling: true,
        });

        return {
            message: req.t('actions.set_network_conditions.success', { profile }),
        };
    });

export default setNetworkConditions;
