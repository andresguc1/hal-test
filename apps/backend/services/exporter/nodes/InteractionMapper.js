/**
 * Mapper for user interactions.
 */
export const InteractionMapper = {
    type: ['click', 'type_text', 'type', 'hover', 'scroll', 'press_key'],

    getCode: (params, lang) => {
        const selector = params.selector || '';
        const text = params.text || '';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    click: `await page.click(\`${selector}\`);`,
                    type_text: `await page.fill(\`${selector}\`, \`${text}\`);`,
                    type: `await page.fill(\`${selector}\`, \`${text}\`);`,
                    hover: `await page.hover(\`${selector}\`);`,
                    scroll: `await page.mouse.wheel(${params.deltaX || 0}, ${params.deltaY || 500});`,
                    press_key: `await page.keyboard.press(\`${params.key || ''}\`);`,
                }[params.actionType || params.type];
            case 'python':
                return {
                    click: `await page.click("${selector}")`,
                    type_text: `await page.fill("${selector}", "${text}")`,
                    type: `await page.fill("${selector}", "${text}")`,
                    hover: `await page.hover("${selector}")`,
                    scroll: `await page.mouse.wheel(${params.deltaX || 0}, ${params.deltaY || 500})`,
                    press_key: `await page.keyboard.press("${params.key || ''}")`,
                }[params.actionType || params.type];
            case 'java':
                return {
                    click: `page.click("${selector}");`,
                    type_text: `page.fill("${selector}", "${text}");`,
                    type: `page.fill("${selector}", "${text}");`,
                    hover: `page.hover("${selector}");`,
                    scroll: `page.mouse().wheel(${params.deltaX || 0}, ${params.deltaY || 500});`,
                    press_key: `page.keyboard().press("${params.key || ''}");`,
                }[params.actionType || params.type];
            case 'csharp':
                return {
                    click: `await page.ClickAsync("${selector}");`,
                    type_text: `await page.FillAsync("${selector}", "${text}");`,
                    type: `await page.FillAsync("${selector}", "${text}");`,
                    hover: `await page.HoverAsync("${selector}");`,
                    scroll: `await page.Mouse.WheelAsync(${params.deltaX || 0}, ${params.deltaY || 500});`,
                    press_key: `await page.Keyboard.PressAsync("${params.key || ''}");`,
                }[params.actionType || params.type];
            default:
                return `// interaction not implemented for ${lang}`;
        }
    },
};
