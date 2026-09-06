/**
 * Mapper for user interactions.
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

// ---------------------------------------------------------------------------
// Advanced click generation: clickType (left/right/middle/double) plus
// right-click context-menu interaction (contextMenuItem + clickOutside).
// Mirrors the runtime handler behaviour (apps/backend/core/menu-utils.js).
// ---------------------------------------------------------------------------

const CTX_MENU_EXPR_RE = /^(page\.|getBy)/i;

function isContextMenuExpression(value) {
    return typeof value === 'string' && CTX_MENU_EXPR_RE.test(value.trim());
}

function resolveClickType(params) {
    const clickType = String(params.clickType || '').toLowerCase();
    if (['left', 'right', 'middle', 'double'].includes(clickType)) return clickType;
    if (Number(params.clickCount) === 2) return 'double';
    return String(params.button || 'left').toLowerCase();
}

// Playwright JS/TS role-aware chain that matches a menu option regardless of
// whether it is exposed as menuitem / menuitemcheckbox / menuitemradio.
function jsRoleMenuChain(item) {
    return (
        `page.getByRole('menuitem', { name: \`${item}\` })` +
        `.or(page.getByRole('menuitemcheckbox', { name: \`${item}\` }))` +
        `.or(page.getByRole('menuitemradio', { name: \`${item}\` }))` +
        `.first()`
    );
}

function buildClickCode(params, lang, framework) {
    const fw = String(framework || 'playwright').toLowerCase();
    const l = String(lang).toLowerCase();
    const selector = params.selector || '';
    const clickType = resolveClickType(params);
    const item = String(params.contextMenuItem || '').trim();
    const clickOutside = params.clickOutside === true;

    const isTplLang = l === 'javascript' || l === 'typescript';
    const escape = (v) =>
        isTplLang || fw === 'cypress' ? escapeForTemplateLiteral(v) : escapeForDoubleQuotes(v);
    const s = escape(selector);
    const e = escape(item);
    const itemExpr = Boolean(item && isContextMenuExpression(item));

    // ----- Cypress ----------------------------------------------------------
    if (fw === 'cypress') {
        let base;
        if (clickType === 'double') base = `cy.get(\`${s}\`).dblclick();`;
        else if (clickType === 'right') base = `cy.get(\`${s}\`).rightclick();`;
        else if (clickType === 'middle') base = `cy.get(\`${s}\`).click({ button: 'middle' });`;
        else base = `cy.get(\`${s}\`).click();`;

        const parts = [base];
        if (itemExpr) {
            parts.push(`// context menu option (Cypress, locator not supported): ${item}`);
        } else if (item) {
            parts.push(
                `cy.get('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]').contains(\`${e}\`).click();`,
            );
        }
        if (clickOutside) {
            parts.push(`cy.get('body').click(4, 4);`);
        }
        return parts.join(' ');
    }

    // ----- Selenium ---------------------------------------------------------
    if (fw === 'selenium') {
        if (l === 'python' || l === 'java') {
            const el =
                l === 'python'
                    ? `driver.find_element(By.CSS_SELECTOR, "${s}")`
                    : `driver.findElement(By.cssSelector("${s}"))`;
            const baseXpath = `//*[contains(@role, 'menuitem') and text()='${e}']`;
            let base;
            if (l === 'python') {
                if (clickType === 'right')
                    base = `ActionChains(driver).context_click(${el}).perform()`;
                else if (clickType === 'double')
                    base = `ActionChains(driver).double_click(${el}).perform()`;
                else base = `${el}.click()`;
            } else {
                if (clickType === 'right')
                    base = `new Actions(driver).contextClick(${el}).perform();`;
                else if (clickType === 'double')
                    base = `new Actions(driver).doubleClick(${el}).perform();`;
                else base = `${el}.click();`;
            }

            const parts = [base];
            if (item) {
                parts.push(
                    l === 'python'
                        ? `driver.find_element(By.XPATH, '${baseXpath}').click()`
                        : `driver.findElement(By.xpath("${baseXpath}")).click();`,
                );
            }
            if (clickOutside) {
                parts.push(
                    `// click-outside to close the context menu is not native to Selenium; ` +
                        `it requires an explicit target element`,
                );
            }
            return parts.join('\n        ');
        }
        return `// interaction not implemented for Selenium in ${lang}`;
    }

    // ----- Playwright (default) --------------------------------------------

    // Base click line per language.
    let base;
    if (l === 'python') {
        if (clickType === 'double') base = `await page.dblclick("${s}")`;
        else if (clickType === 'right') base = `await page.click("${s}", button="right")`;
        else if (clickType === 'middle') base = `await page.click("${s}", button="middle")`;
        else base = `await page.click("${s}")`;
    } else if (l === 'java') {
        if (clickType === 'double') base = `page.dblclick("${s}");`;
        else if (clickType === 'right')
            base = `page.click("${s}", new Page.ClickOptions().setButton(MouseButton.RIGHT));`;
        else if (clickType === 'middle')
            base = `page.click("${s}", new Page.ClickOptions().setButton(MouseButton.MIDDLE));`;
        else base = `page.click("${s}");`;
    } else if (l === 'csharp') {
        if (clickType === 'double') base = `await page.DblClickAsync("${s}");`;
        else if (clickType === 'right')
            base = `await page.ClickAsync("${s}", new PageClickOptions { Button = MouseButton.Right });`;
        else if (clickType === 'middle')
            base = `await page.ClickAsync("${s}", new PageClickOptions { Button = MouseButton.Middle });`;
        else base = `await page.ClickAsync("${s}");`;
    } else {
        // javascript / typescript
        if (clickType === 'double') base = `await page.dblclick(\`${s}\`);`;
        else if (clickType === 'right') base = `await page.click(\`${s}\`, { button: 'right' });`;
        else if (clickType === 'middle') base = `await page.click(\`${s}\`, { button: 'middle' });`;
        else base = `await page.click(\`${s}\`);`;
    }

    const parts = [base];

    // Optional: click a context-menu option opened by the right-click.
    if (item) {
        if (itemExpr) {
            if (isTplLang) {
                parts.push(`await ${item.trim()}.click();`);
            } else if (l === 'python') {
                parts.push(`await ${item.trim()}`);
            } else {
                parts.push(`// context menu option (${lang}): ${item}`);
            }
        } else if (isTplLang) {
            parts.push(`await ${jsRoleMenuChain(e)}.click();`);
        } else if (l === 'python') {
            parts.push(
                `await page.get_by_role("menuitem", name="${e}")` +
                    `.or_(page.get_by_role("menuitemcheckbox", name="${e}"))` +
                    `.or_(page.get_by_role("menuitemradio", name="${e}"))` +
                    `.first.click()`,
            );
        } else if (l === 'java') {
            parts.push(
                `page.getByRole(AriaRole.MENU_ITEM, new Page.GetByRoleOptions().setName("${e}")).first().click();`,
            );
        } else if (l === 'csharp') {
            parts.push(
                `await page.GetByRole(AriaRole.MenuItem, new() { Name = "${e}" }).First.ClickAsync();`,
            );
        }
    }

    // Optional: simulate click-outside / blur, then fail if the menu stayed open.
    if (clickOutside) {
        if (isTplLang) {
            parts.push(
                `await page.evaluate(() => { const a = document.activeElement; if (a && typeof a.blur === 'function') a.blur(); }); ` +
                    `await page.mouse.click(4, 4); ` +
                    `await page.waitForTimeout(80); ` +
                    `if (await page.locator('[role="menu"]').first().isVisible().catch(() => false)) ` +
                    `throw new Error('Context menu did not close after clicking outside.');`,
            );
        } else if (l === 'python') {
            parts.push(
                `await page.evaluate('if (document.activeElement && document.activeElement.blur) document.activeElement.blur()'); ` +
                    `await page.mouse.click(4, 4); ` +
                    `await page.wait_for_timeout(80); ` +
                    `assert await page.locator('[role="menu"]').first.is_hidden(), "Context menu did not close after clicking outside."`,
            );
        } else if (l === 'java') {
            parts.push(`page.mouse().click(4, 4);`);
        } else if (l === 'csharp') {
            parts.push(`await page.Mouse.ClickAsync(4, 4);`);
        }
    }

    return parts.join(' ');
}

export const InteractionMapper = {
    type: ['click', 'type_text', 'type', 'hover', 'scroll', 'press_key'],

    getCode: (params, lang, index, framework = 'playwright') => {
        const selector = params.selector || '';
        const text = params.text || '';
        const clickCode = buildClickCode(params, lang, framework);

        if (framework.toLowerCase() === 'cypress') {
            const s = escapeForTemplateLiteral(selector);
            const t = escapeForTemplateLiteral(text);
            return (
                {
                    click: clickCode,
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
                        click: clickCode,
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
                        click: clickCode,
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
                    click: clickCode,
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
                    click: clickCode,
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
                    click: clickCode,
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
                    click: clickCode,
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
