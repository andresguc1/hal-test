/**
 * Mapper for form-related interactions.
 * Covers: select_option, drag_drop
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

/**
 * Builds the select_option code for the new auto-detect mode (container +
 * selectedOptions). Falls back to legacy page.selectOption when only the legacy
 * params are available.
 */
function buildOptionDefinitions(selectedOptions) {
    if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) return [];
    return selectedOptions
        .filter(Boolean)
        .map((o) => {
            const action = (o?.action || 'CHECK').toUpperCase().trim();
            return {
                label: o?.label ?? '',
                value: o?.value != null ? String(o.value) : '',
                action: ['NO_CHANGE', 'CHECK', 'UNCHECK'].includes(action) ? action : 'CHECK',
            };
        })
        .filter((o) => o.label || o.value);
}

function quote(s, lang) {
    return lang === 'javascript' || lang === 'typescript'
        ? escapeForTemplateLiteral(s)
        : escapeForDoubleQuotes(s);
}

const MULTI_OPTION_LANGS = new Set(['javascript', 'typescript', 'python', 'java']);

/**
 * Generates multi-type selection code for the exported language.
 * @param {Object} params - select_option configuration.
 * @param {string} lang - target language.
 * @returns {string} code block (may contain multiple statements/lines).
 */
function generateMultiOptionCode(params, lang) {
    const containerSelector = params.containerSelector || params.selector || '';
    const options = buildOptionDefinitions(params.selectedOptions);
    const container = quote(containerSelector, lang);

    if (options.length === 0) return '';

    // Use detected option metadata (type/locator) when available at export time,
    // otherwise generate a type-agnostic block.
    const detected = Array.isArray(params.detectedOptions) ? params.detectedOptions : [];
    const hintMap = new Map();
    for (const d of detected) {
        if (d?.label) hintMap.set(String(d.label).toLowerCase(), d);
    }

    const isJs = lang === 'javascript' || lang === 'typescript';
    const lines = [];

    for (const opt of options) {
        if (opt.action === 'NO_CHANGE') continue;
        const hint =
            hintMap.get(String(opt.label).toLowerCase()) ||
            hintMap.get(String(opt.value).toLowerCase());
        const type = hint?.type;
        const locator = hint?.locator;
        const isUncheck = opt.action === 'UNCHECK';
        const verb = isUncheck ? 'uncheck' : 'check';

        if (isJs) {
            const l = locator ? `\`${escapeForTemplateLiteral(locator)}\`` : '';
            switch (type) {
                case 'select':
                case 'select-multi':
                    lines.push(
                        `await page.locator(\`${container}\`).locator('select').selectOption(${
                            opt.label
                                ? `{ label: \`${escapeForTemplateLiteral(opt.label)}\` }`
                                : `{ value: \`${escapeForTemplateLiteral(opt.value)}\` }`
                        });`,
                    );
                    break;
                case 'checkbox':
                    lines.push(
                        `await page.locator(\`${container}\`).getByRole('checkbox', { name: \`${escapeForTemplateLiteral(opt.label)}\` }).${verb}();`,
                    );
                    break;
                case 'radio':
                    if (isUncheck) {
                        lines.push(
                            `// Radio "${escapeForTemplateLiteral(opt.label)}": cannot uncheck directly (mutually exclusive). Check another option to clear it.`,
                        );
                    } else {
                        lines.push(
                            `await page.locator(\`${container}\`).getByRole('radio', { name: \`${escapeForTemplateLiteral(opt.label)}\` }).check();`,
                        );
                    }
                    break;
                case 'list':
                default:
                    if (l) {
                        lines.push(
                            isUncheck
                                ? `// List "${escapeForTemplateLiteral(opt.label)}": uncheck requires a click to toggle off when supported.`
                                : `await page.locator(\`${container}\`).locator(${l}).click();`,
                        );
                    } else {
                        lines.push(
                            isUncheck
                                ? `// List "${escapeForTemplateLiteral(opt.label)}": uncheck requires a click to toggle off when supported.`
                                : `await page.locator(\`${container}\`).getByText(\`${escapeForTemplateLiteral(opt.label)}\`).click();`,
                        );
                    }
                    break;
            }
        } else {
            const s = quote(container, lang);
            const lbl = quote(opt.label, lang);
            switch (type) {
                case 'select':
                case 'select-multi':
                    lines.push(
                        `await page.locator("${s}").locator('select').selectOption(${
                            opt.label
                                ? `{ label: "${lbl}" }`
                                : `{ value: "${quote(opt.value, lang)}" }`
                        });`,
                    );
                    break;
                case 'checkbox':
                    lines.push(
                        `await page.locator("${s}").getByRole('checkbox', { name: "${lbl}" }).${verb}();`,
                    );
                    break;
                case 'radio':
                    if (isUncheck) {
                        lines.push(
                            `# Radio "${lbl}": cannot uncheck directly (mutually exclusive).`,
                        );
                    } else {
                        lines.push(
                            `await page.locator("${s}").getByRole('radio', { name: "${lbl}" }).check();`,
                        );
                    }
                    break;
                case 'list':
                default:
                    lines.push(
                        isUncheck
                            ? `# List "${lbl}": uncheck requires a click to toggle off when supported.`
                            : `await page.locator("${s}").getByText("${lbl}").click();`,
                    );
                    break;
            }
        }
    }

    return lines.join('\n');
}

