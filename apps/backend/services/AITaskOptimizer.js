// services/AITaskOptimizer.js
/**
 * AI Task Optimizer
 * Defines per-task-type calling strategies (context window, maxTokens, temperature)
 * so a single user-chosen model is used with the least effort possible.
 * The model is NEVER switched here — only how we call it is optimized.
 */

export const TASK_POLICY = {
    // Cheap, deterministic operations: minimal input/output
    extraction: { maxTokens: 300, temperature: 0.1, contextWindow: 6000 },
    // Semantic judging: moderate context, deterministic
    validation: { maxTokens: 400, temperature: 0.1, contextWindow: 4000 },
    // Structured output / boilerplate generation
    generation: { maxTokens: 1200, temperature: 0.4, contextWindow: 3000 },
    // Reasoning keeps historical defaults (maxTokens null = provider default)
    reasoning: { maxTokens: null, temperature: 0.7, contextWindow: null },
    agentic: { maxTokens: null, temperature: 0.7, contextWindow: null },
    // Internal tiered flows manage their own limits (e.g. healSelector)
    healing: { maxTokens: null, temperature: null, contextWindow: null },
};

const DEFAULT_POLICY = TASK_POLICY.reasoning;

// Share of the context window kept from the start of the input (rest from the tail)
const HEAD_RATIO = 0.75;

class AITaskOptimizer {
    getPolicy(taskType) {
        return TASK_POLICY[taskType] || DEFAULT_POLICY;
    }

    /**
     * Reduces a raw input string to fit a character window.
     * Keeps the head and tail of the content to preserve structure, dropping the middle.
     * A null/Infinity window returns the input untouched.
     */
    reduceContext(input, windowChars) {
        if (!input || typeof input !== 'string') return input ?? '';
        if (!windowChars || !Number.isFinite(windowChars) || windowChars <= 0) return input;
        if (input.length <= windowChars) return input;

        const headLen = Math.floor(windowChars * HEAD_RATIO);
        const tailLen = windowChars - headLen;
        const omitted = input.length - windowChars;
        return `${input.slice(0, headLen)}\n...[truncated ${omitted} chars]...\n${input.slice(-tailLen)}`;
    }

    /**
     * Resolves the calling strategy for a task type.
     * @returns {{taskType: string, policy: object, reducedContext: string, effective: {maxTokens: ?number, temperature: ?number}}}
     */
    resolve(taskType, input, overrides = {}) {
        const policy = this.getPolicy(taskType);
        const reducedContext = this.reduceContext(input, policy.contextWindow);
        const effective = {
            maxTokens: overrides.maxTokens ?? policy.maxTokens ?? undefined,
            temperature: overrides.temperature ?? policy.temperature ?? undefined,
        };
        return { taskType, policy, reducedContext, effective };
    }
}

export default new AITaskOptimizer();
