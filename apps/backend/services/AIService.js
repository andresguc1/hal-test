// services/AIService.js
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { playwrightMcpServer } from './PlaywrightMCPServer.js';
import { llmFactory } from './LLMFactory.js';

/**
 * Intenta reparar estructuras JSON comunes mal formadas por LLMs locales.
 */
const repairJson = (str) => {
    if (!str) return str;
    try {
        // 1. Eliminar comas flotantes antes de cierres de llaves o corchetes
        let fixed = str.replace(/,\s*([\]}])/g, '$1');
        // 2. Eliminar comentarios de una sola línea
        fixed = fixed.replace(/\/\/.*$/gm, '');
        return fixed;
    } catch (e) {
        return str;
    }
};

/**
 * Servicio Central de IA
 * Wraps Vercel AI SDK for text generation and structured output.
 */
class AIService {
    // getProvider removed in favor of LLMFactory.getProviderInstance

    /**
     * Matrix de Selección de Modelos (2026 Standard)
     * @param {string} taskType - 'coding' | 'massive_context' | 'reasoning' | 'local'
     * @param {string} [preferredProvider] - Optional override
     */
    selectBestModel(taskType, preferredProvider) {
        // If user already specified a valid provider (like openrouter), respect it.
        // We only provide defaults if not specified.
        if (preferredProvider === 'openrouter') {
            return { provider: 'openrouter', model: 'google/gemini-2.0-flash-001' };
        }

        // Default to Ollama for everything else locally
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
        parentSignal,
    }) {
        try {
            // Apply Matrix Logic if no specific model/provider forced
            let selected = { provider, model };
            if (!model || !provider) {
                selected = this.selectBestModel(taskType, provider);
            }

            let activeProvider = provider || selected.provider;
            let activeModel = model || selected.model;

            // --- SMART RESOLUTION FOR OLLAMA ---
            if (activeProvider === 'ollama' && activeModel) {
                activeModel = await this.resolveOllamaModel({
                    baseUrl: baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
                    requestedModel: activeModel,
                });
            }

            const providerInstance = llmFactory.getProviderInstance(
                apiKey || activeProvider,
                activeProvider,
                baseUrl,
            );
            const modelRef = providerInstance(activeModel);

            const timeoutSignal = AbortSignal.timeout(300000);
            const combinedSignal = parentSignal
                ? AbortSignal.any
                    ? AbortSignal.any([parentSignal, timeoutSignal])
                    : parentSignal
                : timeoutSignal;

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
                abortSignal: combinedSignal, // 5 minute timeout for local models/slow requests
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
        parentSignal,
    }) {
        try {
            // Apply Matrix
            let selected = { provider, model };
            if (!model || !provider) {
                selected = this.selectBestModel(taskType, provider);
            }

            const activeProvider = provider || selected.provider;
            let activeModel = model || selected.model;

            // --- SMART RESOLUTION FOR OLLAMA ---
            if (activeProvider === 'ollama' && activeModel) {
                activeModel = await this.resolveOllamaModel({
                    baseUrl: _baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
                    requestedModel: activeModel,
                });
            }

            const providerInstance = llmFactory.getProviderInstance(
                apiKey || activeProvider,
                activeProvider,
                _baseUrl,
            );
            const modelRef = providerInstance(activeModel);
            const tools = playwrightMcpServer.getToolDefinitions();

            // Inject Canvas Tools
            // DYNAMIC IMPORT ONLY ONCE to avoid circular deps if canvasTools tries to use socket early
            const { canvasTools } = await import('../mcp/canvasTools.js');
            for (const tool of canvasTools) {
                tools[tool.name] = {
                    description: tool.description,
                    parameters: tool.inputSchema?.properties
                        ? z.object(
                              Object.fromEntries(
                                  Object.entries(tool.inputSchema.properties).map(([k, v]) => {
                                      // Simple mapping for standard z types based on our definition
                                      let zType = z.any();
                                      if (v.type === 'string') zType = z.string();
                                      if (v.type === 'number') zType = z.number();
                                      if (v.type === 'boolean') zType = z.boolean();
                                      if (v.type === 'object') zType = z.record(z.any());
                                      if (v.type === 'array') zType = z.array(z.any());

                                      if (v.description) zType = zType.describe(v.description);
                                      return [k, zType];
                                  }),
                              ),
                          )
                        : z.object({}),
                    execute: tool.handler,
                };
            }

            console.log(
                `[AIService] Tools Generation. Task: ${taskType} -> Using: ${activeProvider}/${activeModel}`,
            );

            let activeSystem = system || 'You are HAL-9001.';
            if (activeProvider === 'ollama') {
                activeSystem += `\n\n[OLLAMA_TOOL_INSTRUCTIONS]
You have access to tools that can manipulate the Visual Canvas. If you need to use a tool to fulfill the user's request, include a <tool_call> tag in your response.
If the user is just asking a question, analyzing the canvas, or making conversation, answer normally and DO NOT use a <tool_call>.
Format for tool usage:
<tool_call name="tool_name">{ "argument_key": "value" }</tool_call>

Supported Tools:
1. inject_nodes: { "nodes": [{ "type": "NODE_TYPE", "data": { ... } }] } (Recommended for building flows)
   -> SUPPORTED NODE_TYPES: launch_browser, open_url, click, type_text, wait_visible, take_screenshot, close_browser.
2. add_node_to_canvas: { "type": "NODE_TYPE", "data": { ... } }
3. connect_nodes: { "sourceId": "id1", "targetId": "id2" }
4. execute_playwright_cmd: { "browserId": "id", "code": "..." }
5. remove_node: { "id": "node_id" }
6. update_node: { "id": "node_id", "data": { "url": "...", "selector": "..." } }

IMPORTANT DIRECTIONS:
- Always create the COMPLETE sequence of nodes for the requested flow at once in a single response step.
- Connect them together or use inject_nodes with the full array of desired actions so they are chained correctly.`;
            }

            let activePrompt = prompt;
            if (activeProvider === 'ollama') {
                activePrompt = `${activeSystem}\n\n[USER_INSTRUCTIONS]\n${prompt}`;
            }
            let retryCount = 0;
            const maxRetries = 2;
            let response;
            let text = '';
            let toolCalls = [];
            let toolResults = [];
            let finishReason = '';

            while (retryCount <= maxRetries) {
                console.log(`[AIService] Step Attempt ${retryCount + 1} for ${activeProvider}`);

                const timeoutSignal = AbortSignal.timeout(300000);
                const combinedSignal = parentSignal
                    ? AbortSignal.any
                        ? AbortSignal.any([parentSignal, timeoutSignal])
                        : parentSignal
                    : timeoutSignal;

                response = await generateText({
                    model: modelRef,
                    prompt: activePrompt,
                    system: activeSystem,
                    ...(activeProvider !== 'ollama' ? { tools, maxSteps } : {}),
                    apiKey: 'ollama',
                    baseUrl: _baseUrl,
                    abortSignal: combinedSignal, // 5 minute timeout for local models/multi-steps
                });

                text = response.text;
                toolCalls = response.toolCalls || [];
                toolResults = response.toolResults || [];
                finishReason = response.finishReason;

                if (activeProvider !== 'ollama') {
                    break; // No fallback needed for cloud providers
                }

                const toolCallRegex = /<tool_call([^>]*)>([\s\S]*?)<\/tool_call>/g;
                let match;
                let hasParseError = false;
                let errorDetails = '';

                while ((match = toolCallRegex.exec(text)) !== null) {
                    let toolName = null;
                    let argsString = match[2].trim();

                    // Try to extract name from attributes
                    const nameMatch = match[1].match(/name=["']([^"']+)["']/);
                    if (nameMatch) {
                        toolName = nameMatch[1];
                    } else {
                        // Fallback: Check if content starts with name="tool_name"
                        const contentNameMatch = argsString.match(
                            /^name=["']([^"']+)["']\s*(\{[\s\S]*\})/,
                        );
                        if (contentNameMatch) {
                            toolName = contentNameMatch[1];
                            argsString = contentNameMatch[2].trim(); // Rest is the JSON
                        }
                    }

                    if (!toolName) {
                        console.warn(
                            `[AIService] Failed to extract tool name from match: ${match[0]}`,
                        );
                        continue;
                    }

                    try {
                        let parsedArgs;
                        try {
                            parsedArgs = JSON.parse(argsString);
                        } catch (initialError) {
                            console.warn(
                                `[AIService] JSON.parse failed, attempting repair for ${toolName}`,
                            );
                            const repaired = repairJson(argsString);
                            parsedArgs = JSON.parse(repaired); // Will throw to outer catch if fails
                        }

                        if (toolName === 'inject_nodes' && parsedArgs && parsedArgs.nodes) {
                            try {
                                const { GraphValidator } = await import('./GraphValidator.js');
                                const { fixed, flow } = GraphValidator.repair({
                                    nodes: parsedArgs.nodes,
                                    edges: [],
                                });
                                if (fixed) {
                                    console.log(
                                        '[AIService] 🔧 inject_nodes arg auto-repaired by GraphValidator',
                                    );
                                    parsedArgs.nodes = flow.nodes;
                                }
                            } catch (vErr) {
                                console.error(
                                    '[AIService] GraphValidator tool check failed:',
                                    vErr,
                                );
                            }
                        }

                        console.log(`[AIService] Fallback Tool Call: ${toolName}`, parsedArgs);
                        if (tools[toolName] && typeof tools[toolName].execute === 'function') {
                            const result = await tools[toolName].execute(parsedArgs);
                            const callId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                            toolCalls.push({
                                id: callId,
                                type: 'function',
                                function: { name: toolName, arguments: argsString },
                            });
                            toolResults.push({
                                toolCallId: callId,
                                toolName,
                                args: parsedArgs,
                                result,
                            });
                        }
                    } catch (e) {
                        console.error(`[AIService] Fallback tool error for ${toolName}:`, e);
                        hasParseError = true;
                        errorDetails += `\n- Tool: ${toolName}. Error: ${e.message}`;
                    }
                }

                if (!hasParseError) {
                    break; // Success! No parse errors.
                }

                retryCount++;
                if (retryCount <= maxRetries) {
                    console.log(
                        `[AIService] Retrying due to JSON parse error (${retryCount}/${maxRetries})`,
                    );
                    activePrompt += `\n\n[SYSTEM WARNING: El bloque JSON en tu <tool_call> anterior fue inválido. Errores encontrados:${errorDetails}\nPor favor responde SOLO con el bloque <tool_call> corregido o una explicación con el comando corregido.]`;
                }
            }

            console.log(`[AIService] Raw text from ${activeProvider}:`, text);

            // Strip tags from text before returning to keep frontend output clean
            if (activeProvider === 'ollama') {
                const stripRegex = /<tool_call([^>]*)>([\s\S]*?)<\/tool_call>/g;
                text = text.replace(stripRegex, '').trim();
            }

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

            if (provider === 'openrouter') {
                if (!apiKey) throw new Error('API Key is required for OpenRouter');
                const providerInstance = llmFactory.getProviderInstance(apiKey, provider, baseUrl);
                const modelRef = providerInstance(model || 'google/gemini-2.0-flash-001');

                // Ultra-robust timeout using Promise.race to avoid "Delay aborted" crash
                const validationPromise = generateText({
                    model: modelRef,
                    prompt: 'ping',
                    maxTokens: 1,
                });

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Validation Timeout (10s)')), 10000),
                );

                try {
                    await Promise.race([validationPromise, timeoutPromise]);
                } catch (valErr) {
                    // We only rethrow if it's NOT a timeout or a known benign error
                    if (valErr.message.includes('Timeout')) throw valErr;
                    console.warn('[AIService] Benign validation warning:', valErr.message);
                }
                return true;
            }

            // For Ollama, resolve the model name using our smart resolver first!
            const validationModelInput = model || process.env.OLLAMA_MODEL || 'gemma3:latest';
            const activeBaseUrl = baseUrl || 'http://127.0.0.1:11434';
            const validationModel = await this.resolveOllamaModel({
                baseUrl: activeBaseUrl,
                requestedModel: validationModelInput,
            });

            const health = await this.healthCheck({
                baseUrl: activeBaseUrl,
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

            // 5. Ultimate transparent fallback: if requested model is not found, auto-fallback to first available!
            console.log(
                `[AIService] Requested Ollama model '${requestedModel}' not found in local tags. Auto-falling back to first available model: '${availableModels[0]}'`,
            );
            return availableModels[0];
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
        baseUrl = 'http://127.0.0.1:11434',
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
        baseUrl,
        parentSignal,
    }) {
        try {
            // Apply Matrix Logic if no specific model/provider forced
            let selected = { provider, model: forcedModel };
            if (!forcedModel || !provider) {
                selected = this.selectBestModel(forcedModel ? 'reasoning' : 'local', provider);
            }

            const activeProvider = provider || selected.provider;
            let activeModel = forcedModel || selected.model;

            // --- SMART RESOLUTION FOR OLLAMA ---
            if (activeProvider === 'ollama' && activeModel) {
                activeModel = await this.resolveOllamaModel({
                    baseUrl: baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
                    requestedModel: activeModel,
                });
            }

            console.log(
                `[AIService] Healing selector. Using: ${activeProvider}/${activeModel} (Timeout: ${customTimeout || 'default'}ms)`,
            );

            const providerInstance = llmFactory.getProviderInstance(
                apiKey || activeProvider,
                activeProvider,
                baseUrl,
            );
            const modelRef = providerInstance(activeModel);

            const prompt = `You are a Senior QA Automation Expert and Selector Repair Specialist.
The automation failed to find an element in the browser.

FAILED SELECTOR: "${originalSelector}"
ERROR MESSAGE: "${error}"
INTENT: "${intent}"

DOM CONTEXT (Interactive elements with structural breadcrumbs):
${domSnippet || 'No DOM available'}

ANALYSIS STEPS:
1. Identify why the original selector failed (e.g., dynamic ID, structure change).
2. Look for the element that matches the "Intent" and resembles the "Original Selector".
3. Propose up to 3 alternative CSS selectors, ranked by robustness. STRICT PRIORITIZATION:
   - PRIORITY 1 (Best): Custom semantic attributes like [data-test], [data-testid], [data-qa], [data-cy].
   - PRIORITY 2 (Very Good): Unique ARIA attributes ([aria-label], [role="button"], etc.) that clearly identify the element's function.
   - PRIORITY 3 (Good): Tag names combined with unique stable classes or partial text matches.
   - PRIORITY 4 (Fallback): Structural paths, but only if they start from a stable ID (e.g., #header-id >> .btn).
   - AVOID: Auto-generated dynamic classes (e.g., .css-1ax2b3), absolute indexes (e.g., div:nth-child(5)), and fragile structural-only paths.

Response Format (Strict JSON - Return ONLY the JSON block, no markdown, no conversational text):
{
  "correctedSelector": "the best single CSS selector",
  "alternative_selectors": ["list of up to 3 ranked css selectors"],
  "confidence": number (0.0 to 1.0),
  "reasoning": "detailed explanation of why the original failed and how the new one was found",
  "is_breaking_change": boolean
}

IMPORTANT: Do not wrap the JSON in markdown code blocks. Return it as RAW text.
If no element is found, return {"correctedSelector": null, "confidence": 0, "reasoning": "No matching element found in DOM context"}
`;

            console.log(`[AIService] Context size: DOM=${domSnippet?.length || 0} chars`);

            // CRITICAL: Ollama does NOT support generateObject (tool-call based structured output).
            // It hangs indefinitely. Use generateText + manual JSON parsing for local providers.
            if (activeProvider === 'ollama') {
                console.log(
                    `[AIService] Using generateText (Ollama mode) — avoids generateObject hang.`,
                );

                const timeoutSignal = AbortSignal.timeout(customTimeout || 25000);
                const combinedSignal = parentSignal
                    ? AbortSignal.any
                        ? AbortSignal.any([parentSignal, timeoutSignal])
                        : parentSignal
                    : timeoutSignal;

                const { text } = await generateText({
                    model: modelRef,
                    prompt,
                    temperature: 0.1, // Low temperature for stability
                    abortSignal: combinedSignal,
                });

                console.log(`[AIService] Ollama raw response: ${text.substring(0, 300)}...`);

                // Robust JSON parsing - handles markdown code blocks or raw JSON
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        const corrected =
                            parsed.correctedSelector ||
                            parsed.new_selector ||
                            parsed.suggested_selector ||
                            (parsed.alternative_selectors && parsed.alternative_selectors[0]) ||
                            null;

                        return {
                            correctedSelector: corrected,
                            alternative_selectors:
                                parsed.alternative_selectors ||
                                [corrected].slice(0, 1).filter(Boolean),
                            confidence: parsed.confidence || (corrected ? 0.7 : 0),
                            reasoning: parsed.reasoning || 'AI repaired based on DOM analysis',
                            is_breaking_change: !!parsed.is_breaking_change,
                        };
                    } catch (pErr) {
                        console.warn(
                            '[AIService] Failed to parse candidate JSON. Attempting fallback extraction...',
                            pErr.message,
                        );

                        // Fallback: try to find anything that looks like "correctedSelector": "..."
                        const selectorMatch = text.match(/"correctedSelector":\s*"([^"]+)"/);
                        if (selectorMatch) {
                            return {
                                correctedSelector: selectorMatch[1],
                                alternative_selectors: [selectorMatch[1]],
                                confidence: 0.5,
                                reasoning: 'Extracted via fallback regex',
                            };
                        }
                    }
                }

                return {
                    correctedSelector: null,
                    alternative_selectors: [],
                    confidence: 0,
                    reasoning: 'Could not parse structured AI response',
                };
            }

            // Cloud providers: use generateObject for structured output (faster, more reliable)
            console.log(`[AIService] Using generateObject (cloud mode).`);

            const content = [{ type: 'text', text: prompt }];

            if (screenshotBase64) {
                content.push({ type: 'image', image: screenshotBase64 });
            }

            const timeoutSignal = AbortSignal.timeout(customTimeout || 60000);
            const combinedSignal = parentSignal
                ? AbortSignal.any
                    ? AbortSignal.any([parentSignal, timeoutSignal])
                    : parentSignal
                : timeoutSignal;

            const { object } = await generateObject({
                model: modelRef,
                schema: z.object({
                    correctedSelector: z.string(),
                    alternative_selectors: z.array(z.string()),
                    confidence: z.number(),
                    reasoning: z.string(),
                    is_breaking_change: z.boolean(),
                }),
                messages: [{ role: 'user', content }],
                abortSignal: combinedSignal,
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

            let activeProvider = provider || selected.provider;
            let activeModel = model || selected.model;

            // --- SMART RESOLUTION FOR OLLAMA ---
            if (activeProvider === 'ollama' && activeModel) {
                activeModel = await this.resolveOllamaModel({
                    baseUrl: baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
                    requestedModel: activeModel,
                });
            }

            console.log(
                `[AIService] Generating Flow. Using Matrix: ${activeProvider}/${activeModel}`,
            );

            const providerInstance = llmFactory.getProviderInstance(
                apiKey || activeProvider,
                activeProvider,
                baseUrl,
            );
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

            // Ollama: structured output via prompt Engineering (generateObject might fail)
            if (activeProvider === 'ollama') {
                const ollamaPrompt = `Convert natural language instructions into a visual flow object JSON.
                Instructions: "${prompt}"

                ** STRICT WORKFLOW RULES **
                1. A web flow or automation sequence ALWAYS starts with a \`launch_browser\` node followed by an \`open_url\` node.
                2. Execute intermediary actions (e.g., \`type_text\`, \`click\`, etc) as needed to fulfil the instruction.
                3. Place a \`take_screenshot\` node right BEFORE the end.
                4. Always end the flow sequence with a \`close_browser\` node.
                5. Connect all nodes together in logical order using \`edges\` (\`source\` and \`target\`).

                Supported Nodes: launch_browser, open_url, click, type_text, wait_visible, take_screenshot, close_browser.
                
                You must return a raw JSON object with:
                - action: "generate_flow"
                - message: "A brief descriptive message"
                - flow_json: { nodes: [...], edges: [...] }
                  - nodes: [{ id: "1", type: "launch_browser", data: { url: "https://...", label: "Brief visual label" } }]
                  - edges: [{ id: "e1", source: "1", target: "2" }]

                Return ONLY valid JSON. Do not write markdown. DO NOT include any introductory, explanatory, or conversational text.`;

                const { text } = await generateText({
                    model: modelRef,
                    prompt: ollamaPrompt,
                    temperature: 0.2,
                    abortSignal: AbortSignal.timeout(300000), // 5 minute timeout for local models
                });

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    let parsed;
                    try {
                        parsed = JSON.parse(jsonMatch[0]);
                    } catch (e) {
                        console.warn(
                            '[AIService] JSON.parse failed inside generateFlow, attempting repair',
                        );
                        const repaired = repairJson(jsonMatch[0]);
                        parsed = JSON.parse(repaired);
                    }

                    try {
                        const { GraphValidator } = await import('./GraphValidator.js');
                        if (parsed && parsed.flow_json) {
                            const { fixed, flow } = GraphValidator.repair(parsed.flow_json);
                            if (fixed) {
                                console.log('[AIService] 🔧 Flow auto-repaired by GraphValidator');
                                parsed.flow_json = flow;
                            }
                        }
                    } catch (vErr) {
                        console.error('[AIService] GraphValidator execution failed:', vErr);
                    }

                    return parsed;
                }
                throw new Error('Failed to parse flow JSON from Ollama result');
            }

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
    async generateStructured({
        description,
        schema,
        provider,
        model,
        apiKey,
        keys,
        maxTokens,
        parentSignal,
    }) {
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
                        'http://127.0.0.1:11434',
                    requestedModel: activeModel,
                });
            }

            const effectiveKey = apiKey || (keys && keys[activeProvider]);

            console.log(
                `[AIService] Generating structured data. Using: ${activeProvider}/${activeModel}`,
            );

            const providerInstance = llmFactory.getProviderInstance(
                effectiveKey || activeProvider,
                activeProvider,
                keys?.baseUrl,
            );
            const modelRef = providerInstance(activeModel);

            const timeoutSignal = AbortSignal.timeout(300000);
            const combinedSignal = parentSignal
                ? AbortSignal.any
                    ? AbortSignal.any([parentSignal, timeoutSignal])
                    : parentSignal
                : timeoutSignal;

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
                    abortSignal: combinedSignal,
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
                abortSignal: combinedSignal,
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
    async validate({ content, criteria, provider, model, apiKey, keys, maxTokens, parentSignal }) {
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
                        'http://127.0.0.1:11434',
                    requestedModel: activeModel,
                });
            }

            const effectiveKey = apiKey || (keys && keys[activeProvider]);

            const providerInstance = llmFactory.getProviderInstance(
                effectiveKey || activeProvider,
                activeProvider,
                keys?.baseUrl,
            );
            const modelRef = providerInstance(activeModel);

            const prompt = `Validate the following content against the given criteria.
            Content: "${content}"
            Criteria: "${criteria}"
            
            Return a JSON object with:
            - isValid: boolean
            - reason: string
            - confidence: number (0-1)`;

            const timeoutSignal = AbortSignal.timeout(300000);
            const combinedSignal = parentSignal
                ? AbortSignal.any
                    ? AbortSignal.any([parentSignal, timeoutSignal])
                    : parentSignal
                : timeoutSignal;

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
                    abortSignal: combinedSignal,
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
                abortSignal: combinedSignal,
            });

            return object;
        } catch (error) {
            console.error('[AIService] Error in semantic validation:', error);
            throw error;
        }
    }
}

export default new AIService();
