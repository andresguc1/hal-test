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

/**
 * Mouse pointer movement to a viewport or element-relative destination.
 * Mirrors the runtime handler (plugins/core-interaction/handlers/mouse_move.js).
 *
 * The `away_from_element` mode emits TWO statements on purpose: the runtime
 * hovers into the element first so the browser's hit-test has something to
 * leave. Collapsing that to a single move would generate code that does not
 * reproduce the behaviour the node actually ran.
 */
function buildMouseMoveCode(params, lang, framework) {
    const fw = String(framework || 'playwright').toLowerCase();
    const l = String(lang).toLowerCase();
    const isTplLang = l === 'javascript' || l === 'typescript';

    const mode = String(params.targetMode || 'viewport_absolute');
    const selector = params.selector || '';
    // Default to 12 to match the runtime default in the handler, so an exported
    // test moves the pointer the same way the flow did inside HalTest. Clamped
    // to the same 200 ceiling the body schema enforces.
    const steps = Math.min(200, Math.max(1, Number(params.steps) || 12));
    const exitDirection = String(params.exitDirection || 'any');
    const s = isTplLang ? escapeForTemplateLiteral(selector) : escapeForDoubleQuotes(selector);
    const n = (v) => Math.round(Number(v) || 0);

    // ----- Cypress ----------------------------------------------------------
    // Cypress has no real page.mouse. A synthetic 'mousemove' does not drive
    // CSS :hover or elementFromPoint, so the limitation is stated in-band
    // (same convention as the Selenium click-outside comment above).
    if (fw === 'cypress') {
        const target =
            mode === 'viewport_absolute'
                ? `cy.get('body').trigger('mousemove', { clientX: ${n(params.x)}, clientY: ${n(params.y)}, bubbles: true });`
                : `cy.get(\`${s}\`).trigger('mousemove', { bubbles: true });`;
        return (
            `// NOTE: Cypress has no page.mouse; this dispatches a synthetic DOM ` +
            `mousemove and will NOT drive CSS :hover, elementFromPoint or native ` +
            `mouseleave the way real pointer input does.\n        ${target}`
        );
    }

    // ----- Selenium ---------------------------------------------------------
    if (fw === 'selenium') {
        if (l === 'python' || l === 'java') {
            const el =
                l === 'python'
                    ? `driver.find_element(By.CSS_SELECTOR, "${s}")`
                    : `driver.findElement(By.cssSelector("${s}"))`;
            const act = l === 'python' ? 'ActionChains(driver)' : 'new Actions(driver)';

            if (mode === 'viewport_absolute') {
                return (
                    `// NOTE: Selenium's ActionChains move relative to the current pointer ` +
                    `position and expose no absolute viewport coordinate, so the HalTest ` +
                    `coordinate (${n(params.x)}, ${n(params.y)}) cannot be reproduced directly. ` +
                    `Move the pointer to the origin first, or target the element instead.\n        ` +
                    `${act}.move_by_offset(${n(params.x)}, ${n(params.y)}).perform()`
                );
            }
            if (mode === 'away_from_element') {
                return (
                    `${act}.move_to_element(${el}).perform();\n        ` +
                    `${act}.move_by_offset(0, -10).perform()`
                );
            }
            return `${act}.move_to_element(${el}).perform()`;
        }
        return `// mouse move not implemented for Selenium in ${lang}`;
    }

    // ----- Playwright (default) --------------------------------------------

    // `steps` is a Playwright-native option for every binding, so it carries
    // across all five languages unchanged.
    if (mode === 'viewport_absolute') {
        if (l === 'python')
            return `await page.mouse.move(${n(params.x)}, ${n(params.y)}, steps=${steps})`;
        if (l === 'java')
            return `page.mouse().move(${n(params.x)}, ${n(params.y)}, new Mouse.MoveOptions().setSteps(${steps}));`;
        if (l === 'csharp')
            return `await page.Mouse.MoveAsync(${n(params.x)}, ${n(params.y)}, new MouseMoveOptions { Steps = ${steps} });`;
        return `await page.mouse.move(${n(params.x)}, ${n(params.y)}, { steps: ${steps} });`;
    }

    if (mode === 'element_offset') {
        // Element-relative offsets are expressed against the element's box at
        // runtime; the generated code resolves the same box from the DOM.
        const dx = n(params.offsetX);
        const dy = n(params.offsetY);
        if (isTplLang) {
            return (
                `const __mmBox = await page.locator(\`${s}\`).boundingBox();\n        ` +
                `if (__mmBox) await page.mouse.move(Math.round(__mmBox.x + ${dx}), Math.round(__mmBox.y + ${dy}), { steps: ${steps} });`
            );
        }
        if (l === 'python') {
            return (
                `__mm_box = await page.locator("${s}").bounding_box()\n        ` +
                `if __mm_box: await page.mouse.move(round(__mm_box["x"] + ${dx}), round(__mm_box["y"] + ${dy}), steps=${steps})`
            );
        }
        if (l === 'java') {
            return (
                `var __mmBox = page.locator("${s}").boundingBox();\n        ` +
                `if (__mmBox != null) page.mouse().move((int) Math.round(__mmBox.x + ${dx}), (int) Math.round(__mmBox.y + ${dy}), new Mouse.MoveOptions().setSteps(${steps}));`
            );
        }
        return (
            `var box = await page.Locator("${s}").BoundingBoxAsync();\n        ` +
            `if (box != null) await page.Mouse.MoveAsync((int)Math.Round(box.X + ${dx}), (int)Math.Round(box.Y + ${dy}), new MouseMoveOptions { Steps = ${steps} });`
        );
    }

    // element_center and away_from_element both need the element located first.
    if (mode === 'away_from_element') {
        // Two statements on purpose: enter, then leave. The generated code must
        // reproduce the two-phase contract or it will not fire mouseleave.
        const hover = isTplLang
            ? `await page.locator(\`${s}\`).hover();`
            : l === 'python'
              ? `await page.locator("${s}").hover()`
              : l === 'java'
                ? `page.locator("${s}").hover();`
                : `await page.Locator("${s}").HoverAsync();`;
        const sel = isTplLang ? `\`${s}\`` : l === 'python' ? `"${s}"` : `"${s}"`;
        const away = buildEscapeCode(l, steps, exitDirection, sel);
        // Newline, not a space: Python's hover() has no statement terminator,
        // so a space-separated join would produce invalid syntax.
        return `${hover}\n        ${away}`;
    }

    // element_center — the box centre is resolved from the DOM.
    if (isTplLang) {
        return (
            `const __mmBox = await page.locator(\`${s}\`).boundingBox();\n        ` +
            `if (__mmBox) await page.mouse.move(Math.round(__mmBox.x + __mmBox.width / 2), Math.round(__mmBox.y + __mmBox.height / 2), { steps: ${steps} });`
        );
    }
    if (l === 'python') {
        return (
            `__mm_box = await page.locator("${s}").bounding_box()\n        ` +
            `if __mm_box: await page.mouse.move(round(__mm_box["x"] + __mm_box["width"] / 2), round(__mm_box["y"] + __mm_box["height"] / 2), steps=${steps})`
        );
    }
    if (l === 'java') {
        return (
            `var __mmBox = page.locator("${s}").boundingBox();\n        ` +
            `if (__mmBox != null) page.mouse().move((int) Math.round(__mmBox.x + __mmBox.width / 2), (int) Math.round(__mmBox.y + __mmBox.height / 2), new Mouse.MoveOptions().setSteps(${steps}));`
        );
    }
    return (
        `var box = await page.Locator("${s}").BoundingBoxAsync();\n        ` +
        `if (box != null) await page.Mouse.MoveAsync((int)Math.Round(box.X + box.Width / 2), (int)Math.Round(box.Y + box.Height / 2), new MouseMoveOptions { Steps = ${steps} });`
    );
}

