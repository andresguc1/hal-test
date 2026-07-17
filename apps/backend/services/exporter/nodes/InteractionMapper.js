/**
 * Mapper for user interactions.
 */
export const InteractionMapper = {
    type: ['click', 'type_text', 'type', 'hover', 'scroll', 'press_key'],

    getCode: (params, lang, index, framework = 'playwright') => {
        const selector = params.selector || '';
        const text = params.text || '';

        if (framework.toLowerCase() === 'cypress') {
            return (
                {
                    click: `cy.get(\`${selector}\`).click();`,
                    type_text: `cy.get(\`${selector}\`).type(\`${text}\`);`,
                    type: `cy.get(\`${selector}\`).type(\`${text}\`);`,
                    hover: `cy.get(\`${selector}\`).trigger('mouseover');`,
                    scroll: `cy.scrollTo(${params.deltaX || 0}, ${params.deltaY || 500});`,
                    press_key: `cy.get('body').type(\`{${params.key || ''}}\`);`,
                }[params.actionType || params.type] || `// action not implemented for Cypress`
            );
        }

        if (framework.toLowerCase() === 'selenium') {
            if (lang.toLowerCase() === 'python') {
                return (
                    {
                        click: `driver.find_element(By.CSS_SELECTOR, "${selector}").click()`,
                        type_text: `driver.find_element(By.CSS_SELECTOR, "${selector}").send_keys("${text}")`,
                        type: `driver.find_element(By.CSS_SELECTOR, "${selector}").send_keys("${text}")`,
                        hover: `from selenium.webdriver.common.action_chains import ActionChains\n        element = driver.find_element(By.CSS_SELECTOR, "${selector}")\n        ActionChains(driver).move_to_element(element).perform()`,
                        scroll: `driver.execute_script("window.scrollBy(${params.deltaX || 0}, ${params.deltaY || 500});")`,
                        press_key: `driver.find_element(By.TAG_NAME, "body").send_keys(Keys.${(params.key || '').toUpperCase()})`,
                    }[params.actionType || params.type] ||
                    `# action not implemented for Selenium Python`
                );
            }
            if (lang.toLowerCase() === 'java') {
                return (
                    {
                        click: `driver.findElement(By.cssSelector("${selector}")).click();`,
                        type_text: `driver.findElement(By.cssSelector("${selector}")).sendKeys("${text}");`,
                        type: `driver.findElement(By.cssSelector("${selector}")).sendKeys("${text}");`,
                        hover: `new Actions(driver).moveToElement(driver.findElement(By.cssSelector("${selector}"))).perform();`,
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
