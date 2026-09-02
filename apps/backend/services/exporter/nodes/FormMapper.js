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
                    drag_drop: `await page.dragAndDrop(\`${src}\`, \`${tgt}\`);`,
                }[action];
            }

            case 'python': {
                const s = q(selector);
                const v = q(params.value || params.label || '');
                const src = q(params.sourceSelector || params.source || '');
                const tgt = q(params.targetSelector || params.target || '');
                return {
                    select_option: `await page.select_option("${s}", "${v}")`,
                    drag_drop: `await page.drag_and_drop("${src}", "${tgt}")`,
                }[action];
            }

            case 'java': {
                const s = q(selector);
                const v = q(params.value || params.label || '');
                const src = q(params.sourceSelector || params.source || '');
                const tgt = q(params.targetSelector || params.target || '');
                return {
                    select_option: `page.selectOption("${s}", "${v}");`,
                    drag_drop: `page.dragAndDrop("${src}", "${tgt}");`,
                }[action];
            }

            case 'csharp': {
                const s = q(selector);
                const v = q(params.value || params.label || '');
                const src = q(params.sourceSelector || params.source || '');
                const tgt = q(params.targetSelector || params.target || '');
                return {
                    select_option: `await page.SelectOptionAsync("${s}", "${v}");`,
                    drag_drop: `await page.DragAndDropAsync("${src}", "${tgt}");`,
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
