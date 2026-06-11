/**
 * Mapper for navigation actions.
 * Covers: go_back, go_forward, wait_navigation, manage_tabs
 */
export const NavigationMapper = {
    type: ['go_back', 'go_forward', 'wait_navigation', 'manage_tabs'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    go_back: 'await page.goBack();',
                    go_forward: 'await page.goForward();',
                    wait_navigation: `await page.waitForNavigation(${params.timeout ? `{ timeout: ${params.timeout} }` : ''});`,
                    manage_tabs: (() => {
                        const tabAction = params.tabAction || 'new';
                        switch (tabAction) {
                            case 'new':
                                return 'const newPage = await page.context().newPage();';
                            case 'close':
                                return 'await page.close();';
                            case 'switch':
                                return `const pages = page.context().pages();\nawait pages[${params.tabIndex || 0}].bringToFront();`;
                            default:
                                return '// Tab management action';
                        }
                    })(),
                }[action];

            case 'python':
                return {
                    go_back: 'await page.go_back()',
                    go_forward: 'await page.go_forward()',
                    wait_navigation: `await page.wait_for_navigation(${params.timeout ? `timeout=${params.timeout}` : ''})`,
                    manage_tabs: (() => {
                        const tabAction = params.tabAction || 'new';
                        switch (tabAction) {
                            case 'new':
                                return 'new_page = await page.context.new_page()';
                            case 'close':
                                return 'await page.close()';
                            case 'switch':
                                return `pages = page.context.pages\nawait pages[${params.tabIndex || 0}].bring_to_front()`;
                            default:
                                return '# Tab management action';
                        }
                    })(),
                }[action];

            case 'java':
                return {
                    go_back: 'page.goBack();',
                    go_forward: 'page.goForward();',
                    wait_navigation: 'page.waitForNavigation(() -> {});',
                    manage_tabs: (() => {
                        const tabAction = params.tabAction || 'new';
                        switch (tabAction) {
                            case 'new':
                                return 'Page newPage = page.context().newPage();';
                            case 'close':
                                return 'page.close();';
                            case 'switch':
                                return `page.context().pages().get(${params.tabIndex || 0}).bringToFront();`;
                            default:
                                return '// Tab management action';
                        }
                    })(),
                }[action];

            case 'csharp':
                return {
                    go_back: 'await page.GoBackAsync();',
                    go_forward: 'await page.GoForwardAsync();',
                    wait_navigation: 'await page.WaitForNavigationAsync();',
                    manage_tabs: (() => {
                        const tabAction = params.tabAction || 'new';
                        switch (tabAction) {
                            case 'new':
                                return 'var newPage = await page.Context.NewPageAsync();';
                            case 'close':
                                return 'await page.CloseAsync();';
                            case 'switch':
                                return `await page.Context.Pages[${params.tabIndex || 0}].BringToFrontAsync();`;
                            default:
                                return '// Tab management action';
                        }
                    })(),
                }[action];

            default:
                return `// navigation not implemented for ${lang}`;
        }
    },
};
