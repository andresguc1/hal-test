/**
 * Mapper for user interactions.
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

export const InteractionMapper = {
    type: ['click', 'type_text', 'type', 'hover', 'scroll', 'press_key'],

    getCode: (params, lang, index, framework = 'playwright') => {
        const selector = params.selector || '';
        const text = params.text || '';

        if (framework.toLowerCase() === 'cypress') {
            const s = escapeForTemplateLiteral(selector);
            const t = escapeForTemplateLiteral(text);
            return (
                {
                    click: `cy.get(\`${s}\`).click();`,
                    type_text: `cy.get(\`${s}\`).type(\`${t}\`);`,
                    type: `cy.get(\`${s}\`).type(\`${t}\`);`,
                    hover: `cy.get(\`${s}\`).trigger('mouseover');`,
                    scroll: `cy.scrollTo(${params.deltaX || 0}, ${params.deltaY || 500});`,
                    press_key: `cy.get('body').type(\`{${params.key || ''}}\`);`,
                }[params.actionType || params.type] || `// action not implemented for Cypress`
            );
        }

        if (framework.toLowerCase() === 'selenium') {
            if (lang.toLowerCase() === 'python') {
                const s = escapeForDoubleQuotes(selector);
                const t = escapeForDoubleQuotes(text);
                return (
                    {
                        click: `driver.find_element(By.CSS_SELECTOR, "${s}").click()`,
                        type_text: `driver.find_element(By.CSS_SELECTOR, "${s}").send_keys("${t}")`,
                        type: `driver.find_element(By.CSS_SELECTOR, "${s}").send_keys("${t}")`,
                        hover: `from selenium.webdriver.common.action_chains import ActionChains\n        element = driver.find_element(By.CSS_SELECTOR, "${s}")\n        ActionChains(driver).move_to_element(element).perform()`,
                        scroll: `driver.execute_script("window.scrollBy(${params.deltaX || 0}, ${params.deltaY || 500});")`,
                        press_key: `driver.find_element(By.TAG_NAME, "body").send_keys(Keys.${(params.key || '').toUpperCase()})`,
                    }[params.actionType || params.type] ||
                    `# action not implemented for Selenium Python`
                );
            }
            if (lang.toLowerCase() === 'java') {
                const s = escapeForDoubleQuotes(selector);
                const t = escapeForDoubleQuotes(text);
                return (
                    {
                        click: `driver.findElement(By.cssSelector("${s}")).click();`,
                        type_text: `driver.findElement(By.cssSelector("${s}")).sendKeys("${t}");`,
                        type: `driver.findElement(By.cssSelector("${s}")).sendKeys("${t}");`,
                        hover: `new Actions(driver).moveToElement(driver.findElement(By.cssSelector("${s}"))).perform();`,
                        scroll: `((org.openqa.selenium.JavascriptExecutor) driver).executeScript("window.scrollBy(${params.deltaX || 0}, ${params.deltaY || 500});");`,
                        press_key: `driver.findElement(By.tagName("body")).sendKeys(Keys.${(params.key || '').toUpperCase()});`,
                    }[params.actionType || params.type] ||
                    `// action not implemented for Selenium Java`
                );
            }
            return `// interaction not implemented for Selenium in ${lang}`;
        }

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript': {
                const s = escapeForTemplateLiteral(selector);
                const t = escapeForTemplateLiteral(text);
                return {
                    click: `await page.click(\`${s}\`);`,
                    type_text: `await page.fill(\`${s}\`, \`${t}\`);`,
                    type: `await page.fill(\`${s}\`, \`${t}\`);`,
                    hover: `await page.hover(\`${s}\`);`,
                    scroll: `await page.mouse.wheel(${params.deltaX || 0}, ${params.deltaY || 500});`,
                    press_key: `await page.keyboard.press(\`${params.key || ''}\`);`,
                }[params.actionType || params.type];
            }
            case 'python': {
                const s = escapeForDoubleQuotes(selector);
                const t = escapeForDoubleQuotes(text);
                return {
                    click: `await page.click("${s}")`,
                    type_text: `await page.fill("${s}", "${t}")`,
                    type: `await page.fill("${s}", "${t}")`,
                    hover: `await page.hover("${s}")`,
                    scroll: `await page.mouse.wheel(${params.deltaX || 0}, ${params.deltaY || 500})`,
                    press_key: `await page.keyboard.press("${params.key || ''}")`,
                }[params.actionType || params.type];
            }
            case 'java': {
                const s = escapeForDoubleQuotes(selector);
                const t = escapeForDoubleQuotes(text);
                return {
                    click: `page.click("${s}");`,
                    type_text: `page.fill("${s}", "${t}");`,
                    type: `page.fill("${s}", "${t}");`,
                    hover: `page.hover("${s}");`,
                    scroll: `page.mouse().wheel(${params.deltaX || 0}, ${params.deltaY || 500});`,
                    press_key: `page.keyboard().press("${params.key || ''}");`,
                }[params.actionType || params.type];
            }
            case 'csharp': {
                const s = escapeForDoubleQuotes(selector);
                const t = escapeForDoubleQuotes(text);
                return {
                    click: `await page.ClickAsync("${s}");`,
                    type_text: `await page.FillAsync("${s}", "${t}");`,
                    type: `await page.FillAsync("${s}", "${t}");`,
                    hover: `await page.HoverAsync("${s}");`,
                    scroll: `await page.Mouse.WheelAsync(${params.deltaX || 0}, ${params.deltaY || 500});`,
                    press_key: `await page.Keyboard.PressAsync("${params.key || ''}");`,
                }[params.actionType || params.type];
            }
            default:
                return `// interaction not implemented for ${lang}`;
        }
    },
};
