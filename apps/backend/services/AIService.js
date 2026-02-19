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
            case 'ollama': {
                let ollamaUrl = baseUrl || 'http://localhost:11434/v1';
                if (!ollamaUrl.endsWith('/v1')) {
                    ollamaUrl = `${ollamaUrl.replace(/\/$/, '')}/v1`;
                }
                return createOpenAI({
                    baseURL: ollamaUrl,
                    apiKey: 'ollama',
                });
            }
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
        if (preferredProvider === 'ollama') return { provider: 'ollama', model: 'gemma3' };

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
                return { provider: 'ollama', model: 'gemma3' };

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

            // Standards Enforce: Coding/Local temp = 0.2
            if (taskType === 'coding' || taskType === 'refactoring' || taskType === 'local') {
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

    async validateKey({ provider, apiKey, baseUrl, model }) {
        try {
            console.log(
                `[AIService] Validating key for provider: ${provider}, apiKey provided: ${!!apiKey}`,
            );

            // For Ollama, use healthCheck first for better error messages
            if (provider === 'ollama') {
                const validationModel = model || 'gemma3';
                const health = await this.healthCheck({
                    baseUrl: baseUrl || 'http://localhost:11434',
                    model: validationModel,
                });
                if (!health.ollamaRunning) {
                    throw new Error(
                        'Ollama is not running. Please start Ollama with: ollama serve',
                    );
                }
                if (!health.modelLoaded) {
                    throw new Error(
                        `Model '${validationModel}' is not available. Pull it with: ollama pull ${validationModel}`,
                    );
                }
                return true;
            }

            const providerInstance = this.getProvider(provider, apiKey, baseUrl);

            // Standard Validation Models (Updated for 2026 Compatibility)
            let modelId = 'gpt-3.5-turbo'; // Fallback to most accessible model
            if (provider === 'google') modelId = 'gemini-pro'; // High availability fallback
            if (provider === 'anthropic') modelId = 'claude-3-5-sonnet-20240620';

            const modelRef = providerInstance(modelId);
            await generateText({
                model: modelRef,
                prompt: 'Hello',
                maxTokens: 1,
            });
            return true;
        } catch (e) {
            // Enhanced Ollama-specific error mapping
            const msg = e.message?.toLowerCase() || '';
            if (msg.includes('econnrefused') || msg.includes('fetch failed')) {
                throw new Error(
                    'Cannot connect to Ollama. Ensure it is running at the specified Base URL.',
                );
            }
            if (msg.includes('model') && msg.includes('not found')) {
                throw new Error(
                    'Model not found on Ollama. Pull it first with: ollama pull <model_name>',
                );
            }
            if (msg.includes('timeout') || msg.includes('etimedout')) {
                throw new Error(
                    'Connection timed out. Ollama may be loading the model or the server is unresponsive.',
                );
            }
            throw new Error(`Validation Failed: ${e.message}`);
        }
    }

    /**
     * Health Check for Ollama
     * Pings the Ollama API to verify reachability and model availability.
     * @param {{ baseUrl: string, model: string }} options
     * @returns {{ ollamaRunning: boolean, modelLoaded: boolean, models: string[], error?: string }}
     */
    async healthCheck({ baseUrl = 'http://localhost:11434', model = 'gemma3' }) {
        const result = {
            ollamaRunning: false,
            modelLoaded: false,
            models: [],
            error: null,
        };

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(`${baseUrl}/api/tags`, {
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!response.ok) {
                result.error = `Ollama responded with status ${response.status}`;
                return result;
            }

            const data = await response.json();
            result.ollamaRunning = true;
            result.models = (data.models || []).map((m) => m.name);

            // Check if target model is available (match by prefix, e.g. 'gemma3' matches 'gemma3:latest')
            result.modelLoaded = result.models.some(
                (m) => m === model || m.startsWith(`${model}:`),
            );

            return result;
        } catch (e) {
            const msg = e.message?.toLowerCase() || '';
            if (msg.includes('abort') || msg.includes('timeout')) {
                result.error =
                    'Connection timed out. Ollama may be starting up or is unresponsive.';
            } else if (msg.includes('econnrefused') || msg.includes('fetch failed')) {
                result.error = `Ollama is not running at ${baseUrl}. Start it with: ollama serve`;
            } else {
                result.error = e.message;
            }
            return result;
        }
    }

    async healSelector({
        screenshotBase64,
        domSnippet,
        originalSelector,
        error,
        intent,
        apiKey,
        provider,
        model: forcedModel,
        timeout: customTimeout,
    }) {
        try {
            // Apply Matrix Logic if no specific model/provider forced
            let selected = { provider, model: forcedModel };
            if (!forcedModel || !provider) {
                selected = this.selectBestModel('reasoning', provider);
            }

            const activeProvider = provider || selected.provider;
            const activeModel = forcedModel || selected.model;

            console.log(
                `[AIService] Healing selector. Using: ${activeProvider}/${activeModel} (Timeout: ${customTimeout || 'default'}ms)`,
            );

            const providerInstance = this.getProvider(activeProvider, apiKey);
            const modelRef = providerInstance(activeModel);

            const prompt = `The automation failed to find an element.
Original Selector: "${originalSelector}"
Error: "${error}"
Intent: "${intent}"

DOM Snippet:
${domSnippet || 'No DOM available'}

Analyze the DOM to find the most likely correct CSS selector for the intended element.
Return a JSON object with these exact keys:
- correctedSelector: a valid CSS selector string
- confidence: a number between 0 and 1
- reasoning: a short explanation`;

            console.log(`[AIService] Context size: DOM=${domSnippet?.length || 0} chars`);

            // CRITICAL: Ollama does NOT support generateObject (tool-call based structured output).
            // It hangs indefinitely. Use generateText + manual JSON parsing for local providers.
            if (activeProvider === 'ollama') {
                console.log(
                    `[AIService] Using generateText (Ollama mode) — avoids generateObject hang.`,
                );

                const { text } = await generateText({
                    model: modelRef,
                    prompt,
                    temperature: 0.2,
                    abortSignal: AbortSignal.timeout(customTimeout || 120000), // Respect custom timeout or 2 minutes max for local
                });

                console.log(`[AIService] Ollama raw response: ${text.substring(0, 200)}...`);

                // Parse JSON from response
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return {
                        correctedSelector:
                            parsed.correctedSelector ||
                            parsed.new_selector ||
                            parsed.selector ||
                            null,
                        confidence: parsed.confidence || 0.8,
                        reasoning: parsed.reasoning || 'AI suggestion',
                    };
                }

                return {
                    correctedSelector: null,
                    confidence: 0,
                    reasoning: 'Could not parse AI response',
                };
            }

            // Cloud providers: use generateObject for structured output (faster, more reliable)
            console.log(`[AIService] Using generateObject (cloud mode).`);

            const content = [{ type: 'text', text: prompt }];

            if (screenshotBase64) {
                content.push({ type: 'image', image: screenshotBase64 });
            }

            const { object } = await generateObject({
                model: modelRef,
                schema: z.object({
                    correctedSelector: z.string(),
                    confidence: z.number(),
                    reasoning: z.string(),
                }),
                messages: [{ role: 'user', content }],
                abortSignal: AbortSignal.timeout(customTimeout || 60000), // Respect custom or 1 minute for cloud
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
