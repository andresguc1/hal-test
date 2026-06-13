/**
 * Mapper for assertion / validation nodes.
 * Covers: validate_semantic, assertion (future)
 *
 * Note: validate_semantic in HalTest uses AI-powered validation at runtime.
 * When exporting to Playwright, we translate to the closest native assertion.
 */
export const AssertionMapper = {
    type: ['validate_semantic', 'assertion', 'assert_page_text'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;

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
                        return `await expect(page.locator('body')).toContainText(new RegExp(\`${textToFind}\`, '${flags}')${optStr});`;
                    } else {
                        return `await expect(page.locator('body')).toContainText(\`${textToFind}\`${optStr});`;
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
                        return `expect(page.locator("body")).to_contain_text(re.compile(r"${textToFind}"${flags})${optStr})`;
                    } else {
                        return `expect(page.locator("body")).to_contain_text("${textToFind}"${optStr})`;
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
                        return `assertThat(page.locator("body")).containsText(Pattern.compile("${textToFind}", ${flags})${optStr});`;
                    } else {
                        return `assertThat(page.locator("body")).containsText("${textToFind}"${optStr});`;
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
                        return `await Expect(page.Locator("body")).ToContainTextAsync(new Regex(@"${textToFind}"${flags})${optStr});`;
                    } else {
                        return `await Expect(page.Locator("body")).ToContainTextAsync("${textToFind}"${optStr});`;
                    }
                }
                default:
                    return `// assertion not implemented for ${lang}`;
            }
        }

        const selector = params.selector || '';
        const expected = params.expected || params.text || params.value || '';
        const assertType = params.assertionType || params.assertType || 'text_contains';

        // Build assertion based on type
        const getAssertion = () => {
            switch (lang.toLowerCase()) {
                case 'javascript':
                case 'typescript':
                    switch (assertType) {
                        case 'text_equals':
                            return `await expect(page.locator(\`${selector}\`)).toHaveText(\`${expected}\`);`;
                        case 'text_contains':
                            return `await expect(page.locator(\`${selector}\`)).toContainText(\`${expected}\`);`;
                        case 'visible':
                            return `await expect(page.locator(\`${selector}\`)).toBeVisible();`;
                        case 'hidden':
                            return `await expect(page.locator(\`${selector}\`)).toBeHidden();`;
                        case 'enabled':
                            return `await expect(page.locator(\`${selector}\`)).toBeEnabled();`;
                        case 'disabled':
                            return `await expect(page.locator(\`${selector}\`)).toBeDisabled();`;
                        case 'has_attribute':
                            return `await expect(page.locator(\`${selector}\`)).toHaveAttribute(\`${params.attribute || ''}\`, \`${expected}\`);`;
                        case 'url_contains':
                            return `await expect(page).toHaveURL(/${expected}/);`;
                        case 'title_contains':
                            return `await expect(page).toHaveTitle(/${expected}/);`;
                        default:
                            return `await expect(page.locator(\`${selector}\`)).toContainText(\`${expected}\`);`;
                    }

                case 'python':
                    switch (assertType) {
                        case 'text_equals':
                            return `expect(page.locator("${selector}")).to_have_text("${expected}")`;
                        case 'text_contains':
                            return `expect(page.locator("${selector}")).to_contain_text("${expected}")`;
                        case 'visible':
                            return `expect(page.locator("${selector}")).to_be_visible()`;
                        case 'hidden':
                            return `expect(page.locator("${selector}")).to_be_hidden()`;
                        case 'enabled':
                            return `expect(page.locator("${selector}")).to_be_enabled()`;
                        case 'disabled':
                            return `expect(page.locator("${selector}")).to_be_disabled()`;
                        case 'has_attribute':
                            return `expect(page.locator("${selector}")).to_have_attribute("${params.attribute || ''}", "${expected}")`;
                        case 'url_contains':
                            return `expect(page).to_have_url(re.compile("${expected}"))`;
                        case 'title_contains':
                            return `expect(page).to_have_title(re.compile("${expected}"))`;
                        default:
                            return `expect(page.locator("${selector}")).to_contain_text("${expected}")`;
                    }

                case 'java':
                    switch (assertType) {
                        case 'text_equals':
                            return `assertThat(page.locator("${selector}")).hasText("${expected}");`;
                        case 'text_contains':
                            return `assertThat(page.locator("${selector}")).containsText("${expected}");`;
                        case 'visible':
                            return `assertThat(page.locator("${selector}")).isVisible();`;
                        case 'hidden':
                            return `assertThat(page.locator("${selector}")).isHidden();`;
                        case 'enabled':
                            return `assertThat(page.locator("${selector}")).isEnabled();`;
                        case 'disabled':
                            return `assertThat(page.locator("${selector}")).isDisabled();`;
                        default:
                            return `assertThat(page.locator("${selector}")).containsText("${expected}");`;
                    }

                case 'csharp':
                    switch (assertType) {
                        case 'text_equals':
                            return `await Expect(page.Locator("${selector}")).ToHaveTextAsync("${expected}");`;
                        case 'text_contains':
                            return `await Expect(page.Locator("${selector}")).ToContainTextAsync("${expected}");`;
                        case 'visible':
                            return `await Expect(page.Locator("${selector}")).ToBeVisibleAsync();`;
                        case 'hidden':
                            return `await Expect(page.Locator("${selector}")).ToBeHiddenAsync();`;
                        case 'enabled':
                            return `await Expect(page.Locator("${selector}")).ToBeEnabledAsync();`;
                        case 'disabled':
                            return `await Expect(page.Locator("${selector}")).ToBeDisabledAsync();`;
                        default:
                            return `await Expect(page.Locator("${selector}")).ToContainTextAsync("${expected}");`;
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
