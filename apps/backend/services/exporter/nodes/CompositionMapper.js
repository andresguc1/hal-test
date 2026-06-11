/**
 * Mapper for composition boundary nodes.
 * Covers: input, output
 *
 * These are special composition markers that define entry/exit points
 * for reusable flow components. They don't generate Playwright actions
 * but serve as documentation markers in the generated code.
 */
export const CompositionMapper = {
    type: ['input', 'output'],

    getCode: (params, lang) => {
        const action = params.actionType || params.type;
        const label = params.label || params.customLabel || action;
        const cc = lang.toLowerCase() === 'python' ? '#' : '//';

        if (action === 'input') {
            return `${cc} ── Flow Entry Point: ${label} ──`;
        }
        return `${cc} ── Flow Exit Point: ${label} ──`;
    },
};
