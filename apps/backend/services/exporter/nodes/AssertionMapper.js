/**
 * Mapper for assertion / validation nodes.
 * Covers: validate_semantic, assertion (future)
 *
 * Note: validate_semantic in HalTest uses AI-powered validation at runtime.
 * When exporting to Playwright, we translate to the closest native assertion.
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

export const AssertionMapper = {
    type: ['validate_semantic', 'assertion', 'assert_page_text'],

    getCode: (params, lang, index, framework = 'playwright') => {
        const action = params.actionType || params.type;

        if (framework.toLowerCase() === 'cypress') {
            if (action === 'assert_page_text') {
                const textToFind = escapeForTemplateLiteral(params.textToFind || '');
                return `cy.contains(\`${textToFind}\`).should('exist');`;
            }

            const s = escapeForTemplateLiteral(params.selector || '');
            const e = escapeForTemplateLiteral(
                params.expected || params.text || params.value || '',
            );
            const assertType = params.assertionType || params.assertType || 'text_contains';

            const cypressAssertion = () => {
                switch (assertType) {
                    case 'text_equals':
                        return `cy.get(\`${s}\`).should('have.text', \`${e}\`);`;
                    case 'text_contains':
                        return `cy.get(\`${s}\`).should('contain', \`${e}\`);`;
                    case 'visible':
                        return `cy.get(\`${s}\`).should('be.visible');`;
                    case 'hidden':
                        return `cy.get(\`${s}\`).should('not.be.visible');`;
                    case 'enabled':
                        return `cy.get(\`${s}\`).should('be.enabled');`;
                    case 'disabled':
                        return `cy.get(\`${s}\`).should('be.disabled');`;
                    case 'has_attribute':
                        return `cy.get(\`${s}\`).should('have.attr', \`${escapeForTemplateLiteral(params.attribute || '')}\`, \`${e}\`);`;
                    case 'url_contains':
                        return `cy.url().should('include', \`${e}\`);`;
                    case 'title_contains':
                        return `cy.title().should('include', \`${e}\`);`;
                    default:
                        return `cy.get(\`${s}\`).should('contain', \`${e}\`);`;
                }
            };

            if (action === 'validate_semantic') {
                return `// HalTest AI Validation → translated to Cypress assertion\n    ${cypressAssertion()}`;
            }
            return cypressAssertion();
        }

        if (framework.toLowerCase() === 'selenium') {
            const s = escapeForDoubleQuotes(params.selector || '');
            const e = escapeForDoubleQuotes(params.expected || params.text || params.value || '');
            const assertType = params.assertionType || params.assertType || 'text_contains';

            if (lang.toLowerCase() === 'python') {
                if (action === 'assert_page_text') {
                    const textToFind = escapeForDoubleQuotes(params.textToFind || '');
                    return `self.assertIn("${textToFind}", driver.page_source)`;
                }

                const seleniumAssertion = () => {
                    switch (assertType) {
                        case 'text_equals':
                            return `self.assertEqual(driver.find_element(By.CSS_SELECTOR, "${s}").text, "${e}")`;
                        case 'text_contains':
                            return `self.assertIn("${e}", driver.find_element(By.CSS_SELECTOR, "${s}").text)`;
                        case 'visible':
                            return `self.assertTrue(driver.find_element(By.CSS_SELECTOR, "${s}").is_displayed())`;
                        case 'hidden':
                            return `self.assertFalse(driver.find_element(By.CSS_SELECTOR, "${s}").is_displayed())`;
                        case 'enabled':
                            return `self.assertTrue(driver.find_element(By.CSS_SELECTOR, "${s}").is_enabled())`;
                        case 'disabled':
                            return `self.assertFalse(driver.find_element(By.CSS_SELECTOR, "${s}").is_enabled())`;
                        case 'has_attribute':
                            return `self.assertEqual(driver.find_element(By.CSS_SELECTOR, "${s}").get_attribute("${escapeForDoubleQuotes(params.attribute || '')}"), "${e}")`;
                        case 'url_contains':
                            return `self.assertIn("${e}", driver.current_url)`;
                        case 'title_contains':
                            return `self.assertIn("${e}", driver.title)`;
                        default:
                            return `self.assertIn("${e}", driver.find_element(By.CSS_SELECTOR, "${s}").text)`;
                    }
                };

                if (action === 'validate_semantic') {
                    return `# HalTest AI Validation → translated to Selenium assertion\n    ${seleniumAssertion()}`;
                }
                return seleniumAssertion();
            }

            if (lang.toLowerCase() === 'java') {
                if (action === 'assert_page_text') {
                    const textToFind = escapeForDoubleQuotes(params.textToFind || '');
                    return `org.junit.jupiter.api.Assertions.assertTrue(driver.getPageSource().contains("${textToFind}"));`;
                }

                const seleniumAssertion = () => {
                    switch (assertType) {
                        case 'text_equals':
                            return `org.junit.jupiter.api.Assertions.assertEquals("${e}", driver.findElement(By.cssSelector("${s}")).getText());`;
                        case 'text_contains':
                            return `org.junit.jupiter.api.Assertions.assertTrue(driver.findElement(By.cssSelector("${s}")).getText().contains("${e}"));`;
                        case 'visible':
                            return `org.junit.jupiter.api.Assertions.assertTrue(driver.findElement(By.cssSelector("${s}")).isDisplayed());`;
                        case 'hidden':
                            return `org.junit.jupiter.api.Assertions.assertFalse(driver.findElement(By.cssSelector("${s}")).isDisplayed());`;
                        case 'enabled':
                            return `org.junit.jupiter.api.Assertions.assertTrue(driver.findElement(By.cssSelector("${s}")).isEnabled());`;
                        case 'disabled':
                            return `org.junit.jupiter.api.Assertions.assertFalse(driver.findElement(By.cssSelector("${s}")).isEnabled());`;
                        case 'has_attribute':
                            return `org.junit.jupiter.api.Assertions.assertEquals("${e}", driver.findElement(By.cssSelector("${s}")).getAttribute("${escapeForDoubleQuotes(params.attribute || '')}"));`;
                        case 'url_contains':
                            return `org.junit.jupiter.api.Assertions.assertTrue(driver.getCurrentUrl().contains("${e}"));`;
                        case 'title_contains':
                            return `org.junit.jupiter.api.Assertions.assertTrue(driver.getTitle().contains("${e}"));`;
                        default:
                            return `org.junit.jupiter.api.Assertions.assertTrue(driver.findElement(By.cssSelector("${s}")).getText().contains("${e}"));`;
                    }
                };

                if (action === 'validate_semantic') {
                    return `// HalTest AI Validation → translated to Selenium Java assertion\n    ${seleniumAssertion()}`;
                }
                return seleniumAssertion();
            }

            return `// assertion not implemented for Selenium in ${lang}`;
        }

        if (action === 'assert_page_text') {
            const textToFind = params.textToFind || '';
            const matchType = params.matchType || 'contains';
            const caseSensitive = params.caseSensitive === true || params.caseSensitive === 'true';
            const timeout = params.timeout !== undefined ? Number(params.timeout) : 5000;

            switch (lang.toLowerCase()) {
                case 'javascript':
                case 'typescript': {
                    const options = [];
                    if (matchType === 'exact') options.push('exact: true');
                    if (!caseSensitive) options.push('ignoreCase: true');
                    if (timeout !== 5000) options.push(`timeout: ${timeout}`);
                    const optStr = options.length > 0 ? `, { ${options.join(', ')} }` : '';

                    if (matchType === 'regex') {
                        const flags = caseSensitive ? '' : 'i';
                        return `await expect(page.locator('body')).toContainText(new RegExp(\`${escapeForTemplateLiteral(textToFind)}\`, '${flags}')${optStr});`;
                    } else {
                        return `await expect(page.locator('body')).toContainText(\`${escapeForTemplateLiteral(textToFind)}\`${optStr});`;
                    }
                }
                case 'python': {
                    const options = [];
                    if (matchType === 'exact') options.push('exact=True');
                    if (!caseSensitive) options.push('ignore_case=True');
                    if (timeout !== 5000) options.push(`timeout=${timeout}`);
                    const optStr = options.length > 0 ? `, ${options.join(', ')}` : '';

                    if (matchType === 'regex') {
                        const flags = !caseSensitive ? ', re.IGNORECASE' : '';
                        return `expect(page.locator("body")).to_contain_text(re.compile(r"${escapeForDoubleQuotes(textToFind)}"${flags})${optStr})`;
                    } else {
                        return `expect(page.locator("body")).to_contain_text("${escapeForDoubleQuotes(textToFind)}"${optStr})`;
                    }
                }
                case 'java': {
                    const options = [];
                    if (matchType === 'exact') options.push('.setExact(true)');
                    if (!caseSensitive) options.push('.setIgnoreCase(true)');
                    if (timeout !== 5000) options.push(`.setTimeout(${timeout})`);
                    const optStr =
                        options.length > 0
                            ? `, new Locator.ContainsTextOptions()${options.join('')}`
                            : '';

                    if (matchType === 'regex') {
                        const flags = !caseSensitive ? 'Pattern.CASE_INSENSITIVE' : '0';
                        return `assertThat(page.locator("body")).containsText(Pattern.compile("${escapeForDoubleQuotes(textToFind)}", ${flags})${optStr});`;
                    } else {
                        return `assertThat(page.locator("body")).containsText("${escapeForDoubleQuotes(textToFind)}"${optStr});`;
                    }
                }
                case 'csharp': {
                    const options = [];
                    if (matchType === 'exact') options.push('Exact = true');
                    if (!caseSensitive) options.push('IgnoreCase = true');
                    if (timeout !== 5000) options.push(`Timeout = ${timeout}`);
                    const optStr = options.length > 0 ? `, new() { ${options.join(', ')} }` : '';

                    if (matchType === 'regex') {
                        const flags = !caseSensitive ? ', RegexOptions.IgnoreCase' : '';
                        return `await Expect(page.Locator("body")).ToContainTextAsync(new Regex(@"${escapeForDoubleQuotes(textToFind)}"${flags})${optStr});`;
                    } else {
                        return `await Expect(page.Locator("body")).ToContainTextAsync("${escapeForDoubleQuotes(textToFind)}"${optStr});`;
                    }
                }
                default:
                    return `// assertion not implemented for ${lang}`;
            }
        }

        const s = escapeForTemplateLiteral(params.selector || '');
        const e = escapeForTemplateLiteral(params.expected || params.text || params.value || '');
        const assertType = params.assertionType || params.assertType || 'text_contains';

        // Build assertion based on type
        const getAssertion = () => {
            switch (lang.toLowerCase()) {
                case 'javascript':
                case 'typescript':
                    switch (assertType) {
                        case 'text_equals':
                            return `await expect(page.locator(\`${s}\`)).toHaveText(\`${e}\`);`;
                        case 'text_contains':
                            return `await expect(page.locator(\`${s}\`)).toContainText(\`${e}\`);`;
                        case 'visible':
                            return `await expect(page.locator(\`${s}\`)).toBeVisible();`;
                        case 'hidden':
                            return `await expect(page.locator(\`${s}\`)).toBeHidden();`;
                        case 'enabled':
                            return `await expect(page.locator(\`${s}\`)).toBeEnabled();`;
                        case 'disabled':
                            return `await expect(page.locator(\`${s}\`)).toBeDisabled();`;
                        case 'has_attribute':
                            return `await expect(page.locator(\`${s}\`)).toHaveAttribute(\`${escapeForTemplateLiteral(params.attribute || '')}\`, \`${e}\`);`;
                        case 'url_contains':
                            return `await expect(page).toHaveURL(/${e}/);`;
                        case 'title_contains':
                            return `await expect(page).toHaveTitle(/${e}/);`;
                        default:
                            return `await expect(page.locator(\`${s}\`)).toContainText(\`${e}\`);`;
                    }

                case 'python': {
                    const sp = escapeForDoubleQuotes(params.selector || '');
                    const ep = escapeForDoubleQuotes(
                        params.expected || params.text || params.value || '',
                    );
                    switch (assertType) {
                        case 'text_equals':
                            return `expect(page.locator("${sp}")).to_have_text("${ep}")`;
                        case 'text_contains':
                            return `expect(page.locator("${sp}")).to_contain_text("${ep}")`;
                        case 'visible':
                            return `expect(page.locator("${sp}")).to_be_visible()`;
                        case 'hidden':
                            return `expect(page.locator("${sp}")).to_be_hidden()`;
                        case 'enabled':
                            return `expect(page.locator("${sp}")).to_be_enabled()`;
                        case 'disabled':
                            return `expect(page.locator("${sp}")).to_be_disabled()`;
                        case 'has_attribute':
                            return `expect(page.locator("${sp}")).to_have_attribute("${escapeForDoubleQuotes(params.attribute || '')}", "${ep}")`;
                        case 'url_contains':
                            return `expect(page).to_have_url(re.compile("${ep}"))`;
                        case 'title_contains':
                            return `expect(page).to_have_title(re.compile("${ep}"))`;
                        default:
                            return `expect(page.locator("${sp}")).to_contain_text("${ep}")`;
                    }
                }

                case 'java': {
                    const sj = escapeForDoubleQuotes(params.selector || '');
                    const ej = escapeForDoubleQuotes(
                        params.expected || params.text || params.value || '',
                    );
                    switch (assertType) {
                        case 'text_equals':
                            return `assertThat(page.locator("${sj}")).hasText("${ej}");`;
                        case 'text_contains':
                            return `assertThat(page.locator("${sj}")).containsText("${ej}");`;
                        case 'visible':
                            return `assertThat(page.locator("${sj}")).isVisible();`;
                        case 'hidden':
                            return `assertThat(page.locator("${sj}")).isHidden();`;
                        case 'enabled':
                            return `assertThat(page.locator("${sj}")).isEnabled();`;
                        case 'disabled':
                            return `assertThat(page.locator("${sj}")).isDisabled();`;
                        default:
                            return `assertThat(page.locator("${sj}")).containsText("${ej}");`;
                    }
                }

                case 'csharp': {
                    const sc = escapeForDoubleQuotes(params.selector || '');
                    const ec = escapeForDoubleQuotes(
                        params.expected || params.text || params.value || '',
                    );
                    switch (assertType) {
                        case 'text_equals':
                            return `await Expect(page.Locator("${sc}")).ToHaveTextAsync("${ec}");`;
                        case 'text_contains':
                            return `await Expect(page.Locator("${sc}")).ToContainTextAsync("${ec}");`;
                        case 'visible':
                            return `await Expect(page.Locator("${sc}")).ToBeVisibleAsync();`;
                        case 'hidden':
                            return `await Expect(page.Locator("${sc}")).ToBeHiddenAsync();`;
                        case 'enabled':
                            return `await Expect(page.Locator("${sc}")).ToBeEnabledAsync();`;
                        case 'disabled':
                            return `await Expect(page.Locator("${sc}")).ToBeDisabledAsync();`;
                        default:
                            return `await Expect(page.Locator("${sc}")).ToContainTextAsync("${ec}");`;
                    }
                }

                default:
                    return `// assertion not implemented for ${lang}`;
            }
        };

        if (action === 'validate_semantic') {
            // Add a comment noting this was an AI-powered validation
            const commentChar = lang.toLowerCase() === 'python' ? '#' : '//';
            const comment = `${commentChar} HalTest AI Validation → translated to Playwright assertion`;
            return `${comment}\n    ${getAssertion()}`;
        }

        return getAssertion();
    },
};
