/**
 * Mapper for form-related interactions.
 * Covers: select_option, submit_form, drag_drop
 */
export const FormMapper = {
    type: ['select_option', 'submit_form', 'drag_drop'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const selector = params.selector || '';
        const waitForNav = params.waitForNavigation !== false; // default true
        const timeoutVal = params.timeout || 30000;

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    select_option: `await page.selectOption(\`${selector}\`, \`${params.value || params.label || ''}\`);`,
                    submit_form: waitForNav
                        ? `await Promise.all([
    page.waitForNavigation({ timeout: ${timeoutVal} }),
    ${selector ? `page.locator(\`${selector}\`).click()` : `page.locator('form').evaluate(form => form.submit())`}
]);`
                        : selector
                          ? `await page.locator(\`${selector}\`).click({ timeout: ${timeoutVal} });`
                          : "await page.locator('form').evaluate(form => form.submit());",
                    drag_drop: `await page.dragAndDrop(\`${params.sourceSelector || params.source || ''}\`, \`${params.targetSelector || params.target || ''}\`);`,
                }[action];

            case 'python':
                return {
                    select_option: `await page.select_option("${selector}", "${params.value || params.label || ''}")`,
                    submit_form: waitForNav
                        ? `async with page.expect_navigation(timeout=${timeoutVal}):
    ${selector ? `await page.locator("${selector}").click()` : `await page.locator("form").evaluate("form => form.submit()")`}`
                        : selector
                          ? `await page.locator("${selector}").click(timeout=${timeoutVal})`
                          : 'await page.locator("form").evaluate("form => form.submit()")',
                    drag_drop: `await page.drag_and_drop("${params.sourceSelector || params.source || ''}", "${params.targetSelector || params.target || ''}")`,
                }[action];

            case 'java':
                return {
                    select_option: `page.selectOption("${selector}", "${params.value || params.label || ''}");`,
                    submit_form: waitForNav
                        ? `page.waitForNavigation(new Page.WaitForNavigationOptions().setTimeout(${timeoutVal}), () -> {
    ${selector ? `page.locator("${selector}").click();` : `page.locator("form").evaluate("form => form.submit()");`}
});`
                        : selector
                          ? `page.locator("${selector}").click(new Locator.ClickOptions().setTimeout(${timeoutVal}));`
                          : 'page.locator("form").evaluate("form => form.submit()");',
                    drag_drop: `page.dragAndDrop("${params.sourceSelector || params.source || ''}", "${params.targetSelector || params.target || ''}");`,
                }[action];

            case 'csharp':
                return {
                    select_option: `await page.SelectOptionAsync("${selector}", "${params.value || params.label || ''}");`,
                    submit_form: waitForNav
                        ? `await page.RunAndWaitForNavigationAsync(async () =>
{
    ${selector ? `await page.Locator("${selector}").ClickAsync();` : `await page.Locator("form").EvaluateAsync("form => form.submit()");`}
}, new PageRunAndWaitForNavigationOptions { Timeout = ${timeoutVal} });`
                        : selector
                          ? `await page.Locator("${selector}").ClickAsync(new LocatorClickOptions { Timeout = ${timeoutVal} });`
                          : 'await page.Locator("form").EvaluateAsync("form => form.submit()");',
                    drag_drop: `await page.DragAndDropAsync("${params.sourceSelector || params.source || ''}", "${params.targetSelector || params.target || ''}");`,
                }[action];

            default:
                return `// form action not implemented for ${lang}`;
        }
    },
};
