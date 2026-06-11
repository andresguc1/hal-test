/**
 * Mapper for DOM query and content nodes.
 * Covers: find_element, get_set_content
 */
export const DOMMapper = {
    type: ['find_element', 'get_set_content'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const selector = params.selector || '';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    find_element: `const elementCount = await page.locator(\`${selector}\`).count();\nconsole.log(\`Found \${elementCount} element(s) matching: ${selector}\`);`,
                    get_set_content: (() => {
                        const op = params.operation || params.mode || 'get';
                        if (op === 'set') {
                            return `await page.locator(\`${selector}\`).fill(\`${params.value || params.text || ''}\`);`;
                        }
                        const attr = params.attribute || 'textContent';
                        if (attr === 'innerHTML')
                            return `const content = await page.locator(\`${selector}\`).innerHTML();`;
                        if (attr === 'innerText')
                            return `const content = await page.locator(\`${selector}\`).innerText();`;
                        return `const content = await page.locator(\`${selector}\`).textContent();`;
                    })(),
                }[action];

            case 'python':
                return {
                    find_element: `element_count = await page.locator("${selector}").count()\nprint(f"Found {element_count} element(s) matching: ${selector}")`,
                    get_set_content: (() => {
                        const op = params.operation || params.mode || 'get';
                        if (op === 'set')
                            return `await page.locator("${selector}").fill("${params.value || params.text || ''}")`;
                        const attr = params.attribute || 'textContent';
                        if (attr === 'innerHTML')
                            return `content = await page.locator("${selector}").inner_html()`;
                        if (attr === 'innerText')
                            return `content = await page.locator("${selector}").inner_text()`;
                        return `content = await page.locator("${selector}").text_content()`;
                    })(),
                }[action];

            case 'java':
                return {
                    find_element: `int elementCount = page.locator("${selector}").count();\nSystem.out.println("Found " + elementCount + " element(s) matching: ${selector}");`,
                    get_set_content: (() => {
                        const op = params.operation || params.mode || 'get';
                        if (op === 'set')
                            return `page.locator("${selector}").fill("${params.value || params.text || ''}");`;
                        const attr = params.attribute || 'textContent';
                        if (attr === 'innerHTML')
                            return `String content = page.locator("${selector}").innerHTML();`;
                        if (attr === 'innerText')
                            return `String content = page.locator("${selector}").innerText();`;
                        return `String content = page.locator("${selector}").textContent();`;
                    })(),
                }[action];

            case 'csharp':
                return {
                    find_element: `var elementCount = await page.Locator("${selector}").CountAsync();\nConsole.WriteLine($"Found {elementCount} element(s) matching: ${selector}");`,
                    get_set_content: (() => {
                        const op = params.operation || params.mode || 'get';
                        if (op === 'set')
                            return `await page.Locator("${selector}").FillAsync("${params.value || params.text || ''}");`;
                        const attr = params.attribute || 'textContent';
                        if (attr === 'innerHTML')
                            return `var content = await page.Locator("${selector}").InnerHTMLAsync();`;
                        if (attr === 'innerText')
                            return `var content = await page.Locator("${selector}").InnerTextAsync();`;
                        return `var content = await page.Locator("${selector}").TextContentAsync();`;
                    })(),
                }[action];

            default:
                return `// DOM action not implemented for ${lang}`;
        }
    },
};