/**
 * Generated "leave the element" step. There is no Playwright API to move to a
 * point outside an element, so the box is measured and an offset beyond the
 * chosen edge is used — the same escape strategy as the runtime helper.
 *
 * `sel` is the already-escaped selector literal, quoted per language.
 */
function buildEscapeCode(l, steps, exitDirection, sel) {
    const margin = 8;
    if (l === 'python') {
        return (
            `__mm_away = await page.locator(${sel}).bounding_box(); ` +
            `if __mm_away: await page.mouse.move(round(__mm_away["x"] + __mm_away["width"] / 2), ${escapeOffsetPython(exitDirection, margin)}, steps=${steps})`
        );
    }
    if (l === 'java') {
        return (
            `var __mmAway = page.locator(${sel}).boundingBox(); ` +
            `if (__mmAway != null) page.mouse().move((int) Math.round(__mmAway.x + __mmAway.width / 2), (int) ${escapeOffsetJava(exitDirection, margin)}, new Mouse.MoveOptions().setSteps(${steps}));`
        );
    }
    if (l === 'csharp') {
        return (
            `var away = await page.Locator(${sel}).BoundingBoxAsync(); ` +
            `if (away != null) await page.Mouse.MoveAsync((int)Math.Round(away.X + away.Width / 2), ${escapeOffsetCSharp(exitDirection, margin)}, new MouseMoveOptions { Steps = ${steps} });`
        );
    }
    return (
        `const away = await page.locator(${sel}).boundingBox(); ` +
        `if (away) await page.mouse.move(Math.round(away.x + away.width / 2), ${escapeOffsetJs(exitDirection, margin)}, { steps: ${steps} });`
    );
}

