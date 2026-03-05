/**
 * Mapper for utility actions.
 */
export const UtilityMapper = {
    type: ['take_screenshot', 'save_dom', 'log_errors'],

    getCode: (params, lang, index) => {
        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    take_screenshot: `await page.screenshot({ path: 'screenshot_${index}.png' });`,
                    save_dom:
                        'const htmlContent = await page.content();\n    console.log("DOM saved. Length: " + htmlContent.length);',
                    log_errors:
                        "page.on('pageerror', error => console.error('Page error:', error));",
                    execute_js: `await page.evaluate(() => {\n        ${params.script || '// Code'}\n    });`,
                }[params.actionType || params.type];
            case 'python':
                return {
                    take_screenshot: `await page.screenshot(path="screenshot_${index}.png")`,
                    save_dom:
                        'html_content = await page.content()\n    print(f"DOM saved. Length: {len(html_content)}")',
                    log_errors: 'page.on("pageerror", lambda error: print(f"Page error: {error}"))',
                    execute_js: `await page.evaluate("""${params.script || 'pass'}""")`,
                }[params.actionType || params.type];
            case 'java':
                return {
                    take_screenshot: `page.screenshot(new Page.ScreenshotOptions().setPath(Paths.get("screenshot_${index}.png")));`,
                    save_dom:
                        'String htmlContent = page.content();\n    System.out.println("DOM saved. Length: " + htmlContent.length());',
                    log_errors:
                        'page.onPageError(error -> System.err.println("Page error: " + error));',
                    execute_js: `page.evaluate("${(params.script || '').replace(/"/g, '\\"')}");`,
                }[params.actionType || params.type];
            case 'csharp':
                return {
                    take_screenshot: `await page.ScreenshotAsync(new PageScreenshotOptions { Path = "screenshot_${index}.png" });`,
                    save_dom:
                        'var htmlContent = await page.ContentAsync();\n    Console.WriteLine($"DOM saved. Length: {htmlContent.Length}");',
                    log_errors:
                        'page.PageError += (sender, error) => Console.WriteLine($"Page error: {error}");',
                    execute_js: `await page.EvaluateAsync("${(params.script || '').replace(/"/g, '\\"')}");`,
                }[params.actionType || params.type];
            default:
                return `// utility not implemented for ${lang}`;
        }
    },
};
