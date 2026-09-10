/**
 * Mapper for assertion / validation nodes.
 * Covers: validate_semantic, assertion (future)
 *
 * Note: validate_semantic in HalTest uses AI-powered validation at runtime.
 * When exporting to Playwright, we translate to the closest native assertion.
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

export const AssertionMapper = {
    type: ['validate_semantic', 'assertion', 'assert_page_text', 'assert'],

    getCode: (params, lang, index, framework = 'playwright') => {
        const action = params.actionType || params.type;

        if (framework.toLowerCase() === 'cypress') {
            if (action === 'assert_page_text') {
                const textToFind = escapeForTemplateLiteral(params.textToFind || '');
                return `cy.contains(\`${textToFind}\`).should('exist');`;
            }

            if (action === 'assert') {
                const assertions = params.assertions || [];
                const target = params.target || {};
                const selector = escapeForTemplateLiteral(target.selector || '');
                const scope = target.scope || 'element';

                if (scope === 'page') {
                    return assertions
                        .map((a) => {
                            if (a.type === 'page' && a.operator.startsWith('url_')) {
                                return `cy.url().should('${a.operator === 'url_contains' ? 'include' : 'not.include'}', \`${escapeForTemplateLiteral(a.expected || '')}\`);`;
                            }
                            if (a.type === 'page' && a.operator.startsWith('title_')) {
                                return `cy.title().should('${a.operator === 'title_contains' ? 'include' : 'not.include'}', \`${escapeForTemplateLiteral(a.expected || '')}\`);`;
                            }
                            return `// unsupported page assertion for Cypress`;
                        })
                        .join('\n    ');
                }

                return assertions
                    .map((a) => {
                        const s = selector;
                        const e = escapeForTemplateLiteral(String(a.expected ?? a.value ?? ''));
                        switch (a.type) {
                            case 'existence':
                                return a.operator === 'not_exists'
                                    ? `cy.get(\`${s}\`).should('not.exist');`
                                    : `cy.get(\`${s}\`).should('exist');`;
                            case 'visibility':
                                return a.operator === 'hidden'
                                    ? `cy.get(\`${s}\`).should('not.be.visible');`
                                    : `cy.get(\`${s}\`).should('be.visible');`;
                            case 'text':
                                if (a.operator === 'contains')
                                    return `cy.get(\`${s}\`).should('contain', \`${e}\`);`;
                                if (a.operator === 'equals')
                                    return `cy.get(\`${s}\`).should('have.text', \`${e}\`);`;
                                return `cy.get(\`${s}\`).should('contain', \`${e}\`);`;
                            case 'count':
                                return `cy.get(\`${s}\`).should('have.length', ${Number(a.expected)});`;
                            case 'attribute':
                                return `cy.get(\`${s}\`).should('have.attr', \`${escapeForTemplateLiteral(a.attribute ?? '')}\`, \`${e}\`);`;
                            case 'value':
                                return `cy.get(\`${s}\`).should('have.value', \`${e}\`);`;
                            case 'state':
                                if (a.operator === 'checked')
                                    return `cy.get(\`${s}\`).should('be.checked');`;
                                if (a.operator === 'enabled')
                                    return `cy.get(\`${s}\`).should('be.enabled');`;
                                if (a.operator === 'disabled')
                                    return `cy.get(\`${s}\`).should('be.disabled');`;
                                return `cy.get(\`${s}\`).should('be.visible');`;
                            default:
                                return `// unsupported assertion type for Cypress: ${a.type}`;
                        }
                    })
                    .join('\n    ');
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
                        const rawText = textToFind.replace(/"/g, '\\"');
                        return `expect(page.locator("body")).to_contain_text(re.compile(r"${rawText}"${flags})${optStr})`;
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

        // Handle unified 'assert' node with multiple assertions
        if (action === 'assert') {
            const assertions = params.assertions || [];
            const softFail = params.softFail === true || params.softFail === 'true';
            const timeout = params.timeout !== undefined ? Number(params.timeout) : 5000;
            const target = params.target || {};
            const selector = escapeForTemplateLiteral(target.selector || '');
            const scope = target.scope || 'element';

            const getLocator = () => {
                if (scope === 'page') return 'page';
                return `page.locator(\`${selector}\`)`;
            };

            const mapAssertion = (assertion) => {
                const type = assertion.type;
                const operator = assertion.operator;
                const expected = assertion.expected ?? assertion.value;
                const attribute = assertion.attribute;
                const cssProperty = assertion.cssProperty || assertion.property;
                const caseSensitive = assertion.caseSensitive === true;
                const isRegex = assertion.regex === true;
                const regexFlags = assertion.regexFlags || '';
                const min = assertion.min;
                const max = assertion.max;

                const expectPrefix = softFail ? 'expect.soft' : 'expect';
                const timeoutOpt = timeout !== 5000 ? `, { timeout: ${timeout} }` : '';
                const locator = getLocator();

                switch (lang.toLowerCase()) {
                    case 'javascript':
                    case 'typescript': {
                        const escape = (str) => escapeForTemplateLiteral(String(str ?? ''));
                        const escapeRegex = (str) => escapeForTemplateLiteral(String(str ?? ''));

                        switch (type) {
                            case 'existence':
                                if (operator === 'not_exists')
                                    return `await ${expectPrefix}(${locator}).not.toBeAttached()${timeoutOpt};`;
                                return `await ${expectPrefix}(${locator}).toBeAttached()${timeoutOpt};`;

                            case 'visibility':
                                if (operator === 'hidden')
                                    return `await ${expectPrefix}(${locator}).toBeHidden()${timeoutOpt};`;
                                return `await ${expectPrefix}(${locator}).toBeVisible()${timeoutOpt};`;

                            case 'text': {
                                const text = escape(expected);
                                if (operator === 'empty')
                                    return `await ${expectPrefix}(${locator}).toHaveText('')${timeoutOpt};`;
                                if (operator === 'not_empty')
                                    return `await ${expectPrefix}(${locator}).not.toHaveText('')${timeoutOpt};`;
                                if (operator === 'equals')
                                    return `await ${expectPrefix}(${locator}).toHaveText(\`${text}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                if (operator === 'not_equals')
                                    return `await ${expectPrefix}(${locator}).not.toHaveText(\`${text}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                if (operator === 'contains')
                                    return `await ${expectPrefix}(${locator}).toContainText(\`${text}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                if (operator === 'not_contains')
                                    return `await ${expectPrefix}(${locator}).not.toContainText(\`${text}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                if (isRegex || operator === 'regex') {
                                    const flags = caseSensitive ? regexFlags : regexFlags + 'i';
                                    return `await ${expectPrefix}(${locator}).toMatchText(new RegExp(\`${escapeRegex(expected)}\`, '${flags}')${timeoutOpt});`;
                                }
                                if (operator === 'not_regex') {
                                    const flags = caseSensitive ? regexFlags : regexFlags + 'i';
                                    return `await ${expectPrefix}(${locator}).not.toMatchText(new RegExp(\`${escapeRegex(expected)}\`, '${flags}')${timeoutOpt});`;
                                }
                                return `await ${expectPrefix}(${locator}).toContainText(\`${text}\`)${timeoutOpt};`;
                            }

                            case 'count': {
                                const count = Number(expected);
                                if (operator === 'equals')
                                    return `await ${expectPrefix}(${locator}).toHaveCount(${count})${timeoutOpt};`;
                                if (operator === 'not_equals')
                                    return `await ${expectPrefix}(${locator}).not.toHaveCount(${count})${timeoutOpt};`;
                                if (operator === 'between')
                                    return `await ${expectPrefix}(${locator}).toHaveCount(${min}, ${max})${timeoutOpt};`;
                                // Playwright doesn't have direct gt/lt for count, use toHaveCount
                                return `await ${expectPrefix}(${locator}).toHaveCount(${count})${timeoutOpt};`;
                            }

                            case 'attribute': {
                                if (!attribute) return `// missing attribute name`;
                                const attrName = escapeForTemplateLiteral(attribute);
                                if (operator === 'empty')
                                    return `await ${expectPrefix}(${locator}).not.toHaveAttribute(\`${attrName}\`)${timeoutOpt};`;
                                if (operator === 'not_empty')
                                    return `await ${expectPrefix}(${locator}).toHaveAttribute(\`${attrName}\`)${timeoutOpt};`;
                                const attrVal = escape(expected);
                                if (operator === 'equals')
                                    return `await ${expectPrefix}(${locator}).toHaveAttribute(\`${attrName}\`, \`${attrVal}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                if (operator === 'contains')
                                    return `await ${expectPrefix}(${locator}).toHaveAttribute(\`${attrName}\`, \`${attrVal}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                return `await ${expectPrefix}(${locator}).toHaveAttribute(\`${attrName}\`, \`${attrVal}\`)${timeoutOpt};`;
                            }

                            case 'value': {
                                if (operator === 'empty')
                                    return `await ${expectPrefix}(${locator}).toHaveValue('')${timeoutOpt};`;
                                if (operator === 'not_empty')
                                    return `await ${expectPrefix}(${locator}).not.toHaveValue('')${timeoutOpt};`;
                                const val = escape(expected);
                                if (operator === 'equals')
                                    return `await ${expectPrefix}(${locator}).toHaveValue(\`${val}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                if (operator === 'contains')
                                    return `await ${expectPrefix}(${locator}).toHaveValue(\`${val}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                return `await ${expectPrefix}(${locator}).toHaveValue(\`${val}\`)${timeoutOpt};`;
                            }

                            case 'state': {
                                const stateMap = {
                                    enabled: 'toBeEnabled',
                                    disabled: 'toBeDisabled',
                                    checked: 'toBeChecked',
                                    unchecked: 'not.toBeChecked',
                                };
                                const method = stateMap[operator] || 'toBeVisible';
                                if (method.startsWith('not.')) {
                                    return `await ${expectPrefix}(${locator}).${method.replace('not.', '')}()${timeoutOpt};`;
                                }
                                return `await ${expectPrefix}(${locator}).${method}()${timeoutOpt};`;
                            }

                            case 'css_property': {
                                if (!cssProperty) return `// missing cssProperty name`;
                                const prop = escapeForTemplateLiteral(cssProperty);
                                const cssVal = escape(expected);
                                if (operator === 'equals')
                                    return `await ${expectPrefix}(${locator}).toHaveCSS(\`${prop}\`, \`${cssVal}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                if (operator === 'contains')
                                    return `await ${expectPrefix}(${locator}).toHaveCSS(\`${prop}\`, \`${cssVal}\`${caseSensitive ? '' : ', { ignoreCase: true }'})${timeoutOpt};`;
                                return `await ${expectPrefix}(${locator}).toHaveCSS(\`${prop}\`, \`${cssVal}\`)${timeoutOpt};`;
                            }

                            case 'page': {
                                const pageObj = 'page';
                                if (operator.startsWith('url_')) {
                                    if (operator === 'url_equals')
                                        return `await ${expectPrefix}(${pageObj}).toHaveURL(\`${escape(expected)}\`)${timeoutOpt};`;
                                    if (operator === 'url_not_equals')
                                        return `await ${expectPrefix}(${pageObj}).not.toHaveURL(\`${escape(expected)}\`)${timeoutOpt};`;
                                    if (operator === 'url_contains') {
                                        const pattern = escapeRegex(expected).replace(/^\/+/, '');
                                        return `await ${expectPrefix}(${pageObj}).toHaveURL(new RegExp(\`${pattern}\`))${timeoutOpt};`;
                                    }
                                    if (operator === 'url_not_contains') {
                                        const pattern = escapeRegex(expected).replace(/^\/+/, '');
                                        return `await ${expectPrefix}(${pageObj}).not.toHaveURL(new RegExp(\`${pattern}\`))${timeoutOpt};`;
                                    }
                                    if (isRegex || operator === 'url_regex') {
                                        const flags = caseSensitive ? regexFlags : regexFlags + 'i';
                                        return `await ${expectPrefix}(${pageObj}).toHaveURL(new RegExp(\`${escapeRegex(expected)}\`, '${flags}')${timeoutOpt});`;
                                    }
                                }
                                if (operator.startsWith('title_')) {
                                    if (operator === 'title_equals')
                                        return `await ${expectPrefix}(${pageObj}).toHaveTitle(\`${escape(expected)}\`)${timeoutOpt};`;
                                    if (operator === 'title_not_equals')
                                        return `await ${expectPrefix}(${pageObj}).not.toHaveTitle(\`${escape(expected)}\`)${timeoutOpt};`;
                                    if (operator === 'title_contains')
                                        return `await ${expectPrefix}(${pageObj}).toHaveTitle(new RegExp(\`${escapeRegex(expected)}\`))${timeoutOpt};`;
                                    if (operator === 'title_not_contains')
                                        return `await ${expectPrefix}(${pageObj}).not.toHaveTitle(new RegExp(\`${escapeRegex(expected)}\`))${timeoutOpt};`;
                                    if (isRegex || operator === 'title_regex') {
                                        const flags = caseSensitive ? regexFlags : regexFlags + 'i';
                                        return `await ${expectPrefix}(${pageObj}).toHaveTitle(new RegExp(\`${escapeRegex(expected)}\`, '${flags}')${timeoutOpt});`;
                                    }
                                }
                                return `// unsupported page operator: ${operator}`;
                            }

                            default:
                                return `// unsupported assertion type: ${type}:${operator}`;
                        }
                    }
                    case 'python': {
                        const escapePy = (str) => escapeForDoubleQuotes(String(str ?? ''));
                        const loc =
                            scope === 'page'
                                ? 'page'
                                : `page.locator("${escapeForDoubleQuotes(target.selector || '')}")`;
                        const expectPref = softFail ? 'expect_soft' : 'expect';
                        const timeoutPy = timeout !== 5000 ? `, timeout=${timeout}` : '';

                        switch (type) {
                            case 'existence':
                                if (operator === 'not_exists')
                                    return `await ${expectPref}(${loc}).not.to_be_attached()${timeoutPy}`;
                                return `await ${expectPref}(${loc}).to_be_attached()${timeoutPy}`;

                            case 'visibility':
                                if (operator === 'hidden')
                                    return `await ${expectPref}(${loc}).to_be_hidden()${timeoutPy}`;
                                return `await ${expectPref}(${loc}).to_be_visible()${timeoutPy}`;

                            case 'text': {
                                const text = escapePy(expected);
                                if (operator === 'empty')
                                    return `await ${expectPref}(${loc}).to_have_text('')${timeoutPy}`;
                                if (operator === 'equals')
                                    return `await ${expectPref}(${loc}).to_have_text("${text}"${!caseSensitive ? ', ignore_case=True' : ''})${timeoutPy}`;
                                if (operator === 'contains')
                                    return `await ${expectPref}(${loc}).to_contain_text("${text}"${!caseSensitive ? ', ignore_case=True' : ''})${timeoutPy}`;
                                if (isRegex || operator === 'regex') {
                                    const flags = !caseSensitive ? ', re.IGNORECASE' : '';
                                    return `await ${expectPref}(${loc}).to_match_text(re.compile(r"${escapePy(expected)}"${flags}))${timeoutPy}`;
                                }
                                return `await ${expectPref}(${loc}).to_contain_text("${text}")${timeoutPy}`;
                            }

                            case 'count': {
                                const count = Number(expected);
                                if (operator === 'equals')
                                    return `await ${expectPref}(${loc}).to_have_count(${count})${timeoutPy}`;
                                if (operator === 'between')
                                    return `await ${expectPref}(${loc}).to_have_count(${min}, ${max})${timeoutPy}`;
                                return `await ${expectPref}(${loc}).to_have_count(${count})${timeoutPy}`;
                            }

                            case 'attribute': {
                                if (!attribute) return `# missing attribute name`;
                                const attrN = escapePy(attribute);
                                if (operator === 'empty')
                                    return `await ${expectPref}(${loc}).not.to_have_attribute("${attrN}")${timeoutPy}`;
                                if (operator === 'equals')
                                    return `await ${expectPref}(${loc}).to_have_attribute("${attrN}", "${escapePy(expected)}"${!caseSensitive ? ', ignore_case=True' : ''})${timeoutPy}`;
                                return `await ${expectPref}(${loc}).to_have_attribute("${attrN}", "${escapePy(expected)}")${timeoutPy}`;
                            }

                            case 'value': {
                                if (operator === 'empty')
                                    return `await ${expectPref}(${loc}).to_have_value('')${timeoutPy}`;
                                if (operator === 'equals')
                                    return `await ${expectPref}(${loc}).to_have_value("${escapePy(expected)}"${!caseSensitive ? ', ignore_case=True' : ''})${timeoutPy}`;
                                return `await ${expectPref}(${loc}).to_have_value("${escapePy(expected)}")${timeoutPy}`;
                            }

                            case 'state': {
                                const stateMap = {
                                    enabled: 'to_be_enabled',
                                    disabled: 'to_be_disabled',
                                    checked: 'to_be_checked',
                                };
                                const method = stateMap[operator] || 'to_be_visible';
                                return `await ${expectPref}(${loc}).${method}()${timeoutPy}`;
                            }

                            case 'page': {
                                if (operator.startsWith('url_')) {
                                    if (operator === 'url_equals')
                                        return `await ${expectPref}(page).to_have_url("${escapePy(expected)}")${timeoutPy}`;
                                    if (operator === 'url_contains')
                                        return `await ${expectPref}(page).to_have_url(re.compile("${escapePy(expected)}"))${timeoutPy}`;
                                }
                                if (operator.startsWith('title_')) {
                                    if (operator === 'title_equals')
                                        return `await ${expectPref}(page).to_have_title("${escapePy(expected)}")${timeoutPy}`;
                                    if (operator === 'title_contains')
                                        return `await ${expectPref}(page).to_have_title(re.compile("${escapePy(expected)}"))${timeoutPy}`;
                                }
                                return `# unsupported page operator: ${operator}`;
                            }

                            default:
                                return `# unsupported assertion type: ${type}:${operator}`;
                        }
                    }
                    default:
                        return `// unsupported language for assert: ${lang}`;
                }
            };

            if (assertions.length === 0) return `// no assertions`;

            return assertions.map((a, i) => mapAssertion(a, i)).join('\n    ');
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
