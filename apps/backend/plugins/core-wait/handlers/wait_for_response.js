import { executePlaywrightAction } from '../../../core/ActionExecutor.js';
import { variableManager } from '../../../services/VariableManager.js';

const createRegex = (str) => {
    const escaped = str.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(escaped, 'i');
};

const waitForResponse = (req, res) =>
    executePlaywrightAction(req, res, 'wait_for_response', async (page, opts) => {
        const { urlPattern, statusCode, timeout = 30000, saveToVariable } = opts;

        if (!urlPattern) throw new Error(req.t('errors.url_pattern_required'));

        let response;
        if (statusCode) {
            response = await page.waitForResponse(
                (resp) => {
                    const url = resp.url();
                    const regex = createRegex(urlPattern);
                    const matchUrl = regex.test(url);
                    const matchStatus = resp.status() === statusCode;

                    return matchUrl && matchStatus;
                },
                { timeout },
            );
        } else {
            response = await page.waitForResponse(urlPattern, { timeout });
        }

        let bodyData = null;
        if (saveToVariable && response) {
            try {
                bodyData = await response.json();
            } catch (e) {
                bodyData = await response.text();
            }
            variableManager.set(saveToVariable, bodyData, req.body.runId);
        }

        return {
            message: req.t('actions.wait_for_response.success'),
            data: {
                url: response.url(),
                status: response.status(),
                headers: response.headers(),
                savedVariable: saveToVariable ? saveToVariable : null,
            },
        };
    });

export default waitForResponse;
