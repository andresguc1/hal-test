import { executePlaywrightAction } from '../../../core/ActionExecutor.js';

const manageTabsAction = (req, res) =>
    executePlaywrightAction(req, res, 'manage_tabs', async (page, opts, browserId, context) => {
        const { action, url, tabIndex, closeAll } = opts;
        let message = '';
        let responseData = {};

        // Validate that the action is valid
        const validActions = ['new', 'switch', 'close', 'list'];
        if (!validActions.includes(action)) {
            throw new Error(
                req.t('actions.manage_tabs.error_invalid_action', {
                    action,
                    validActions: validActions.join(', '),
                }),
            );
        }

        if (action === 'new') {
            // Create new tab
            const newPage = await context.newPage();
            if (url) {
                await newPage.goto(url, { waitUntil: 'load', timeout: 30000 });
                responseData.url = newPage.url();
            } else {
                responseData.url = 'about:blank';
            }
            const pages = context.pages();
            responseData.tabIndex = pages.length - 1;
            responseData.totalTabs = pages.length;
            message = req.t('actions.manage_tabs.new_success', { count: pages.length });
        } else if (action === 'switch') {
            // Switch to specific tab
            if (tabIndex === undefined || tabIndex === null) {
                throw new Error(req.t('actions.manage_tabs.error_tab_index_required'));
            }
            const pages = context.pages();
            if (tabIndex < 0 || tabIndex >= pages.length) {
                throw new Error(
                    req.t('actions.manage_tabs.error_invalid_index', {
                        index: tabIndex,
                        max: pages.length - 1,
                    }),
                );
            }
            const targetPage = pages[tabIndex];
            await targetPage.bringToFront();
            responseData.tabIndex = tabIndex;
            responseData.url = targetPage.url();
            responseData.title = await targetPage.title();
            message = req.t('actions.manage_tabs.switch_success', {
                index: tabIndex,
                title: responseData.title,
            });
        } else if (action === 'close') {
            // Close tab(s)
            if (closeAll) {
                const pages = context.pages();
                const count = pages.length;
                await Promise.all(pages.map((p) => p.close()));
                message = req.t('actions.manage_tabs.close_all_success', { count });
                responseData.closedCount = count;
            } else if (tabIndex !== undefined && tabIndex !== null) {
                const pages = context.pages();
                if (tabIndex < 0 || tabIndex >= pages.length) {
                    throw new Error(
                        req.t('actions.manage_tabs.error_invalid_index', {
                            index: tabIndex,
                            max: pages.length - 1,
                        }),
                    );
                }
                await pages[tabIndex].close();
                message = req.t('actions.manage_tabs.close_index_success', { index: tabIndex });
                responseData.closedIndex = tabIndex;
                responseData.remainingTabs = context.pages().length;
            } else {
                // Close active tab (the last one in the array)
                const pages = context.pages();
                if (pages.length === 0) {
                    throw new Error(req.t('actions.manage_tabs.error_no_tabs'));
                }
                await page.close();
                message = req.t('actions.manage_tabs.close_active_success');
                responseData.remainingTabs = context.pages().length;
            }
        } else if (action === 'list') {
            // List all tabs
            const pages = context.pages();
            const tabsInfo = await Promise.all(
                pages.map(async (p, index) => {
                    try {
                        return {
                            index,
                            url: p.url(),
                            title: await p.title(),
                            isClosed: p.isClosed(),
                        };
                    } catch (err) {
                        return {
                            index,
                            url: 'unknown',
                            title: 'Error retrieving information',
                            isClosed: true,
                            error: err.message,
                        };
                    }
                }),
            );
            responseData.tabs = tabsInfo;
            responseData.totalTabs = pages.length;
            message = req.t('actions.manage_tabs.list_success', { count: pages.length });
        }

        return {
            message,
            data: responseData,
            traceDetails: { action, url, tabIndex, totalTabs: context.pages().length },
        };
    });

export default manageTabsAction;
