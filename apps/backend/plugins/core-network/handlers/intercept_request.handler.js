import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const interceptRequest = (req, res) =>
    executePlaywrightAction(req, res, 'intercept_request', async (page, opts) => {
        const { urlPattern, method, action, responseMock, timeout } = opts;

        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        const handleRoute = async (route) => {
            const request = route.request();

            if (method && method !== 'ALL' && request.method() !== method) {
                return route.fallback();
            }

            try {
                if (action === 'block') {
                    await route.abort();
                } else if (action === 'mock') {
                    let body = responseMock;
                    try {
                        if (typeof body === 'string') {
                            body = JSON.parse(body);
                        }
                    } catch (_e) {
                        /* noop */
                    }

                    await route.fulfill({
                        status: 200,
                        body: typeof body === 'object' ? JSON.stringify(body) : body,
                        contentType: 'application/json',
                    });
                } else if (action === 'modify') {
                    await route.continue();
                } else {
                    await route.continue();
                }
            } catch (err) {
                console.warn('[WARN] Error en intercept_request route handler:', err.message);
            }
        };

        await page.route(urlPattern, handleRoute);

        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }

        return { message: `Intercepción (${action}) configurada para: ${urlPattern}` };
    });

export default interceptRequest;
