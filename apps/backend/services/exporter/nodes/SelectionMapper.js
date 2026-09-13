/**
 * Mapper for explicit checkbox / radio / custom-list selection nodes.
 * Covers: set_checkbox, set_radio, pick_list_option
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

function quote(s, lang) {
    return lang === 'javascript' || lang === 'typescript'
        ? escapeForTemplateLiteral(s)
        : escapeForDoubleQuotes(s);
}

function langToSimple(lang) {
    return (lang || '').toLowerCase();
}

/**
 * Generates the export code for a single checkbox target described by
 * { strategy: 'css'|'label', target, action: check|uncheck|toggle }.
 */
function generateCheckboxLine(lang, field, isJs) {
    const { strategy = 'css', target, action = 'check' } = field;
    const t = String(target).trim();

    const locatorExpr = (inner) => {
        if (lang === 'javascript' || lang === 'typescript') return `page.locator(\`${inner}\`)`;
        if (lang === 'python') return `page.locator("${inner}")`;
        if (lang === 'java') return `page.locator("${inner}")`;
        return `page.Locator("${inner}")`;
    };

    const targetExpr = () => {
        if (strategy === 'label') {
            if (isJs)
                return `page.getByRole('checkbox', { name: \`${escapeForTemplateLiteral(t)}\` })`;
            if (lang === 'python') return `page.get_by_role("checkbox", name="${quote(t, lang)}")`;
            if (lang === 'java')
                return `page.getByRole(AriaRole.CHECKBOX, new Locator.GetByRoleOptions().setName("${quote(t, lang)}"))`;
            return `page.GetByRole(AriaRole.Checkbox, new Page.GetByRoleOptions { Name = ${JSON.stringify(t)} })`;
        }
        return locatorExpr(quote(t, lang));
    };

    if (action === 'toggle') {
        const base = targetExpr();
        if (isJs) return `await ${base}.click();`;
        if (lang === 'python') return `await ${base}.click()`;
        if (lang === 'java') return `${base}.click();`;
        return `await ${base}.ClickAsync();`;
    }

    const checked = action !== 'uncheck';
    const base = targetExpr();
    if (isJs) return `await ${base}.setChecked(${checked});`;
    if (lang === 'python') return `await ${base}.set_checked(${checked ? 'True' : 'False'})`;
    if (lang === 'java') return `${base}.setChecked(${checked});`;
    return `await ${base}.SetCheckedAsync(${checked});`;
}

/**
 * Generates the "pick from custom list" code. When `expandMenu` is enabled the
 * trigger is clicked first, then the option is located by exact text (preferred)
 * or by numeric index.
 */
function generatePickListCode(lang, selector, params) {
    const s = quote(selector, lang);
    const isJs = lang === 'javascript' || lang === 'typescript';
    const hasText = params.optionText != null && String(params.optionText).trim() !== '';
    const expand = params.expandMenu !== false;
    // When a menuSelector (portal/overlay panel) is provided, options are
    // searched inside it; the trigger selector is still used to open the menu.
    const menuSel = params.menuSelector && String(params.menuSelector).trim();
    const scopeS = menuSel ? quote(menuSel, lang) : s;

    const openMenu = () => {
        if (isJs) return `await page.locator(\`${s}\`).click();`;
        if (lang === 'python') return `await page.locator("${s}").click()`;
        if (lang === 'java') return `page.locator("${s}").click();`;
        return `await page.Locator("${s}").ClickAsync();`;
    };

    let optionLoc;
    if (isJs) {
        optionLoc = hasText
            ? `page.locator(\`${scopeS}\`).getByText(\`${escapeForTemplateLiteral(String(params.optionText).trim())}\`, { exact: true })`
            : `page.locator(\`${scopeS}\`).locator('role=option, [role="option"], li, div[data-option]').nth(${Number(params.optionIndex)})`;
    } else if (lang === 'python') {
        optionLoc = hasText
            ? `page.locator("${scopeS}").get_by_text("${quote(String(params.optionText).trim(), lang)}", exact=True)`
            : `page.locator("${scopeS}").locator('role=option, [role="option"], li, div[data-option]').nth(${Number(params.optionIndex)})`;
    } else if (lang === 'java') {
        optionLoc = hasText
            ? `page.locator("${scopeS}").getByText("${quote(String(params.optionText).trim(), lang)}", new Locator.GetByTextOptions().setExact(true))`
            : `page.locator("${scopeS}").locator('role=option, [role="option"], li, div[data-option]').nth(${Number(params.optionIndex)})`;
    } else {
        optionLoc = hasText
            ? `page.Locator("${scopeS}").GetByText("${quote(String(params.optionText).trim(), lang)}", new Page.GetByTextOptions { Exact = true })`
            : `page.Locator("${scopeS}").Locator("role=option, [role='option'], li, div[data-option]").Nth(${Number(params.optionIndex)})`;
    }

    const click =
        lang === 'csharp'
            ? `await ${optionLoc}.ClickAsync();`
            : `${isJs ? 'await ' : lang === 'python' ? 'await ' : ''}${optionLoc}.click()${lang === 'python' ? '' : ';'}`;

    const lines = [];
    if (expand) {
        lines.push(openMenu());
        if (isJs) lines.push('await page.waitForTimeout(300);');
        else if (lang === 'python') lines.push('await page.wait_for_timeout(300)');
        else if (lang === 'java') lines.push('page.waitForTimeout(300);');
        else lines.push('await page.WaitForTimeoutAsync(300);');
    }
    lines.push(click);
    return lines.join('\n');
}

