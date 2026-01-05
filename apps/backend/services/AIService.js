// services/AIService.js
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

/**
 * Servicio Central de IA
 * Wraps Vercel AI SDK for text generation and structured output.
 */
class AIService {
    constructor() {
        this.providers = {};
        // Lazy initialization map
    }

    /**
     * Get or create a provider instance based on the configuration
     * @param {string} providerName - 'openai', 'google', 'anthropic', 'grok'
     * @param {string} apiKey - API Key specifically for this request or from env
     * @returns {object} - The model provider instance
     */
    getProvider(providerName, apiKey) {
        // Validation
        if (!apiKey && !process.env.OPENAI_API_KEY) {
            throw new Error(
                'No API Key provided. Please set OPENAI_API_KEY env var or provide it in the request headers.',
            );
        }

        const effectiveKey = apiKey || process.env.OPENAI_API_KEY;

        if (providerName === 'openai' || providerName === 'grok') {
            // Grok uses OpenAI compatible endpoint usually, but let's stick to standard OpenAI for now
            // per the 'ai-sdk/openai' documentation.
            // If provider is 'grok', we might need custom baseURL if using OpenAI SDK compatibility
            // but the user plan mentioned "Backend: Add xAI (Grok) support via OpenAI SDK."

            const config = {
                apiKey: effectiveKey,
            };

            // xAI (Grok) specific configuration if needed
            if (providerName === 'grok') {
                config.baseURL = 'https://api.x.ai/v1';
            }

            return createOpenAI(config);
        }

        // Default to OpenAI
        return createOpenAI({ apiKey: effectiveKey });
    }

    /**
     * Generates simple text response from an LLM
     * @param {object} params
     * @param {string} params.prompt - User prompt
     * @param {string} params.model - Model ID (e.g. 'gpt-4o')
     * @param {string} [params.system] - System prompt
     * @param {number} [params.maxTokens]
     * @param {number} [params.temperature]
     * @param {string} [params.provider] - 'openai', 'grok', etc.
     * @param {string} [params.apiKey] - Optional custom key
     */
    async generateText({
        prompt,
        model,
        system,
        maxTokens,
        temperature,
        provider = 'openai',
        apiKey,
    }) {
        try {
            const providerInstance = this.getProvider(provider, apiKey);

            // Construct model reference. e.g. openai('gpt-4-turbo')
            const modelRef = providerInstance(model);

            const { text, usage, finishReason } = await generateText({
                model: modelRef,
                prompt: prompt,
                system: system,
                maxTokens: maxTokens,
                temperature: temperature,
            });

            return {
                text,
                usage,
                finishReason,
            };
        } catch (error) {
            console.error('[AIService] Error generating text:', error);
            throw new Error(`AI Generation failed: ${error.message}`);
        }
    }
}

export default new AIService();
