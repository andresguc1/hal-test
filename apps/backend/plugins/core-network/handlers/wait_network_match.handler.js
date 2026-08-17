import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { networkHistoryService } from '../../../services/NetworkHistoryService.js';

const createRegex = (str) => {
    const escaped = str.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(escaped, 'i');
};

const waitNetworkMatch = (req, res) =>
    executePlaywrightAction(req, res, 'wait_network_match', async (page, opts, targetBrowserId) => {
        const { type = 'response', urlPattern, method, statusCode, timeout = 30000 } = opts;
        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        const regex = createRegex(urlPattern);

        const historyMatch = networkHistoryService.findMatch(targetBrowserId, {
            type,
            regex,
            method,
            statusCode,
            since: Date.now() - 60000,
        });

        if (historyMatch) {
            console.log(`[INFO] Found matching ${type} in background history: ${historyMatch.url}`);
            return {
                message: `Matched ${type} from history: ${historyMatch.url} (${
                    historyMatch.status || historyMatch.method
                })`,
                data: historyMatch,
            };
        }

        let data = {};

        if (type === 'request') {
            const request = await page.waitForRequest(
                (req) => {
                    const matchUrl = regex.test(req.url());
                    const methodFilter =
                        method && method.toUpperCase() !== 'ALL' ? method.toUpperCase() : null;
                    const matchMethod =
                        !methodFilter || req.method().toUpperCase() === methodFilter;
                    return matchUrl && matchMethod;
                },
                { timeout: Number(timeout) },
            );
            data = { url: request.url(), method: request.method() };
        } else {
            const response = await page.waitForResponse(
                (resp) => {
                    const matchUrl = regex.test(resp.url());
                    const reqMethod = resp.request().method().toUpperCase();
                    const methodFilter =
                        method && method.toUpperCase() !== 'ALL' ? method.toUpperCase() : null;
                    const matchMethod = !methodFilter || reqMethod === methodFilter;
                    const matchStatus = !statusCode || resp.status() === Number(statusCode);
                    return matchUrl && matchMethod && matchStatus;
                },
                { timeout: Number(timeout) },
            );
            data = { url: response.url(), status: response.status() };
        }
        return {
            message: `Waited for ${type} matching ${urlPattern}`,
            data,
        };
    });

export default waitNetworkMatch;