export const SelectionMapper = {
    type: ['set_checkbox', 'set_radio', 'pick_list_option'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const langSimple = langToSimple(lang);
        const isJs = langSimple === 'javascript' || langSimple === 'typescript';
        const selector = params.selector || '';
        const q = (v) => quote(v, langSimple);

        if (action === 'set_checkbox' && Array.isArray(params.fields) && params.fields.length > 0) {
            return params.fields.map((f) => generateCheckboxLine(langSimple, f, isJs)).join('\n');
        }

        switch (langSimple) {
            case 'javascript':
            case 'typescript': {
                const s = q(selector);
                const unchecked = params.action === 'uncheck';
                const locExpr = `page.locator(\`${s}\`)`;
                const verify =
                    params.action !== 'toggle' && params.verifyState !== false
                        ? `\n    await expect(${locExpr}).toBeChecked({ checked: ${!unchecked} });`
                        : '';
                return {
                    set_checkbox:
                        params.action === 'toggle'
                            ? `await ${locExpr}.click();`
                            : `await ${locExpr}.setChecked(${!unchecked});` + verify,
                    set_radio: `await ${locExpr}.check();`,
                    pick_list_option: generatePickListCode('javascript', selector, params),
                }[action];
            }

            case 'python': {
                const s = q(selector);
                const locExpr = `page.locator("${s}")`;
                const verify =
                    params.action !== 'toggle' && params.verifyState !== false
                        ? params.action === 'uncheck'
                            ? `\nawait expect(${locExpr}).not_to_be_checked()`
                            : `\nawait expect(${locExpr}).to_be_checked()`
                        : '';
                return {
                    set_checkbox:
                        params.action === 'toggle'
                            ? `await ${locExpr}.click()`
                            : `await ${locExpr}.set_checked(${params.action === 'uncheck' ? 'False' : 'True'})` +
                              verify,
                    set_radio: `await ${locExpr}.check()`,
                    pick_list_option: generatePickListCode('python', selector, params),
                }[action];
            }

            case 'java': {
                const s = q(selector);
                const locExpr = `page.locator("${s}")`;
                const verify =
                    params.action !== 'toggle' && params.verifyState !== false
                        ? params.action === 'uncheck'
                            ? `\n    assertThat(${locExpr}).not().toBeChecked();`
                            : `\n    assertThat(${locExpr}).toBeChecked();`
                        : '';
                return {
                    set_checkbox:
                        params.action === 'toggle'
                            ? `${locExpr}.click();`
                            : `${locExpr}.setChecked(${params.action === 'uncheck' ? 'false' : 'true'});` +
                              verify,
                    set_radio: `${locExpr}.check();`,
                    pick_list_option: generatePickListCode('java', selector, params),
                }[action];
            }

            case 'csharp': {
                const s = q(selector);
                const locExpr = `page.Locator("${s}")`;
                const verify =
                    params.action !== 'toggle' && params.verifyState !== false
                        ? params.action === 'uncheck'
                            ? `\n    await Expect(${locExpr}).Not.ToBeCheckedAsync();`
                            : `\n    await Expect(${locExpr}).ToBeCheckedAsync();`
                        : '';
                return {
                    set_checkbox:
                        params.action === 'toggle'
                            ? `await ${locExpr}.ClickAsync();`
                            : `await ${locExpr}.SetCheckedAsync(${params.action === 'uncheck' ? 'false' : 'true'});` +
                              verify,
                    set_radio: `await ${locExpr}.CheckAsync();`,
                    pick_list_option: generatePickListCode('csharp', selector, params),
                }[action];
            }

            default:
                return `// ${action} not implemented for ${lang}`;
        }
    },
};
