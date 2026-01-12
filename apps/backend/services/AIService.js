// services/AIService.js
import { generateText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

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
    /**
     * Attempts to "heal" a broken selector by analyzing the screenshot and DOM.
     * @param {object} params
     * @param {string} params.screenshotBase64 - Base64 image of the current state
     * @param {string} params.domSnippet - Simplified HTML snippet around the area
     * @param {string} params.originalSelector - The selector that failed
     * @param {string} params.error - The error message
     * @param {string} params.intent - What the action was trying to do (e.g. "click login button")
     */
    async healSelector({ screenshotBase64, domSnippet, originalSelector, error, intent, apiKey }) {
        try {
            const providerInstance = this.getProvider('openai', apiKey);
            const model = providerInstance('gpt-4o'); // Vision capable model required

            const prompt = `
            The automation failed to find an element.
            Original Selector: "${originalSelector}"
            Error: "${error}"
            Intent: "${intent}"

            Attached is the screenshot of the page and a snippet of the DOM.
            Analyze the visual elements and the DOM to find the most likely correct selector for the intended element.
            The original selector might be outdated (ID changed, class changed, etc.).
            Return a robust CSS selector that targets the visual element described by the intent.
            `;

            const { object } = await generateObject({
                model,
                schema: z.object({
                    correctedSelector: z
                        .string()
                        .describe('The corrected CSS selector found in the DOM/Image'),
                    confidence: z.number().describe('Confidence score between 0 and 1'),
                    reasoning: z
                        .string()
                        .describe('Explanation of why this element is the correct one'),
                }),
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'text',
                                text: `DOM Snippet:\n\`\`\`html\n${domSnippet}\n\`\`\``,
                            },
                            { type: 'image', image: screenshotBase64 },
                        ],
                    },
                ],
            });

            return object;
        } catch (error) {
            console.error('[AIService] Error healing selector:', error);
            return { correctedSelector: null, confidence: 0, reasoning: error.message };
        }
    }
}

export default new AIService();
