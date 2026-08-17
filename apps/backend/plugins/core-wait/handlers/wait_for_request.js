import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const createRegex = (str) => {
    const escaped = str.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(escaped, 'i');
};

const waitForRequest = (req, res) =>
    executePlaywrightAction(req, res, 'wait_for_request', async (page, opts) => {
        const { urlPattern, method, timeout = 30000 } = opts;

        const request = await page.waitForRequest(
            (req) => {
                const regex = createRegex(urlPattern);
                const matchUrl = regex.test(req.url());

                let matchMethod = true;
                if (method && method !== 'ALL') {
                    matchMethod = req.method() === method;
                }

                return matchUrl && matchMethod;
            },
            { timeout },
        );

        return {
            message: req.t('actions.wait_for_request.success'),
            data: {
                url: request.url(),
                method: request.method(),
                postData: request.postData(),
            },
        };
    });

export default waitForRequest;
