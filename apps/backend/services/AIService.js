// services/AIService.js
import { generateText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
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
        // We now exclusively use Ollama as the provider.
        // Even if another provider is requested, we redirect to Ollama's OpenAI-compatible endpoint.
        let ollamaUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
        if (!ollamaUrl.endsWith('/v1')) {
            ollamaUrl = `${ollamaUrl.replace(/\/$/, '')}/v1`;
        }

        return createOpenAI({
            compatibility: 'compatible',
            baseURL: ollamaUrl,
            apiKey: 'ollama',
        });
    }

    /**
     * Matrix de Selección de Modelos (2026 Standard)
     * @param {string} taskType - 'coding' | 'massive_context' | 'reasoning' | 'local'
     * @param {string} [preferredProvider] - Optional override
     */
    selectBestModel(_taskType, _preferredProvider) {
        // Consolidate to Gemma 3 via Ollama
        const ollamaModel = process.env.OLLAMA_MODEL || 'gemma3:latest';
        return { provider: 'ollama', model: ollamaModel };
    }

    async generateText({
        prompt,
        model,
        system,
        maxTokens,
        temperature = 0.7,
        provider,
        apiKey,
        baseUrl,
        taskType = 'reasoning',
    }) {
        try {
            // Apply Matrix Logic if no specific model/provider forced
            let selected = { provider, model };
            if (!model || !provider) {
                selected = this.selectBestModel(taskType, provider);
            }

            let activeProvider = provider || selected.provider;
            let activeModel = model || selected.model;

            // Sanitize received model: if it's a known non-Ollama model, ignore it to force fallback
            const legacyModels = [
                'gemini',
                'gpt4',
                'gpt-4',
                'claude',
                'openai',
                'google',
                'anthropic',
            ];
            if (activeModel && legacyModels.includes(activeModel.toLowerCase())) {
                activeModel = null;
            }

            if (!activeModel || activeProvider !== 'ollama') {
                const best = this.selectBestModel(taskType);
                activeProvider = best.provider;
                activeModel = best.model;
            }

            // --- SMART RESOLUTION FOR OLLAMA ---
            if (activeProvider === 'ollama' && activeModel) {
                activeModel = await this.resolveOllamaModel({
                    baseUrl: baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
                    requestedModel: activeModel,
                });
            }

            const providerInstance = this.getProvider(activeProvider, apiKey, baseUrl);
            const modelRef = providerInstance(activeModel);

            const { text, usage, finishReason } = await generateText({
                model: modelRef,
                prompt,
                system,
                maxTokens: maxTokens ? Number(maxTokens) : undefined,
                temperature,
                providerOptions: {
                    openai: {
                        max_tokens: maxTokens ? Number(maxTokens) : undefined,
                    },
                },
            });

            return { text, usage, finishReason };
        } catch (error) {
            console.error('[AIService] Error generating text:', error);
            const activeProvider = provider || 'unknown';
            const activeModel = model || 'unknown';
            throw new Error(
                `AI Generation failed (${activeProvider}/${activeModel}): ${error.message}`,
            );
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
                _baseUrl,
            );
            const modelRef = providerInstance(activeModel);
            const tools = playwrightMcpServer.getToolDefinitions();

            console.log(
                `[AIService] Tools Generation. Task: ${taskType} -> Using: ${activeProvider}/${activeModel}`,
            );

            const { text, toolCalls, toolResults, finishReason } = await generateText({
                model: modelRef,
                prompt,
                system: system || 'You are HAL-9001.',
                tools,
                maxSteps,
                apiKey: 'ollama',
                baseUrl: _baseUrl,
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
            // We only validate Ollama availability now
            const validationModel = model || process.env.OLLAMA_MODEL || 'gemma3:latest';
            const health = await this.healthCheck({
                baseUrl: baseUrl || 'http://localhost:11434',
                model: validationModel,
            });
            if (!health.ollamaRunning) {
                throw new Error('Ollama is not running. Please start Ollama with: ollama serve');
            }
            if (!health.modelLoaded) {
                throw new Error(
                    `Model '${validationModel}' is not available. Pull it with: ollama pull ${validationModel}`,
                );
            }
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
     * Resolves a partial model name to an exact Ollama model tag.
     * Example: "gemma" -> "gemma3:latest"
     */
    async resolveOllamaModel({ baseUrl, requestedModel }) {
        try {
            const health = await this.healthCheck({ baseUrl });
            if (!health.ollamaRunning) return requestedModel; // Let it fail normally if not running

            const availableModels = health.models || [];
            if (availableModels.length === 0) return requestedModel;

            // 1. Exact match
            if (availableModels.includes(requestedModel)) return requestedModel;

            // 2. Case-insensitive exact match
            const exactCi = availableModels.find(
                (m) => m.toLowerCase() === requestedModel.toLowerCase(),
            );
            if (exactCi) return exactCi;

            // 3. Prefix match (e.g. "gemma" matches "gemma3:latest")
            const prefixMatch = availableModels.find(
                (m) =>
                    m.startsWith(`${requestedModel}:`) ||
                    m.startsWith(`${requestedModel}3`) ||
                    m.includes(requestedModel),
            );
            if (prefixMatch) {
                console.log(
                    `[AIService] Resolved Ollama model '${requestedModel}' to '${prefixMatch}'`,
                );
                return prefixMatch;
            }

            // 4. Default to gemma3 if available, otherwise first available
            if (requestedModel === 'ollama' || requestedModel === 'local') {
                const gemma = availableModels.find((m) => m.includes('gemma3'));
                return gemma || availableModels[0];
            }

            return requestedModel;
        } catch (e) {
            console.warn(`[AIService] Failed to resolve Ollama model: ${e.message}`);
            return requestedModel;
        }
    }

    /**
     * Health Check for Ollama
     * Pings the Ollama API to verify reachability and model availability.
     * @param {{ baseUrl: string, model: string }} options
     * @returns {{ ollamaRunning: boolean, modelLoaded: boolean, models: string[], error?: string }}
     */
    async healthCheck({
        baseUrl = 'http://localhost:11434',
        model = process.env.OLLAMA_MODEL || 'gemma3:latest',
    }) {
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
                selected = this.selectBestModel(forcedModel ? 'reasoning' : 'local', provider);
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

    /**
     * Genera datos estructurados basados en una descripción.
     */
    async generateStructured({ description, schema, provider, model, apiKey, keys, maxTokens }) {
        try {
            const taskType = 'reasoning';
            let selected = { provider, model };
            if (!model || !provider) {
                selected = this.selectBestModel(taskType, provider);
            }

            let activeProvider = provider || selected.provider;
            let activeModel = model || selected.model;

            // --- SMART RESOLUTION FOR OLLAMA ---
            if (activeProvider === 'ollama' && activeModel) {
                activeModel = await this.resolveOllamaModel({
                    baseUrl:
                        (keys && keys.baseUrl) ||
                        process.env.OLLAMA_BASE_URL ||
                        'http://localhost:11434',
                    requestedModel: activeModel,
                });
            }

            const effectiveKey = apiKey || (keys && keys[activeProvider]);

            console.log(
                `[AIService] Generating structured data. Using: ${activeProvider}/${activeModel}`,
            );

            const providerInstance = this.getProvider(activeProvider, effectiveKey);
            const modelRef = providerInstance(activeModel);

            // Ollama: structured output via prompt Engineering (generateObject might fail)
            if (activeProvider === 'ollama') {
                const prompt = `Produce a JSON object matching this description: ${description}. 
                Ensure the output is valid JSON.`;

                const { text } = await generateText({
                    model: modelRef,
                    prompt,
                    temperature: 0.2,
                    maxTokens: maxTokens ? Number(maxTokens) : undefined,
                    providerOptions: {
                        openai: {
                            max_tokens: maxTokens ? Number(maxTokens) : undefined,
                        },
                    },
                });

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) return JSON.parse(jsonMatch[0]);
                throw new Error('Failed to parse structured data from Ollama result');
            }

            const { object } = await generateObject({
                model: modelRef,
                schema,
                prompt: description,
                maxTokens: maxTokens ? Number(maxTokens) : undefined,
            });

            return object;
        } catch (error) {
            console.error('[AIService] Error in generateStructured:', error);
            throw error;
        }
    }

    /**
     * Valida contenido basado en criterios semánticos.
     */
    async validate({ content, criteria, provider, model, apiKey, keys, maxTokens }) {
        try {
            const taskType = 'reasoning';
            let selected = { provider, model };
            if (!model || !provider) {
                selected = this.selectBestModel(taskType, provider);
            }

            let activeProvider = provider || selected.provider;
            let activeModel = model || selected.model;

            // --- SMART RESOLUTION FOR OLLAMA ---
            if (activeProvider === 'ollama' && activeModel) {
                activeModel = await this.resolveOllamaModel({
                    baseUrl:
                        (keys && keys.baseUrl) ||
                        process.env.OLLAMA_BASE_URL ||
                        'http://localhost:11434',
                    requestedModel: activeModel,
                });
            }

            const effectiveKey = apiKey || (keys && keys[activeProvider]);

            const providerInstance = this.getProvider(activeProvider, effectiveKey);
            const modelRef = providerInstance(activeModel);

            const prompt = `Validate the following content against the given criteria.
            Content: "${content}"
            Criteria: "${criteria}"
            
            Return a JSON object with:
            - isValid: boolean
            - reason: string
            - confidence: number (0-1)`;

            if (activeProvider === 'ollama') {
                const { text } = await generateText({
                    model: modelRef,
                    prompt,
                    temperature: 0.1,
                    maxTokens: maxTokens ? Number(maxTokens) : undefined,
                    providerOptions: {
                        openai: {
                            max_tokens: maxTokens ? Number(maxTokens) : undefined,
                        },
                    },
                });
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) return JSON.parse(jsonMatch[0]);
                return {
                    isValid: false,
                    reason: 'Failed to parse validation result from Ollama',
                    confidence: 0,
                };
            }

            const { object } = await generateObject({
                model: modelRef,
                schema: z.object({
                    isValid: z.boolean(),
                    reason: z.string(),
                    confidence: z.number(),
                }),
                prompt,
                maxTokens: maxTokens ? Number(maxTokens) : undefined,
            });

            return object;
        } catch (error) {
            console.error('[AIService] Error in semantic validation:', error);
            throw error;
        }
    }
}

export default new AIService();
