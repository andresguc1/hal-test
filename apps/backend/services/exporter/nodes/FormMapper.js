/**
 * Mapper for form-related interactions.
 * Covers: select_option, drag_drop
 */
import { escapeForTemplateLiteral, escapeForDoubleQuotes } from '../core/escapeUtils.js';

export const FormMapper = {
    type: ['select_option', 'drag_drop'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const selector = params.selector || '';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript': {
                const s = escapeForTemplateLiteral(selector);
                const v = escapeForTemplateLiteral(params.value || params.label || '');
                const src = escapeForTemplateLiteral(params.sourceSelector || params.source || '');
                const tgt = escapeForTemplateLiteral(params.targetSelector || params.target || '');
                return {
                    select_option: `await page.selectOption(\`${s}\`, \`${v}\`);`,
                    drag_drop: `await page.dragAndDrop(\`${src}\`, \`${tgt}\`);`,
                }[action];
            }

            case 'python': {
                const s = escapeForDoubleQuotes(selector);
                const v = escapeForDoubleQuotes(params.value || params.label || '');
                const src = escapeForDoubleQuotes(params.sourceSelector || params.source || '');
                const tgt = escapeForDoubleQuotes(params.targetSelector || params.target || '');
                return {
                    select_option: `await page.select_option("${s}", "${v}")`,
                    drag_drop: `await page.drag_and_drop("${src}", "${tgt}")`,
                }[action];
            }

            case 'java': {
                const s = escapeForDoubleQuotes(selector);
                const v = escapeForDoubleQuotes(params.value || params.label || '');
                const src = escapeForDoubleQuotes(params.sourceSelector || params.source || '');
                const tgt = escapeForDoubleQuotes(params.targetSelector || params.target || '');
                return {
                    select_option: `page.selectOption("${s}", "${v}");`,
                    drag_drop: `page.dragAndDrop("${src}", "${tgt}");`,
                }[action];
            }

            case 'csharp': {
                const s = escapeForDoubleQuotes(selector);
                const v = escapeForDoubleQuotes(params.value || params.label || '');
                const src = escapeForDoubleQuotes(params.sourceSelector || params.source || '');
                const tgt = escapeForDoubleQuotes(params.targetSelector || params.target || '');
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
