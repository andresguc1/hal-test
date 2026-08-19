/**
 * Mapper for fill_form node type.
 * Generates code that fills multiple form fields sequentially.
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

export const FillFormMapper = {
    type: ['fill_form'],

    getCode: (params, lang, index, framework = 'playwright') => {
        const formSelector = params.formSelector || '';
        const fields = params.fields || [];
        const submitAfterFill =
            params.submitAfterFill === true || params.submitAfterFill === 'true';
        const submitSelector = params.submitSelector || '';
        const waitForNavigation =
            params.waitForNavigation === undefined ? true : params.waitForNavigation === true;
        const clearBeforeType =
            params.clearBeforeType === undefined ? true : params.clearBeforeType === true;

        if (fields.length === 0) {
            return _commentOrEmpty('fill_form: no fields defined', lang);
        }

        if (framework.toLowerCase() === 'cypress') {
            return _generateCypress(formSelector, fields, submitAfterFill, submitSelector);
        }

        if (framework.toLowerCase() === 'selenium') {
            return _generateSelenium(formSelector, fields, submitAfterFill, submitSelector, lang);
        }

        // Playwright (default)
        return _generatePlaywright(
            formSelector,
            fields,
            submitAfterFill,
            submitSelector,
            waitForNavigation,
            clearBeforeType,
            lang,
        );
    },
};

function _generatePlaywright(
    formSelector,
    fields,
    submitAfterFill,
    submitSelector,
    waitForNavigation,
    clearBeforeType,
    lang,
) {
    const lines = [];
    const isPy = lang.toLowerCase() === 'python';
    const isJava = lang.toLowerCase() === 'java';
    const isCs = lang.toLowerCase() === 'csharp';
    const q = isPy || isJava || isCs ? '"' : '`';
    const esc = isPy || isJava || isCs ? escapeForDoubleQuotes : escapeForTemplateLiteral;

    const fs = esc(formSelector);

    if (isPy) {
        lines.push(`form = page.locator("${fs}")`);
    } else if (isJava) {
        lines.push(`Locator form = page.locator("${fs}");`);
    } else if (isCs) {
        lines.push(`var form = page.Locator("${fs}");`);
    } else {
        lines.push(`const form = page.locator(${q}${fs}${q});`);
    }

    for (const field of fields) {
        const sel = esc(field.selector || '');
        const val = esc(field.value || '');
        const fType = field.type || 'text';
        const clear = field.clearBeforeType !== undefined ? field.clearBeforeType : clearBeforeType;

        switch (fType) {
            case 'text':
                if (isPy) {
                    if (clear) {
                        lines.push(`await page.locator("${sel}").fill("")`);
                    }
                    lines.push(`await page.locator("${sel}").type("${val}")`);
                } else if (isJava) {
                    if (clear) {
                        lines.push(`page.locator("${sel}").fill("");`);
                    }
                    lines.push(`page.locator("${sel}").type("${val}");`);
                } else if (isCs) {
                    if (clear) {
                        lines.push(`await page.Locator("${sel}").FillAsync("");`);
                    }
                    lines.push(`await page.Locator("${sel}").TypeAsync("${val}");`);
                } else {
                    if (clear) {
                        lines.push(`await page.locator(${q}${sel}${q}).fill('');`);
                    }
                    lines.push(`await page.locator(${q}${sel}${q}).type(${q}${val}${q});`);
                }
                break;

            case 'select':
                if (isPy) {
                    lines.push(`await page.locator("${sel}").select_option(label="${val}")`);
                } else if (isJava) {
                    lines.push(
                        `page.locator("${sel}").selectOption(new SelectOption().setLabel("${val}"));`,
                    );
                } else if (isCs) {
                    lines.push(
                        `await page.Locator("${sel}").SelectOptionAsync(new[] { "${val}" });`,
                    );
                } else {
                    lines.push(
                        `await page.locator(${q}${sel}${q}).selectOption({ label: ${q}${val}${q} });`,
                    );
                }
                break;

            case 'checkbox':
            case 'radio': {
                const isChecked = field.value === 'true' || field.value === true;
                if (isPy) {
                    if (isChecked) {
                        lines.push(`await page.locator("${sel}").check()`);
                    } else {
                        lines.push(`await page.locator("${sel}").uncheck()`);
                    }
                } else if (isJava) {
                    if (isChecked) {
                        lines.push(`page.locator("${sel}").check();`);
                    } else {
                        lines.push(`page.locator("${sel}").uncheck();`);
                    }
                } else if (isCs) {
                    if (isChecked) {
                        lines.push(`await page.Locator("${sel}").CheckAsync();`);
                    } else {
                        lines.push(`await page.Locator("${sel}").UncheckAsync();`);
                    }
                } else {
                    if (isChecked) {
                        lines.push(`await page.locator(${q}${sel}${q}).check();`);
                    } else {
                        lines.push(`await page.locator(${q}${sel}${q}).uncheck();`);
                    }
                }
                break;
            }

            case 'file':
                if (isPy) {
                    lines.push(`await page.locator("${sel}").set_input_files("${val}")`);
                } else if (isJava) {
                    lines.push(`page.locator("${sel}").setInputFiles("${val}");`);
                } else if (isCs) {
                    lines.push(`await page.Locator("${sel}").SetInputFilesAsync("${val}");`);
                } else {
                    lines.push(`await page.locator(${q}${sel}${q}).setInputFiles(${q}${val}${q});`);
                }
                break;

            default:
                lines.push(`// Unsupported field type: ${fType}`);
                break;
        }
    }

    if (submitAfterFill) {
        if (submitSelector) {
            const ss = esc(submitSelector);
            if (isPy) {
                lines.push(`await page.locator("${ss}").click()`);
            } else if (isJava) {
                lines.push(`page.locator("${ss}").click();`);
            } else if (isCs) {
                lines.push(`await page.Locator("${ss}").ClickAsync();`);
            } else {
                lines.push(`await page.locator(${q}${ss}${q}).click();`);
            }
        } else {
            if (isPy) {
                lines.push(`await form.evaluate("el => el.requestSubmit()")`);
            } else if (isJava) {
                lines.push(`form.evaluate("el -> el.requestSubmit()");`);
            } else if (isCs) {
                lines.push(`await form.EvaluateAsync("el => el.RequestSubmit()");`);
            } else {
                lines.push(`await form.evaluate(el => el.requestSubmit());`);
            }
        }

        if (waitForNavigation) {
            if (isPy) {
                lines.push(`await page.wait_for_load_state("load")`);
            } else if (isJava) {
                lines.push(`page.waitForLoadState(LoadState.LOAD);`);
            } else if (isCs) {
                lines.push(`await page.WaitForLoadStateAsync(LoadState.Load);`);
            } else {
                lines.push(`await page.waitForLoadState('load');`);
            }
        }
    }

    return lines.join(isPy ? '\n' : '\n');
}

function _generateCypress(formSelector, fields, submitAfterFill, submitSelector) {
    const lines = [];

    for (const field of fields) {
        const sel = escapeForTemplateLiteral(field.selector || '');
        const val = escapeForTemplateLiteral(field.value || '');
        const fType = field.type || 'text';

        switch (fType) {
            case 'text':
                lines.push(`cy.get(\`${sel}\`).clear().type(\`${val}\`);`);
                break;
            case 'select':
                lines.push(`cy.get(\`${sel}\`).select(\`${val}\`);`);
                break;
            case 'checkbox':
            case 'radio':
                if (field.value === 'true' || field.value === true) {
                    lines.push(`cy.get(\`${sel}\`).check();`);
                } else {
                    lines.push(`cy.get(\`${sel}\`).uncheck();`);
                }
                break;
            case 'file':
                lines.push(`cy.get(\`${sel}\`).selectFile(\`${val}\`);`);
                break;
            default:
                lines.push(`// Unsupported field type: ${fType}`);
                break;
        }
    }

    if (submitAfterFill) {
        if (submitSelector) {
            const ss = escapeForTemplateLiteral(submitSelector);
            lines.push(`cy.get(\`${ss}\`).click();`);
        } else {
            const fsEsc = escapeForTemplateLiteral(formSelector);
            lines.push(`cy.get(\`${fsEsc}\`).submit();`);
        }
    }

    return lines.join('\n');
}

function _generateSelenium(formSelector, fields, submitAfterFill, submitSelector, lang) {
    const isJava = lang.toLowerCase() === 'java';
    const lines = [];

    if (isJava) {
        lines.push(
            `WebElement form = driver.findElement(By.cssSelector("${escapeForDoubleQuotes(formSelector)}"));`,
        );
    } else {
        lines.push(
            `form = driver.find_element(By.CSS_SELECTOR, "${escapeForDoubleQuotes(formSelector)}")`,
        );
    }

    for (const field of fields) {
        const sel = escapeForDoubleQuotes(field.selector || '');
        const val = escapeForDoubleQuotes(field.value || '');
        const fType = field.type || 'text';

        switch (fType) {
            case 'text':
                if (isJava) {
                    lines.push(`driver.findElement(By.cssSelector("${sel}")).sendKeys("${val}");`);
                } else {
                    lines.push(
                        `driver.find_element(By.CSS_SELECTOR, "${sel}").send_keys("${val}")`,
                    );
                }
                break;
            case 'select': {
                if (!isJava) {
                    lines.push('from selenium.webdriver.support.select import Select');
                }
                if (isJava) {
                    lines.push(
                        `new Select(driver.findElement(By.cssSelector("${sel}"))).selectByVisibleText("${val}");`,
                    );
                } else {
                    lines.push(
                        `Select(driver.find_element(By.CSS_SELECTOR, "${sel}")).select_by_visible_text("${val}")`,
                    );
                }
                break;
            }
            case 'checkbox':
            case 'radio':
                if (isJava) {
                    lines.push(`driver.findElement(By.cssSelector("${sel}")).click();`);
                } else {
                    lines.push(`driver.find_element(By.CSS_SELECTOR, "${sel}").click()`);
                }
                break;
            default:
                lines.push(
                    isJava
                        ? `// Unsupported field type: ${fType}`
                        : `# Unsupported field type: ${fType}`,
                );
                break;
        }
    }

    if (submitAfterFill) {
        if (submitSelector) {
            const ss = escapeForDoubleQuotes(submitSelector);
            if (isJava) {
                lines.push(`driver.findElement(By.cssSelector("${ss}")).click();`);
            } else {
                lines.push(`driver.find_element(By.CSS_SELECTOR, "${ss}").click()`);
            }
        } else {
            if (isJava) {
                lines.push(`form.submit();`);
            } else {
                lines.push(`form.submit()`);
            }
        }
    }

    return lines.join('\n');
}

function _commentOrEmpty(msg, lang) {
    const commentChar = lang.toLowerCase() === 'python' ? '#' : '//';
    return `${commentChar} ${msg}`;
}
