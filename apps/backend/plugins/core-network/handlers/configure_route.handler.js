import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const configureRoute = (req, res) =>
    executePlaywrightAction(req, res, 'configure_route', async (page, opts) => {
        const {
            urlPattern,
            routeAction = 'abort',
            method,
            statusCode = 200,
            responseBody,
            headers,
            timeout,
        } = opts;
        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        const handleRoute = async (route) => {
            const request = route.request();
            const methodFilter =
                method && method.toUpperCase() !== 'ALL' ? method.toUpperCase() : null;
            if (methodFilter && request.method().toUpperCase() !== methodFilter) {
                return route.fallback();
            }

            try {
                if (routeAction === 'abort') {
                    await route.abort();
                } else if (routeAction === 'mock') {
                    let finalBody = responseBody;
                    if (typeof finalBody !== 'string' && finalBody) {
                        finalBody = JSON.stringify(finalBody);
                    }
                    let finalHeaders = {};
                    if (headers) {
                        try {
                            finalHeaders = JSON.parse(headers);
                        } catch (e) {
                            console.warn('[WARN] Invalid headers JSON in mock');
                        }
                    }
                    await route.fulfill({
                        status: Number(statusCode),
                        body: finalBody,
                        headers: finalHeaders,
                        contentType: 'application/json',
                    });
                } else if (routeAction === 'modify_headers') {
                    let headersObj = {};
                    try {
                        headersObj = JSON.parse(headers || '{}');
                    } catch (e) {
                        throw new Error(req.t('errors.headers_json_required'));
                    }
                    const originalHeaders = request.headers();
                    await route.continue({
                        headers: { ...originalHeaders, ...headersObj },
                    });
                } else if (routeAction === 'log') {
                    console.log(`[ROUTE LOG] ${request.method()} ${request.url()}`);
                    await route.continue();
                } else {
                    await route.continue();
                }
            } catch (err) {
                console.warn(`[WARN] Route handler error for ${urlPattern}: ${err.message}`);
            }
        };

        await page.route(urlPattern, handleRoute);
        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }
        return { message: `Route configured (${routeAction}) for: ${urlPattern}` };
    });

export default configureRoute;