/**
 * Generates an animated (visually smooth) drag-and-drop sequence via granular
 * mouse movement. Mirrors apps/backend/plugins/core-interaction/handlers/drag_drop.js.
 * `src` / `tgt` are already escaped selector strings (quotes are added here).
 */
function animatedDragCode(lang, src, tgt, params) {
    const n = Math.max(2, Number(params.steps) || 12);

    if (lang === 'javascript' || lang === 'typescript') {
        return (
            `const sb = await page.locator(\`${src}\`).boundingBox(); ` +
            `const tb = await page.locator(\`${tgt}\`).boundingBox(); ` +
            `if (!sb || !tb) throw new Error('Unable to resolve drag positions for visual animation'); ` +
            `const sx = sb.x + sb.width / 2, sy = sb.y + sb.height / 2, ex = tb.x + tb.width / 2, ey = tb.y + tb.height / 2; ` +
            `await page.locator(\`${src}\`).hover(); ` +
            `await page.mouse.move(sx, sy); ` +
            `await page.mouse.down(); ` +
            `await page.waitForTimeout(50); ` +
            `for (let i = 1; i <= ${n}; i++) { const t = i / ${n}; await page.mouse.move(sx + (ex - sx) * t, sy + (ey - sy) * t, { steps: 1 }); await page.waitForTimeout(12); } ` +
            `await page.mouse.move(ex, ey, { steps: 1 }); ` +
            `await page.waitForTimeout(40); ` +
            `await page.mouse.up();`
        );
    }

    if (lang === 'python') {
        return (
            `sb = await page.locator("${src}").bounding_box(); ` +
            `tb = await page.locator("${tgt}").bounding_box(); ` +
            `if not sb or not tb: raise RuntimeError('Unable to resolve drag positions for visual animation') ` +
            `sx = sb.x + sb.width / 2; sy = sb.y + sb.height / 2; ex = tb.x + tb.width / 2; ey = tb.y + tb.height / 2; ` +
            `await page.locator("${src}").hover(); ` +
            `await page.mouse.move(sx, sy); ` +
            `await page.mouse.down(); ` +
            `await page.wait_for_timeout(50); ` +
            `for i in range(1, ${n} + 1): pr = i / ${n}; await page.mouse.move(sx + (ex - sx) * pr, sy + (ey - sy) * pr, steps=1); await page.wait_for_timeout(12) ` +
            `await page.mouse.move(ex, ey, steps=1); ` +
            `await page.wait_for_timeout(40); ` +
            `await page.mouse.up()`
        );
    }

    if (lang === 'java') {
        return (
            `var sb = page.locator("${src}").boundingBox(); if (sb == null) throw new RuntimeException("Unable to resolve drag positions for visual animation"); ` +
            `var tb = page.locator("${tgt}").boundingBox(); if (tb == null) throw new RuntimeException("Unable to resolve drag positions for visual animation"); ` +
            `double sx = sb.x + sb.width / 2, sy = sb.y + sb.height / 2, ex = tb.x + tb.width / 2, ey = tb.y + tb.height / 2; ` +
            `page.locator("${src}").hover(); ` +
            `page.mouse().move(sx, sy); ` +
            `page.mouse().down(); ` +
            `page.waitForTimeout(50); ` +
            `for (int i = 1; i <= ${n}; i++) { double pr = (double) i / ${n}; page.mouse().move(sx + (ex - sx) * pr, sy + (ey - sy) * pr, new Mouse.MoveOptions().setSteps(1)); page.waitForTimeout(12); } ` +
            `page.mouse().move(ex, ey, new Mouse.MoveOptions().setSteps(1)); ` +
            `page.waitForTimeout(40); ` +
            `page.mouse().up();`
        );
    }

    if (lang === 'csharp') {
        return (
            `var sb = await page.Locator("${src}").BoundingBoxAsync(); if (sb == null) throw new Exception("Unable to resolve drag positions for visual animation"); ` +
            `var tb = await page.Locator("${tgt}").BoundingBoxAsync(); if (tb == null) throw new Exception("Unable to resolve drag positions for visual animation"); ` +
            `double sx = sb.X + sb.Width / 2, sy = sb.Y + sb.Height / 2, ex = tb.X + tb.Width / 2, ey = tb.Y + tb.Height / 2; ` +
            `await page.Locator("${src}").HoverAsync(); ` +
            `await page.Mouse.MoveAsync(sx, sy); ` +
            `await page.Mouse.DownAsync(); ` +
            `await page.WaitForTimeoutAsync(50); ` +
            `for (int i = 1; i <= ${n}; i++) { double pr = (double) i / ${n}; await page.Mouse.MoveAsync(sx + (ex - sx) * pr, sy + (ey - sy) * pr, new MouseMoveOptions { Steps = 1 }); await page.WaitForTimeoutAsync(12); } ` +
            `await page.Mouse.MoveAsync(ex, ey, new MouseMoveOptions { Steps = 1 }); ` +
            `await page.WaitForTimeoutAsync(40); ` +
            `await page.Mouse.UpAsync();`
        );
    }

    return null;
}

