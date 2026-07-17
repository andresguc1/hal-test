/**
 * Mapper for wait states.
 */
export const WaitMapper = {
    type: ['wait_fixed', 'wait_visible', 'wait_for_element', 'wait_network', 'wait_network_match'],

    getCode: (params, lang, index, framework = 'playwright') => {
        const selector = params.selector || '';
        const timeout = params.timeout || 30000;

        if (framework.toLowerCase() === 'cypress') {
            return (
                {
                    wait_fixed: `cy.wait(${params.ms || timeout || 1000});`,
                    wait_visible: `cy.get('${selector}', { timeout: ${timeout} }).should('be.visible');`,
                    wait_for_element: `cy.get('${selector}', { timeout: ${timeout} }).should('exist');`,
                    wait_network: `// Cypress waits for network automatically, or use cy.wait() for aliases`,
                    wait_network_match: params.urlMatch
                        ? `cy.intercept('${params.urlMatch}').as('netWait_${index}');\ncy.wait('@netWait_${index}');`
                        : '// Network wait skipped: no URL pattern provided',
                }[params.actionType || params.type] || `// wait action not implemented for Cypress`
            );
        }

        if (framework.toLowerCase() === 'selenium') {
            if (lang.toLowerCase() === 'python') {
                return (
                    {
                        wait_fixed: `time.sleep(${(params.ms || timeout || 1000) / 1000})`,
                        wait_visible: `WebDriverWait(driver, ${timeout / 1000}).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "${selector}")))`,
                        wait_for_element: `WebDriverWait(driver, ${timeout / 1000}).until(EC.presence_of_element_located((By.CSS_SELECTOR, "${selector}")))`,
                        wait_network: `# Selenium has no native networkidle wait. Using explicit sleep or selector wait.`,
                        wait_network_match: `# Network request matching not supported natively in Selenium`,
                    }[params.actionType || params.type] ||
                    `# wait action not implemented for Selenium Python`
                );
            }
            if (lang.toLowerCase() === 'java') {
                return (
                    {
                        wait_fixed: `try { Thread.sleep(${params.ms || timeout || 1000}); } catch (InterruptedException e) { e.printStackTrace(); }`,
                        wait_visible: `new WebDriverWait(driver, Duration.ofMillis(${timeout})).until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("${selector}")));`,
                        wait_for_element: `new WebDriverWait(driver, Duration.ofMillis(${timeout})).until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("${selector}")));`,
                        wait_network: `// Selenium has no native networkidle wait. Using explicit sleep or selector wait.`,
                        wait_network_match: `// Network request matching not supported natively in Selenium Java`,
                    }[params.actionType || params.type] ||
                    `// wait action not implemented for Selenium Java`
                );
            }
            return `// wait not implemented for Selenium in ${lang}`;
        }

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    wait_fixed: `await page.waitForTimeout(${params.ms || timeout || 1000});`,
                    wait_visible: `await page.waitForSelector('${selector}', { state: 'visible', timeout: ${timeout} });`,
                    wait_for_element: `await page.waitForSelector('${selector}', { state: 'attached', timeout: ${timeout} });`,
                    wait_network: "await page.waitForLoadState('networkidle');",
                    wait_network_match: params.urlMatch
                        ? `await page.waitForResponse(response => response.url().includes('${params.urlMatch}'));`
                        : '// Network wait skipped: no URL pattern provided',
                }[params.actionType || params.type];
            case 'python':
                return {
                    wait_fixed: `await page.wait_for_timeout(${params.ms || timeout || 1000})`,
                    wait_visible: `await page.wait_for_selector("${selector}", state="visible", timeout=${timeout})`,
                    wait_for_element: `await page.wait_for_selector("${selector}", state="attached", timeout=${timeout})`,
                    wait_network: "await page.wait_for_load_state('networkidle')",
                    wait_network_match: params.urlMatch
                        ? `await page.wait_for_response(lambda response: "${params.urlMatch}" in response.url)`
                        : '# Network wait skipped: no URL pattern provided',
                }[params.actionType || params.type];
            case 'java':
                return {
                    wait_fixed: `page.waitForTimeout(${params.ms || timeout || 1000});`,
                    wait_visible: `page.waitForSelector("${selector}", new Page.WaitForSelectorOptions().setState(ElementState.VISIBLE).setTimeout(${timeout}));`,
                    wait_for_element: `page.waitForSelector("${selector}", new Page.WaitForSelectorOptions().setState(ElementState.ATTACHED).setTimeout(${timeout}));`,
                    wait_network: 'page.waitForLoadState(LoadState.NETWORKIDLE);',
                    wait_network_match: params.urlMatch
                        ? `page.waitForResponse(response -> response.url().contains("${params.urlMatch}"));`
                        : '// Network wait skipped: no URL pattern provided',
                }[params.actionType || params.type];
            case 'csharp':
                return {
                    wait_fixed: `await page.WaitForTimeoutAsync(${params.ms || timeout || 1000});`,
                    wait_visible: `await page.WaitForSelectorAsync("${selector}", new PageWaitForSelectorOptions { State = WaitForSelectorState.Visible, Timeout = ${timeout} });`,
                    wait_for_element: `await page.WaitForSelectorAsync("${selector}", new PageWaitForSelectorOptions { State = WaitForSelectorState.Attached, Timeout = ${timeout} });`,
                    wait_network: 'await page.WaitForLoadStateAsync(LoadState.NetworkIdle);',
                    wait_network_match: params.urlMatch
                        ? `await page.WaitForResponseAsync(response => response.Url.Contains("${params.urlMatch}"));`
                        : '// Network wait skipped: no URL pattern provided',
                }[params.actionType || params.type];
            default:
                return `// wait not implemented for ${lang}`;
        }
    },
};
