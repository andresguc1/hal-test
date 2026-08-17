import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const modifyHeaders = (req, res) =>
    executePlaywrightAction(req, res, 'modify_headers', async (page, opts) => {
        const { urlPattern, headers, method, timeout } = opts;

        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        let headersObj = {};
        try {
            headersObj = JSON.parse(headers);
        } catch (e) {
            throw new Error(req.t('errors.headers_json_required'));
        }

        const handleRoute = async (route) => {
            const request = route.request();
            if (method && request.method() !== method) {
                return route.fallback();
            }

            const originalHeaders = request.headers();
            await route.continue({
                headers: { ...originalHeaders, ...headersObj },
            });
        };

        await page.route(urlPattern, handleRoute);

        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }

        return { message: req.t('actions.modify_headers.success', { urlPattern }) };
    });

export default modifyHeaders;
