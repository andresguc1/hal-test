import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const blockResource = (req, res) =>
    executePlaywrightAction(req, res, 'block_resource', async (page, opts) => {
        const { urlPattern, resourceType, timeout } = opts;

        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        const handleRoute = async (route) => {
            const request = route.request();
            if (resourceType && request.resourceType() !== resourceType) {
                return route.fallback();
            }
            await route.abort();
        };

        await page.route(urlPattern, handleRoute);

        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }

        return {
            message: req.t('actions.block_resource.success', {
                urlPattern,
                resourceType: resourceType || 'all',
            }),
        };
    });

export default blockResource;
