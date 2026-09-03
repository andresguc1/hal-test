/**
 * Mapper for session/context management nodes.
 * Covers: manage_session, persist_session, create_context, cleanup_state, close_context
 */

const escapeJsString = (value) => String(value).replace(/'/g, "\\'");
const escapeJavaString = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const createContextOptionsJs = (params) => {
    const opts = [];
    if (params.storageState) {
        const storagePath = params.storagePath || params.path || 'storage-state.json';
        opts.push(`storageState: '${escapeJsString(storagePath)}'`);
    }
    if (params.httpCredentials) {
        const creds = params.httpCredentials;
        const credParts = [];
        if (creds.username !== undefined)
            credParts.push(`username: '${escapeJsString(creds.username)}'`);
        if (creds.password !== undefined)
            credParts.push(`password: '${escapeJsString(creds.password)}'`);
        if (creds.origin) credParts.push(`origin: '${escapeJsString(creds.origin)}'`);
        if (creds.send) credParts.push(`send: '${escapeJsString(creds.send)}'`);
        opts.push(`httpCredentials: { ${credParts.join(', ')} }`);
    }
    return opts.length > 0 ? `{ ${opts.join(', ')} }` : '';
};

const createContextOptionsPython = (params) => {
    const opts = [];
    if (params.storageState) {
        const storagePath = params.storagePath || params.path || 'storage-state.json';
        opts.push(`storage_state="${storagePath}"`);
    }
    if (params.httpCredentials) {
        const creds = params.httpCredentials;
        const credParts = [];
        if (creds.username !== undefined) credParts.push(`username="${creds.username}"`);
        if (creds.password !== undefined) credParts.push(`password="${creds.password}"`);
        if (creds.origin) credParts.push(`origin="${creds.origin}"`);
        if (creds.send) credParts.push(`send="${creds.send}"`);
        opts.push(`http_credentials={${credParts.join(', ')}}`);
    }
    return opts.join(', ');
};

const createContextOptionsJava = (params) => {
    const opts = [];
    if (params.storageState) {
        const storagePath = params.storagePath || params.path || 'storage-state.json';
        opts.push(`setStorageStatePath(Paths.get("${escapeJavaString(storagePath)}"))`);
    }
    if (params.httpCredentials) {
        const creds = params.httpCredentials;
        const args = [];
        if (creds.username !== undefined) args.push(`"${escapeJavaString(creds.username)}"`);
        if (creds.password !== undefined) args.push(`"${escapeJavaString(creds.password)}"`);
        opts.push(`setHttpCredentials(new HttpCredentials(${args.join(', ')}))`);
    }
    if (opts.length === 0) return '';
    return `new Browser.NewContextOptions().${opts.join('.')}`;
};

const createContextOptionsCsharp = (params) => {
    const props = [];
    if (params.storageState) {
        const storagePath = params.storagePath || params.path || 'storage-state.json';
        props.push(`StorageStatePath = "${escapeJavaString(storagePath)}"`);
    }
    if (params.httpCredentials) {
        const creds = params.httpCredentials;
        const credProps = [];
        if (creds.username !== undefined)
            credProps.push(`Username = "${escapeJavaString(creds.username)}"`);
        if (creds.password !== undefined)
            credProps.push(`Password = "${escapeJavaString(creds.password)}"`);
        props.push(`HttpCredentials = new HttpCredentials { ${credProps.join(', ')} }`);
    }
    if (props.length === 0) return '';
    return `new() { ${props.join(', ')} }`;
};

export const SessionMapper = {
    type: ['manage_session', 'persist_session', 'create_context', 'cleanup_state', 'close_context'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const storagePath = params.storagePath || params.path || 'storage-state.json';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript': {
                const ctxOpts = createContextOptionsJs(params);
                return {
                    manage_session: `// Session management\nawait page.context().storageState({ path: '${storagePath}' });`,
                    persist_session: `await page.context().storageState({ path: '${storagePath}' });`,
                    create_context: `const newContext = await page.context().browser().newContext(${ctxOpts});\nconst newPage = await newContext.newPage();`,
                    cleanup_state: `await page.context().clearCookies();\nawait page.evaluate(() => {\n        localStorage.clear();\n        sessionStorage.clear();\n    });`,
                    close_context: 'await page.context().close();',
                }[action];
            }

            case 'python': {
                const ctxOpts = createContextOptionsPython(params);
                return {
                    manage_session: `# Session management\nawait page.context.storage_state(path="${storagePath}")`,
                    persist_session: `await page.context.storage_state(path="${storagePath}")`,
                    create_context: `new_context = await page.context.browser.new_context(${ctxOpts})\nnew_page = await new_context.new_page()`,
                    cleanup_state: `await page.context.clear_cookies()\nawait page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")`,
                    close_context: 'await page.context.close()',
                }[action];
            }

            case 'java': {
                const ctxOpts = createContextOptionsJava(params);
                return {
                    manage_session: `// Session management\npage.context().storageState(new BrowserContext.StorageStateOptions().setPath(Paths.get("${storagePath}")));`,
                    persist_session: `page.context().storageState(new BrowserContext.StorageStateOptions().setPath(Paths.get("${storagePath}")));`,
                    create_context: `BrowserContext newContext = page.context().browser().newContext(${ctxOpts});\nPage newPage = newContext.newPage();`,
                    cleanup_state: `page.context().clearCookies();\npage.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }");`,
                    close_context: 'page.context().close();',
                }[action];
            }

            case 'csharp': {
                const ctxOpts = createContextOptionsCsharp(params);
                return {
                    manage_session: `// Session management\nawait page.Context.StorageStateAsync(new() { Path = "${storagePath}" });`,
                    persist_session: `await page.Context.StorageStateAsync(new() { Path = "${storagePath}" });`,
                    create_context: `var newContext = await page.Context.Browser.NewContextAsync(${ctxOpts});\nvar newPage = await newContext.NewPageAsync();`,
                    cleanup_state: `await page.Context.ClearCookiesAsync();\nawait page.EvaluateAsync("() => { localStorage.clear(); sessionStorage.clear(); }");`,
                    close_context: 'await page.Context.CloseAsync();',
                }[action];
            }

            default:
                return `// session action not implemented for ${lang}`;
        }
    },
};