export const FormMapper = {
    type: ['select_option', 'drag_drop'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;

        // New auto-detect multi-option mode
        if (action === 'select_option' && params.containerSelector) {
            const langSimple = langToSimple(lang);
            if (MULTI_OPTION_LANGS.has(langSimple)) {
                const code = generateMultiOptionCode(params, langSimple);
                if (code) return code;
            }
            // Unsupported language: fall through to legacy-ish output below.
        }

        const selector = params.selector || '';
        const langSimple = langToSimple(lang);
        const q = (v) => quote(v, langSimple);

        switch (langSimple) {
            case 'javascript':
            case 'typescript': {
                const s = q(selector);
                const v = q(params.value || params.label || '');
                const src = q(params.sourceSelector || params.source || '');
                const tgt = q(params.targetSelector || params.target || '');
                return {
                    select_option: `await page.selectOption(\`${s}\`, \`${v}\`);`,
                    drag_drop:
                        params.visualAnimation === true
                            ? animatedDragCode('javascript', src, tgt, params)
                            : `await page.dragAndDrop(\`${src}\`, \`${tgt}\`);`,
                }[action];
            }

            case 'python': {
                const s = q(selector);
                const v = q(params.value || params.label || '');
                const src = q(params.sourceSelector || params.source || '');
                const tgt = q(params.targetSelector || params.target || '');
                return {
                    select_option: `await page.select_option("${s}", "${v}")`,
                    drag_drop:
                        params.visualAnimation === true
                            ? animatedDragCode('python', src, tgt, params)
                            : `await page.drag_and_drop("${src}", "${tgt}")`,
                }[action];
            }

            case 'java': {
                const s = q(selector);
                const v = q(params.value || params.label || '');
                const src = q(params.sourceSelector || params.source || '');
                const tgt = q(params.targetSelector || params.target || '');
                return {
                    select_option: `page.selectOption("${s}", "${v}");`,
                    drag_drop:
                        params.visualAnimation === true
                            ? animatedDragCode('java', src, tgt, params)
                            : `page.dragAndDrop("${src}", "${tgt}");`,
                }[action];
            }

            case 'csharp': {
                const s = q(selector);
                const v = q(params.value || params.label || '');
                const src = q(params.sourceSelector || params.source || '');
                const tgt = q(params.targetSelector || params.target || '');
                return {
                    select_option: `await page.SelectOptionAsync("${s}", "${v}");`,
                    drag_drop:
                        params.visualAnimation === true
                            ? animatedDragCode('csharp', src, tgt, params)
                            : `await page.DragAndDropAsync("${src}", "${tgt}");`,
                }[action];
            }

            default:
                return `// form action not implemented for ${lang}`;
        }
    },
};

function langToSimple(lang) {
    return (lang || '').toLowerCase();
}
