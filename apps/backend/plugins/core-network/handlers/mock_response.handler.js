import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const mockResponse = (req, res) =>
    executePlaywrightAction(req, res, 'mock_response', async (page, opts) => {
        const { urlPattern, method = 'GET', status = 200, responseBody, headers, timeout } = opts;

        const handleRoute = async (route) => {
            const request = route.request();
            if (method && request.method() !== method) {
                return route.fallback();
            }

            let finalBody = responseBody;
            if (typeof finalBody !== 'string') {
                finalBody = JSON.stringify(finalBody);
            }

            let finalHeaders = {};
            if (headers) {
                try {
                    finalHeaders = JSON.parse(headers);
                } catch (e) {
                    console.warn('Headers inválidos en mock_response');
                }
            }

            await route.fulfill({
                status,
                body: finalBody,
                headers: finalHeaders,
                contentType: 'application/json',
            });
        };

        await page.route(urlPattern, handleRoute);

        if (timeout > 0) {
            setTimeout(() => {
                page.unroute(urlPattern, handleRoute).catch(() => {});
            }, timeout);
        }

        return { message: req.t('actions.mock_response.success', { urlPattern }) };
    });

export default mockResponse;
