/**
 * Mapper for AI/LLM node types.
 * These nodes are runtime-specific and don't have direct Playwright equivalents.
 * Generates descriptive comments with implementation hints.
 */

export const AiMapper = {
    type: [
        'call_llm',
        'generate_data',
        'extract_dom_context',
        'chain_of_thought',
        'smart_selector',
    ],

    getCode: (params, lang, index, framework = 'playwright') => {
        const action = params.actionType || params.type;
        const label = params.label || action;
        const commentChar = lang.toLowerCase() === 'python' ? '#' : '//';

        const descriptions = {
            call_llm: `AI LLM call: ${params.prompt ? `"${params.prompt.slice(0, 60)}..."` : label}`,
            generate_data: `AI data generation: ${params.instruction ? `"${params.instruction.slice(0, 60)}..."` : label}`,
            extract_dom_context: `AI DOM context extraction: ${params.contextPrompt ? `"${params.contextPrompt.slice(0, 60)}..."` : label}`,
            chain_of_thought: `AI chain-of-thought reasoning: ${params.thinkingPrompt ? `"${params.thinkingPrompt.slice(0, 60)}..."` : label}`,
            smart_selector: `AI smart selector resolution: ${params.elementDescription ? `"${params.elementDescription.slice(0, 60)}..."` : label}`,
        };

        const desc = descriptions[action] || `AI action: ${label}`;

        if (framework.toLowerCase() === 'cypress') {
            return `${commentChar} [AI] ${desc}\n${commentChar} AI nodes require runtime integration and cannot be generated as static code.`;
        }

        if (framework.toLowerCase() === 'selenium') {
            return `${commentChar} [AI] ${desc}\n${commentChar} AI nodes require runtime integration and cannot be generated as static code.`;
        }

        return `${commentChar} [AI] ${desc}\n${commentChar} This node requires AI integration at runtime (AIService).\n${commentChar} To implement manually, call your AI provider API and process the response.`;
    },
};
