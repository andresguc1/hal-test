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
        // Lazy initialization map
    }

    /**
     * Get or create a provider instance based on the configuration
     * @param {string} providerName - 'openai', 'google', 'anthropic', 'grok'
     * @param {string} apiKey - API Key specifically for this request or from env
     * @returns {object} - The model provider instance
     */
    getProvider(providerName, apiKey, baseUrl) {
        // Validation for key-based providers
        if (
            ['openai', 'google', 'anthropic', 'grok', 'groq'].includes(providerName) &&
            !apiKey &&
            !process.env.OPENAI_API_KEY
        ) {
            // Only throw if strictly required. Some environments might rely on implicit auth (like vertex) but here we stick to simple API Key checks.
            // We can relax this check or make it provider specific.
            // For now, let's just check if apiKey is provided via arguments for dynamic usage.
        }

        const effectiveKey = apiKey || process.env.OPENAI_API_KEY;

        switch (providerName) {
            case 'google': {
                // Create a custom Google provider instance with the key
                const google = createGoogleGenerativeAI({
                    apiKey: effectiveKey,
                });
                return google;
            }

            case 'anthropic': {
                const anthropic = createAnthropic({
                    apiKey: effectiveKey,
                });
                return anthropic;
            }

            case 'ollama':
                // Ollama uses OpenAI compatible interface usually, but we need to point to localhost
                return createOpenAI({
                    baseURL: baseUrl || 'http://localhost:11434/v1',
                    apiKey: 'ollama', // Ollama doesn't care about key usually
                });

            case 'groq':
                return createOpenAI({
                    baseURL: 'https://api.groq.com/openai/v1',
                    apiKey: effectiveKey,
                });

            case 'grok':
                return createOpenAI({
                    baseURL: 'https://api.x.ai/v1',
                    apiKey: effectiveKey,
                });

            case 'openai':
            default:
                return createOpenAI({ apiKey: effectiveKey });
        }
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
        baseUrl,
    }) {
        try {
            const providerInstance = this.getProvider(provider, apiKey, baseUrl);

            // Construct model reference. e.g. openai('gpt-4-turbo')
            const modelRef = providerInstance(model);

            console.log(`[AIService] Generating text with provider: ${provider}, model: ${model}`);

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
     * Generates text with access to MCP Tools
     * This is the "Brain" mode for the Chatbot.
     */
    async generateTextWithTools({
        prompt,
        model,
        system,
        provider = 'openai',
        apiKey,
        _baseUrl,
        maxSteps = 5,
    }) {
        try {
            // "apiKey" here might be an Alias now thanks to the new Factory
            // If the frontend sends an Alias in the headers, we pass it here.
            // For backward compatibility, if 'apiKey' looks like a sk- key, we might need a bypass?
            // The Factory currently expects an Alias or falls back to Env.
            // If the user sends a RAW key (legacy), our factory logic needs to handle it?
            // For security, we want to STOP sending raw keys.
            // BUT, for now, let's assume 'apiKey' is the identifier (Alias/ID).

            // Note: The controller extracts 'x-ai-api-key' and passes it as 'apiKey'.
            // In the new system, this 'apiKey' header should contain the ALIAS/ID.

            // Refactored to pass 'provider' as fallback for Legacy Raw Keys
            const providerInstance = llmFactory.getProviderInstance(apiKey || provider, provider);

            const modelRef = providerInstance(model);

            // Get tools from our local MCP Server
            const tools = playwrightMcpServer.getToolDefinitions();

            console.log(`[AIService] Generating with TOOLS (${provider}/${model})`);

            const { text, toolCalls, toolResults, finishReason } = await generateText({
                model: modelRef,
                prompt,
                system:
                    system ||
                    "You are Hal-9001, an intelligent automation assistant. You have access to the browser state via tools. Use 'inspect_page' to see the current page, and 'suggest_selector' to help find elements. Always ask for confirmation before taking destructive actions.",
                tools,
                maxSteps,
            });

            return { text, toolCalls, toolResults, finishReason };
        } catch (error) {
            console.error('[AIService] Error generating with tools:', error);
            throw llmFactory.mapError(error);
        }
    }

    /**
     * Validates an API Key by making a lightweight call
     */
    async validateKey({ provider, apiKey, baseUrl }) {
        try {
            // Check provider validity via basic call
            const providerInstance = this.getProvider(provider, apiKey, baseUrl);

            // Pick a cheap model for validation
            let modelId = 'gpt-3.5-turbo';
            if (provider === 'google') modelId = 'gemini-1.5-flash';
            if (provider === 'anthropic') modelId = 'claude-3-haiku-20240307';
            if (provider === 'ollama') modelId = 'llama3'; // User should ensure model exists

            const modelRef = providerInstance(modelId);
            await generateText({
                model: modelRef,
                prompt: 'Hello',
                maxTokens: 1,
            });
            return true;
        } catch (e) {
            throw new Error(e.message);
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
    /**
     * Generates a HAL Flow (Nodes + Edges) from a natural language prompt.
     * @param {string} prompt - The user's intent (e.g. "Login to google")
     * @param {object} config - { provider, apiKey, model, baseUrl }
     */
    async generateFlow(prompt, config) {
        try {
            const { provider = 'openai', apiKey, model, baseUrl } = config;
            const providerInstance = this.getProvider(provider, apiKey, baseUrl);

            // Default models if not specified
            const modelId = model || (provider === 'google' ? 'gemini-1.5-flash' : 'gpt-4o');
            const modelRef = providerInstance(modelId);

            const systemPrompt = `
            You are HAL-9001, an expert automation engineer for the "Hal Test" platform.
            Your goal is to convert natural language instructions into a flow of automation nodes.

            ### Available Node Types (Use EXACTLY these names):
            - **launch_browser**: Starts a new browser session. (MANDATORY start).
            - **open_url**: Navigates to a URL. Data: { url: "https://..." }
            - **click**: Clicks an element. Data: { selector: "#id" }
            - **type_text**: Types text. Data: { selector: "#id", text: "hello" }
            - **wait_visible**: Waits for element. Data: { selector: "#id" }
            - **take_screenshot**: Captures screen. No data needed.
            - **close_browser**: Ends the session.

            ### Output Format:
            Return a JSON object with:
            - action: "generate_flow" (or "text_response" if you cannot generate a flow).
            - message: A short explanation of what you built.
            - flow_json: The nodes and edges.
            `;

            console.log(
                `[AIService] Generating flow with ${provider}/${modelId} for prompt: "${prompt}"`,
            );

            // Define valid node types from the project constants
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
                    action: z.enum(['text_response', 'generate_flow']).describe('Action to take'),
                    message: z.string().describe('Message to the user'),
                    flow_json: z
                        .object({
                            nodes: z.array(
                                z.object({
                                    id: z.string().describe("Unique ID e.g. 'n1'"),
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
                        .optional()
                        .describe('The generated flow, required if action is generate_flow'),
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
