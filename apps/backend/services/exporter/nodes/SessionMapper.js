/**
 * Mapper for session/context management nodes.
 * Covers: manage_session, persist_session, create_context, cleanup_state, close_context
 */
export const SessionMapper = {
    type: ['manage_session', 'persist_session', 'create_context', 'cleanup_state', 'close_context'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const storagePath = params.storagePath || params.path || 'storage-state.json';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    manage_session: `// Session management\nawait page.context().storageState({ path: '${storagePath}' });`,
                    persist_session: `await page.context().storageState({ path: '${storagePath}' });`,
                    create_context: `const newContext = await page.context().browser().newContext(${params.storageState ? `{ storageState: '${storagePath}' }` : ''});\nconst newPage = await newContext.newPage();`,
                    cleanup_state: `await page.context().clearCookies();\nawait page.evaluate(() => {\n        localStorage.clear();\n        sessionStorage.clear();\n    });`,
                    close_context: 'await page.context().close();',
                }[action];

            case 'python':
                return {
                    manage_session: `# Session management\nawait page.context.storage_state(path="${storagePath}")`,
                    persist_session: `await page.context.storage_state(path="${storagePath}")`,
                    create_context: `new_context = await page.context.browser.new_context(${params.storageState ? `storage_state="${storagePath}"` : ''})\nnew_page = await new_context.new_page()`,
                    cleanup_state: `await page.context.clear_cookies()\nawait page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")`,
                    close_context: 'await page.context.close()',
                }[action];

            case 'java':
                return {
                    manage_session: `// Session management\npage.context().storageState(new BrowserContext.StorageStateOptions().setPath(Paths.get("${storagePath}")));`,
                    persist_session: `page.context().storageState(new BrowserContext.StorageStateOptions().setPath(Paths.get("${storagePath}")));`,
                    create_context: `BrowserContext newContext = page.context().browser().newContext(${params.storageState ? `new Browser.NewContextOptions().setStorageStatePath(Paths.get("${storagePath}"))` : ''});\nPage newPage = newContext.newPage();`,
                    cleanup_state: `page.context().clearCookies();\npage.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }");`,
                    close_context: 'page.context().close();',
                }[action];

            case 'csharp':
                return {
                    manage_session: `// Session management\nawait page.Context.StorageStateAsync(new() { Path = "${storagePath}" });`,
                    persist_session: `await page.Context.StorageStateAsync(new() { Path = "${storagePath}" });`,
                    create_context: `var newContext = await page.Context.Browser.NewContextAsync(${params.storageState ? `new() { StorageStatePath = "${storagePath}" }` : ''});\nvar newPage = await newContext.NewPageAsync();`,
                    cleanup_state: `await page.Context.ClearCookiesAsync();\nawait page.EvaluateAsync("() => { localStorage.clear(); sessionStorage.clear(); }");`,
                    close_context: 'await page.Context.CloseAsync();',
                }[action];

            default:
                return `// session action not implemented for ${lang}`;
        }
    },
};
