import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const waitNetwork = (req, res) =>
    executePlaywrightAction(req, res, 'wait_network', async (page, opts) => {
        const { idleTime = 1000, includeResources = true } = opts || {};
        const normalizedIdleTime = typeof idleTime === 'number' && idleTime >= 0 ? idleTime : 1000;

        const waitForNetworkIdle = async (page, idleMs, includeResources) => {
            const pending = new Set();
            const isRelevant = (req) => {
                if (includeResources) return true;
                const type = req.resourceType();
                return !['image', 'stylesheet', 'font', 'media'].includes(type);
            };
            const onRequest = (req) => {
                if (isRelevant(req)) pending.add(req);
            };
            const onDone = (req) => {
                if (isRelevant(req)) pending.delete(req);
            };
            page.on('request', onRequest);
            page.on('requestfinished', onDone);
            page.on('requestfailed', onDone);
            await new Promise((resolve) => {
                let timer;
                const check = () => {
                    if (pending.size === 0) {
                        timer = setTimeout(() => {
                            cleanup();
                            resolve();
                        }, idleMs);
                    }
                };
                const resetTimer = () => {
                    if (timer) clearTimeout(timer);
                };
                const cleanup = () => {
                    page.removeListener('request', onRequest);
                    page.removeListener('requestfinished', onDone);
                    page.removeListener('requestfailed', onDone);
                };
                check();
                page.on('request', (req) => {
                    if (isRelevant(req)) resetTimer();
                });
                page.on('requestfinished', check);
                page.on('requestfailed', check);
            });
        };

        await waitForNetworkIdle(page, normalizedIdleTime, includeResources);

        return {
            message: req.t('actions.wait_network.success'),
            data: {
                idleTime: normalizedIdleTime,
                includeResources: Boolean(includeResources),
            },
        };
    });

export default waitNetwork;
