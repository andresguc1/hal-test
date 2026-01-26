// services/AIService.js
import { generateText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { playwrightMcpServer } from './PlaywrightMCPServer.js';
import { llmFactory } from './LLMFactory.js';

/**
 * Servicio Central de IA
 * Wraps Vercel AI SDK for text generation and structured output.
 */
class AIService {
    constructor() {
        this.providers = {};
    }

    getProvider(providerName, apiKey, baseUrl) {
        if (
            ['openai', 'google', 'anthropic', 'grok', 'groq'].includes(providerName) &&
            !apiKey &&
            !process.env.OPENAI_API_KEY
        ) {
            // Validating key existence lazily
        }

        const effectiveKey = apiKey || process.env.OPENAI_API_KEY;

        switch (providerName) {
            case 'google':
                return createGoogleGenerativeAI({ apiKey: effectiveKey });
            case 'anthropic':
                return createAnthropic({ apiKey: effectiveKey });
            case 'ollama':
                return createOpenAI({
                    baseURL: baseUrl || 'http://localhost:11434/v1',
                    apiKey: 'ollama',
                });
            case 'groq':
                return createOpenAI({
                    baseURL: 'https://api.groq.com/openai/v1',
                    apiKey: effectiveKey,
                });
            case 'grok':
                return createOpenAI({ baseURL: 'https://api.x.ai/v1', apiKey: effectiveKey });
            case 'openai':
            default:
                return createOpenAI({ apiKey: effectiveKey });
        }
    }

    /**
     * Matrix de Selección de Modelos (2026 Standard)
     * @param {string} taskType - 'coding' | 'massive_context' | 'reasoning' | 'local'
     * @param {string} [preferredProvider] - Optional override
     */
    selectBestModel(taskType, preferredProvider) {
        if (preferredProvider === 'ollama')
            return { provider: 'ollama', model: 'deepseek-coder-v2' };

        switch (taskType) {
            case 'coding':
            case 'refactoring':
                // Priority #1: Claude 3.5 Sonnet
                return { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' };

            case 'massive_context':
                // Priority #1: Gemini 1.5 Pro (>50k lines)
                return { provider: 'google', model: 'gemini-1.5-pro' };

            case 'reasoning':
            case 'planning':
                // Priority #1: GPT-4o
                return { provider: 'openai', model: 'gpt-4o' };

            case 'local':
                return { provider: 'ollama', model: 'deepseek-coder-v2' };

            default:
                return { provider: 'openai', model: 'gpt-4o' };
        }
    }

    async generateText({
        prompt,
        model,
        system,
        maxTokens,
        temperature = 0.7, // Default behavior
        provider,
        apiKey,
        baseUrl,
        taskType = 'reasoning', // Default task
    }) {
        try {
            // Apply Matrix Logic if no specific model/provider forced
            let selected = { provider, model };
            if (!model || !provider) {
                selected = this.selectBestModel(taskType, provider);
            }

            // Standards Enforce: Coding temp = 0.2
            if (taskType === 'coding' || taskType === 'refactoring') {
                temperature = 0.2;
            }

            const activeProvider = provider || selected.provider;
            const activeModel = model || selected.model;

            console.log(
                `[AIService] Generating text. Task: ${taskType} -> Using: ${activeProvider}/${activeModel}, Temp: ${temperature}`,
            );

            const providerInstance = this.getProvider(activeProvider, apiKey, baseUrl);
            const modelRef = providerInstance(activeModel);

            const { text, usage, finishReason } = await generateText({
                model: modelRef,
                prompt,
                system,
                maxTokens,
                temperature,
            });

            return { text, usage, finishReason };
        } catch (error) {
            console.error('[AIService] Error generating text:', error);
            throw new Error(`AI Generation failed (${provider}/${model}): ${error.message}`);
        }
    }

    async generateTextWithTools({
        prompt,
        model,
        system,
        provider,
        apiKey,
        _baseUrl,
        maxSteps = 5,
        taskType = 'reasoning',
    }) {
        try {
            // Apply Matrix
            let selected = { provider, model };
            if (!model || !provider) {
                selected = this.selectBestModel(taskType, provider);
            }

            const activeProvider = provider || selected.provider;
            const activeModel = model || selected.model;

            const providerInstance = llmFactory.getProviderInstance(
                apiKey || activeProvider,
                activeProvider,
            );
            const modelRef = providerInstance(activeModel);
            const tools = playwrightMcpServer.getToolDefinitions();

            console.log(
                `[AIService] Tools Generation. Task: ${taskType} -> Using: ${activeProvider}/${activeModel}`,
            );

            const { text, toolCalls, toolResults, finishReason } = await generateText({
                model: modelRef,
                prompt,
                system: system || 'You are Hal-9001.',
                tools,
                maxSteps,
            });

            return { text, toolCalls, toolResults, finishReason };
        } catch (error) {
            console.error('[AIService] Error generating with tools:', error);
            throw llmFactory.mapError(error);
        }
    }

    async validateKey({ provider, apiKey, baseUrl }) {
        try {
            console.log(
                `[AIService] Validating key for provider: ${provider}, apiKey provided: ${!!apiKey}`,
            );
            const providerInstance = this.getProvider(provider, apiKey, baseUrl);

            // Standard Validation Models (Updated for 2026 Compatibility)
            let modelId = 'gpt-3.5-turbo'; // Fallback to most accessible model
            if (provider === 'google') modelId = 'gemini-pro'; // High availability fallback
            if (provider === 'anthropic') modelId = 'claude-3-5-sonnet-20240620';
            if (provider === 'ollama') modelId = 'deepseek-coder-v2';

            // Special handling removed. Using standard generateText for validation.

            const modelRef = providerInstance(modelId);
            await generateText({
                model: modelRef,
                prompt: 'Hello',
                maxTokens: 1,
            });
            return true;
        } catch (e) {
            // Enhanced error mapping recommended by user
            throw new Error(`Validation Failed: ${e.message}`);
        }
    }

    async healSelector({ screenshotBase64, domSnippet, originalSelector, error, intent, apiKey }) {
        try {
            // Vision Task -> Reasoning/Multimodal
            const selected = this.selectBestModel('reasoning', 'openai');
            const providerInstance = this.getProvider(selected.provider, apiKey);
            const model = providerInstance(selected.model);

            const prompt = `
            The automation failed to find an element.
            Original Selector: "${originalSelector}"
            Error: "${error}"
            Intent: "${intent}"

            Attached is the screenshot of the page and a snippet of the DOM.
            Analyze the visual elements and the DOM to find the most likely correct selector.
            Return a robust CSS selector.
            `;

            const { object } = await generateObject({
                model,
                schema: z.object({
                    correctedSelector: z.string(),
                    confidence: z.number(),
                    reasoning: z.string(),
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

    async generateFlow(prompt, config) {
        try {
            const { provider, apiKey, model, baseUrl } = config;

            // Matrix Logic: Flow generation is "Reasoning/Planning"
            let selected = this.selectBestModel('reasoning', provider);

            // Allow override
            const activeProvider = provider || selected.provider;
            const activeModel = model || selected.model;

            const providerInstance = this.getProvider(activeProvider, apiKey, baseUrl);
            const modelRef = providerInstance(activeModel);

            console.log(
                `[AIService] Generating Flow. Using Matrix: ${activeProvider}/${activeModel}`,
            );

            const systemPrompt = `
            You are HAL-9001. Convert Natural Language instructions into a flow of automation nodes.
            Supported Nodes: launch_browser, open_url, click, type_text, wait_visible, take_screenshot, close_browser.
            `;

            const ValidNodeTypes = z.enum([
                'launch_browser',
                'open_url',
                'click',
                'type_text',
                'wait_visible',
                'take_screenshot',
                'close_browser',
            ]);

            const { object } = await generateObject({
                model: modelRef,
                schema: z.object({
                    action: z.enum(['text_response', 'generate_flow']),
                    message: z.string(),
                    flow_json: z
                        .object({
                            nodes: z.array(
                                z.object({
                                    id: z.string(),
                                    type: ValidNodeTypes,
                                    data: z
                                        .object({
                                            selector: z.string().optional(),
                                            url: z.string().optional(),
                                            text: z.string().optional(),
                                            label: z.string().optional(),
                                        })
                                        .optional(),
                                }),
                            ),
                            edges: z.array(
                                z.object({
                                    id: z.string(),
                                    source: z.string(),
                                    target: z.string(),
                                }),
                            ),
                        })
                        .optional(),
                }),
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
            });

            return object;
        } catch (error) {
            console.error('[AIService] Error generating flow:', error);
            throw new Error(`Flow Generation failed: ${error.message}`);
        }
    }
}

export default new AIService();
