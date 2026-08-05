/**
 * Mapper for form-related interactions.
 * Covers: select_option, drag_drop
 */
export const FormMapper = {
    type: ['select_option', 'drag_drop'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const selector = params.selector || '';

        switch (lang.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return {
                    select_option: `await page.selectOption(\`${selector}\`, \`${params.value || params.label || ''}\`);`,
                    drag_drop: `await page.dragAndDrop(\`${params.sourceSelector || params.source || ''}\`, \`${params.targetSelector || params.target || ''}\`);`,
                }[action];

            case 'python':
                return {
                    select_option: `await page.select_option("${selector}", "${params.value || params.label || ''}")`,
                    drag_drop: `await page.drag_and_drop("${params.sourceSelector || params.source || ''}", "${params.targetSelector || params.target || ''}")`,
                }[action];

            case 'java':
                return {
                    select_option: `page.selectOption("${selector}", "${params.value || params.label || ''}");`,
                    drag_drop: `page.dragAndDrop("${params.sourceSelector || params.source || ''}", "${params.targetSelector || params.target || ''}");`,
                }[action];

            case 'csharp':
                return {
                    select_option: `await page.SelectOptionAsync("${selector}", "${params.value || params.label || ''}");`,
                    drag_drop: `await page.DragAndDropAsync("${params.sourceSelector || params.source || ''}", "${params.targetSelector || params.target || ''}");`,
                }[action];

            default:
                return `// form action not implemented for ${lang}`;
        }
    },
};
