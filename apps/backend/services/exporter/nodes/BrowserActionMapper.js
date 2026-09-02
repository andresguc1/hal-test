/**
 * Mapper for browser-level actions.
 */
export const BrowserActionMapper = {
    type: [
        'reload',
        'reload_page',
        'resize_viewport',
        'close_browser',
        'launch_browser',
        'browser_dialog',
    ],

    getCode: (params, lang) => {
        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    reload: 'await page.reload();',
                    reload_page: 'await page.reload();',
                    resize_viewport: `await page.setViewportSize({ width: ${params.width || 1280}, height: ${params.height || 720} });`,
                    close_browser: '// Browser managed by runner',
                    launch_browser: '// Browser managed by runner',
                    browser_dialog: browserDialogCode(params, '//'),
                }[params.actionType || params.type];
            case 'python':
                return {
                    reload: 'await page.reload()',
                    reload_page: 'await page.reload()',
                    resize_viewport: `await page.set_viewport_size({"width": ${params.width || 1280}, "height": ${params.height || 720}})`,
                    close_browser: 'await browser.close()',
                    launch_browser: '# Browser managed by runner',
                    browser_dialog: browserDialogCode(params, '#'),
                }[params.actionType || params.type];
            case 'java':
                return {
                    reload: 'page.reload();',
                    reload_page: 'page.reload();',
                    resize_viewport: `page.setViewportSize(${params.width || 1280}, ${params.height || 720});`,
                    close_browser: '// Browser managed by runner',
                    launch_browser: '// Browser managed by runner',
                    browser_dialog: browserDialogCode(params, '//'),
                }[params.actionType || params.type];
            case 'csharp':
                return {
                    reload: 'await page.ReloadAsync();',
                    reload_page: 'await page.ReloadAsync();',
                    resize_viewport: `await page.SetViewportSizeAsync(${params.width || 1280}, ${params.height || 720});`,
                    close_browser: '// Browser managed by runner',
                    launch_browser: '// Browser managed by runner',
                    browser_dialog: browserDialogCode(params, '//'),
                }[params.actionType || params.type];
            default:
                return `// action not implemented for ${lang}`;
        }
    },
};

const escapeForQuotes = (value = '') => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const browserDialogCode = (params, commentChar) => {
    const expectText = params.expectText || '';
    const action = params.action || 'accept';
    const lines = [];
    lines.push("page.once('dialog', async (dialog) => {");
    if (expectText) {
        const s = escapeForQuotes(expectText);
        lines.push(`    if (dialog.message().includes('${s}')) {`);
        lines.push(`        console.log('Dialog matched: ${s}');`);
        lines.push('    }');
    }
    lines.push(
        `    await dialog.${action === 'dismiss' ? 'dismiss' : 'accept'}().catch(() => {});`,
    );
    lines.push('});');
    lines.push(
        `${commentChar} The next native dialog (alert/confirm/prompt) will be ${action === 'dismiss' ? 'dismissed' : 'accepted'}.`,
    );
    return lines.join('\n');
};
