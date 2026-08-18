/**
 * Mapper for DOM query and content nodes.
 * Covers: find_element, get_set_content
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

export const DOMMapper = {
    type: ['find_element', 'get_set_content'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const selector = params.selector || '';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript': {
                const s = escapeForTemplateLiteral(selector);
                const v = escapeForTemplateLiteral(params.value || params.text || '');
                return {
                    find_element: `const elementCount = await page.locator(\`${s}\`).count();\nconsole.log(\`Found \${elementCount} element(s) matching: ${s}\`);`,
                    get_set_content: (() => {
                        const op = params.operation || params.mode || 'get';
                        if (op === 'set') {
                            return `await page.locator(\`${s}\`).fill(\`${v}\`);`;
                        }
                        const attr = params.attribute || 'textContent';
                        if (attr === 'innerHTML')
                            return `const content = await page.locator(\`${s}\`).innerHTML();`;
                        if (attr === 'innerText')
                            return `const content = await page.locator(\`${s}\`).innerText();`;
                        return `const content = await page.locator(\`${s}\`).textContent();`;
                    })(),
                }[action];
            }

            case 'python': {
                const s = escapeForDoubleQuotes(selector);
                const v = escapeForDoubleQuotes(params.value || params.text || '');
                return {
                    find_element: `element_count = await page.locator("${s}").count()\nprint(f"Found {element_count} element(s) matching: ${s}")`,
                    get_set_content: (() => {
                        const op = params.operation || params.mode || 'get';
                        if (op === 'set') return `await page.locator("${s}").fill("${v}")`;
                        const attr = params.attribute || 'textContent';
                        if (attr === 'innerHTML')
                            return `content = await page.locator("${s}").inner_html()`;
                        if (attr === 'innerText')
                            return `content = await page.locator("${s}").inner_text()`;
                        return `content = await page.locator("${s}").text_content()`;
                    })(),
                }[action];
            }

            case 'java': {
                const s = escapeForDoubleQuotes(selector);
                const v = escapeForDoubleQuotes(params.value || params.text || '');
                return {
                    find_element: `int elementCount = page.locator("${s}").count();\nSystem.out.println("Found " + elementCount + " element(s) matching: ${s}");`,
                    get_set_content: (() => {
                        const op = params.operation || params.mode || 'get';
                        if (op === 'set') return `page.locator("${s}").fill("${v}");`;
                        const attr = params.attribute || 'textContent';
                        if (attr === 'innerHTML')
                            return `String content = page.locator("${s}").innerHTML();`;
                        if (attr === 'innerText')
                            return `String content = page.locator("${s}").innerText();`;
                        return `String content = page.locator("${s}").textContent();`;
                    })(),
                }[action];
            }

            case 'csharp': {
                const s = escapeForDoubleQuotes(selector);
                const v = escapeForDoubleQuotes(params.value || params.text || '');
                return {
                    find_element: `var elementCount = await page.Locator("${s}").CountAsync();\nConsole.WriteLine($"Found {elementCount} element(s) matching: ${s}");`,
                    get_set_content: (() => {
                        const op = params.operation || params.mode || 'get';
                        if (op === 'set') return `await page.Locator("${s}").FillAsync("${v}");`;
                        const attr = params.attribute || 'textContent';
                        if (attr === 'innerHTML')
                            return `var content = await page.Locator("${s}").InnerHTMLAsync();`;
                        if (attr === 'innerText')
                            return `var content = await page.Locator("${s}").InnerTextAsync();`;
                        return `var content = await page.Locator("${s}").TextContentAsync();`;
                    })(),
                }[action];
            }

            default:
                return `// DOM action not implemented for ${lang}`;
        }
    },
};