const escapeOffsetJs = (dir, m) =>
    dir === 'down'
        ? `Math.round(away.y + away.height + ${m})`
        : dir === 'left'
          ? `Math.round(away.x - ${m})`
          : dir === 'right'
            ? `Math.round(away.x + away.width + ${m})`
            : `Math.round(away.y - ${m})`;

const escapeOffsetPython = (dir, m) =>
    dir === 'down'
        ? `round(__mm_away["y"] + __mm_away["height"] + ${m})`
        : dir === 'left'
          ? `round(__mm_away["x"] - ${m})`
          : dir === 'right'
            ? `round(__mm_away["x"] + __mm_away["width"] + ${m})`
            : `round(__mm_away["y"] - ${m})`;

const escapeOffsetJava = (dir, m) =>
    dir === 'down'
        ? `Math.round(__mmAway.y + __mmAway.height + ${m})`
        : dir === 'left'
          ? `Math.round(__mmAway.x - ${m})`
          : dir === 'right'
            ? `Math.round(__mmAway.x + __mmAway.width + ${m})`
            : `Math.round(__mmAway.y - ${m})`;

const escapeOffsetCSharp = (dir, m) =>
    dir === 'down'
        ? `(int)Math.Round(away.Y + away.Height + ${m})`
        : dir === 'left'
          ? `(int)Math.Round(away.X - ${m})`
          : dir === 'right'
            ? `(int)Math.Round(away.X + away.Width + ${m})`
            : `(int)Math.Round(away.Y - ${m})`;

export const InteractionMapper = {
    type: ['click', 'type_text', 'type', 'hover', 'scroll', 'press_key', 'mouse_move'],

    getCode: (params, lang, index, framework = 'playwright') => {
        const selector = params.selector || '';
        const text = params.text || '';
        const clickCode = buildClickCode(params, lang, framework);

        // Mouse Move resolves every framework/language combination itself,
        // including documented fallbacks for Cypress and Selenium, so it
        // short-circuits before the per-framework maps below.
        const nodeType = params.actionType || params.type;
        if (nodeType === 'mouse_move') {
            return buildMouseMoveCode(params, lang, framework);
        }

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
