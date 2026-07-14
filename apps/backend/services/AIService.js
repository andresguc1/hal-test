// services/AIService.js
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { playwrightMcpServer } from './PlaywrightMCPServer.js';
import { llmFactory, RECOMMENDED_LOCAL_MODELS, DEFAULT_LOCAL_MODEL } from './LLMFactory.js';

/**
 * Intenta reparar estructuras JSON comunes mal formadas por LLMs locales.
 */
const repairJson = (str) => {
    if (!str) return str;
    let fixed = str.trim();

    // Remove markdown code blocks if present (e.g. ```json ... ```)
    const markdownMatch = fixed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
    if (markdownMatch) {
        fixed = markdownMatch[1].trim();
    }

    try {
        // 1. Eliminar comas flotantes antes de cierres de llaves o corchetes
        fixed = fixed.replace(/,\s*([\]}])/g, '$1');
        // 2. Eliminar comentarios de una sola línea
        fixed = fixed.replace(/\/\/.*$/gm, '');
        return fixed;
    } catch (e) {
        return fixed;
    }
};

/**
 * Extrae el primer bloque JSON delimitado por llaves de una cadena de texto.
 */
const extractJson = (str) => {
    if (!str) return '{}';
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return str.substring(firstBrace, lastBrace + 1);
    }
    return str;
};

/**
 * Robustly parses tool calls inside XML-like tags <tool_call name="...">JSON</tool_call>,
 * even if the closing tag is missing or the content is malformed.
 */
const parseToolCalls = (text) => {
    if (!text) return [];
    const toolCalls = [];
    const regex = /<tool_call([^>]*)>/g;
    let match;
    const matches = [];
    while ((match = regex.exec(text)) !== null) {
        matches.push({
            index: match.index,
            attributes: match[1],
            contentStart: regex.lastIndex,
        });
    }

    for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const next = matches[i + 1];

        let contentEnd = text.length;
        if (next) {
            contentEnd = next.index;
        }

        let chunk = text.slice(current.contentStart, contentEnd);

        // If there is a closing tag, cut the chunk there
        const closeTagIndex = chunk.indexOf('</tool_call>');
        if (closeTagIndex !== -1) {
            chunk = chunk.slice(0, closeTagIndex);
        }

        // Try to extract name from attributes
        let toolName = null;
        const nameMatch = current.attributes.match(/name=["']([^"']+)["']/);
        if (nameMatch) {
            toolName = nameMatch[1];
        }

        toolCalls.push({
            name: toolName,
            content: chunk.trim(),
            raw: text.slice(
                current.index,
                current.contentStart + chunk.length + (closeTagIndex !== -1 ? 12 : 0),
            ),
        });
    }
    return toolCalls;
};

/**
 * Servicio Central de IA
 * Wraps Vercel AI SDK for text generation and structured output.
 */
class AIService {
    // getProvider removed in favor of LLMFactory.getProviderInstance

    selectBestModel(taskType, preferredProvider) {
        const providerLower = preferredProvider?.toLowerCase();

        if (providerLower === 'openrouter') {
            return { provider: 'openrouter', model: 'google/gemini-2.0-flash-001' };
        }

        if (providerLower === 'openai') {
            const model =
                taskType === 'reasoning' || taskType === 'coding' ? 'gpt-4o' : 'gpt-4o-mini';
            return { provider: 'openai', model };
        }

        if (providerLower === 'anthropic' || providerLower === 'claude') {
            const model =
                taskType === 'reasoning' || taskType === 'coding'
                    ? 'claude-3-7-sonnet-latest'
                    : 'claude-3-5-sonnet-latest';
            return { provider: 'anthropic', model };
        }

        if (providerLower === 'google' || providerLower === 'gemini') {
            const model =
                taskType === 'reasoning' || taskType === 'coding'
                    ? 'gemini-2.5-pro'
                    : 'gemini-2.0-flash';
            return { provider: 'google', model };
        }

        // Default to Ollama for everything else locally
        const ollamaModel = process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
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
            throw llmFactory.mapError(error);
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
        browserId, // Fallback browserId parameter
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
You have access to tools that can manipulate the Visual Canvas and inspect the active browser page. If you need to use a tool to fulfill the user's request, include a <tool_call> tag in your response.
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
7. read_canvas_state: {} (Reads current canvas nodes and edges)
8. inspect_page: { "browserId": "browserId", "strategy": "accessibility" | "html" } (Retrieves the page structural tree or DOM)
9. suggest_selector: { "browserId": "browserId", "description": "element description" } (Finds a CSS selector for a description)
10. highlight_element: { "browserId": "browserId", "selector": "css selector" } (Highlights element on page)

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

                const parsedCalls = parseToolCalls(text);
                let hasParseError = false;
                let errorDetails = '';

                for (const call of parsedCalls) {
                    let toolName = call.name;
                    let argsString = call.content;

                    // Try to extract name from attributes
                    if (!toolName) {
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
                        // Fallback 2: Check if first word matches a known tool name
                        const firstWordMatch = argsString.match(
                            /^([a-zA-Z0-9_-]+)(?:\s+([\s\S]*))?$/,
                        );
                        if (firstWordMatch) {
                            const candidateName = firstWordMatch[1];
                            if (
                                tools[candidateName] ||
                                candidateName === 'read_canvas_state' ||
                                candidateName === 'get_canvas_state'
                            ) {
                                toolName = candidateName;
                                argsString = (firstWordMatch[2] || '{}').trim();
                            }
                        }
                    }

                    if (!toolName) {
                        console.warn(
                            `[AIService] Failed to extract tool name from match: ${call.raw}`,
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
                            try {
                                const extracted = extractJson(argsString);
                                const repaired = repairJson(extracted);
                                parsedArgs = JSON.parse(repaired);
                            } catch (secondErr) {
                                if (argsString.trim() === '') {
                                    parsedArgs = {};
                                } else {
                                    throw secondErr;
                                }
                            }
                        }

                        // Unwrap array if LLM wrapped the tool argument in a list: [{...}]
                        if (
                            parsedArgs &&
                            Array.isArray(parsedArgs) &&
                            parsedArgs.length === 1 &&
                            typeof parsedArgs[0] === 'object'
                        ) {
                            parsedArgs = parsedArgs[0];
                        }

                        if (parsedArgs && typeof parsedArgs === 'object') {
                            // Fallback browserId resolution
                            if (browserId) {
                                if (
                                    !parsedArgs.browserId ||
                                    parsedArgs.browserId === 'id' ||
                                    parsedArgs.browserId === 'default' ||
                                    parsedArgs.browserId === 'active'
                                ) {
                                    parsedArgs.browserId = browserId;
                                }
                            }
                        } else {
                            parsedArgs = {};
                            if (browserId) {
                                parsedArgs.browserId = browserId;
                            }
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
                                function: { name: toolName, arguments: JSON.stringify(parsedArgs) },
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
                const parsedCalls = parseToolCalls(text);
                for (const call of parsedCalls) {
                    text = text.replace(call.raw, '');
                }
                text = text.trim();
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

            const providerLower = provider?.toLowerCase();
            const isCloud = [
                'openrouter',
                'openai',
                'anthropic',
                'claude',
                'google',
                'gemini',
            ].includes(providerLower);

            if (isCloud) {
                // If apiKey is NOT a key/alias and we don't have it, throw error unless we have an env key fallback
                const finalKey =
                    apiKey ||
                    (providerLower === 'openrouter'
                        ? process.env.OPENROUTER_API_KEY
                        : providerLower === 'openai'
                          ? process.env.OPENAI_API_KEY
                          : providerLower === 'anthropic' || providerLower === 'claude'
                            ? process.env.ANTHROPIC_API_KEY
                            : providerLower === 'google' || providerLower === 'gemini'
                              ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
                              : null);

                if (!finalKey) {
                    throw new Error(`API Key is required for ${provider}`);
                }

                const providerInstance = llmFactory.getProviderInstance(
                    apiKey || provider,
                    provider,
                    baseUrl,
                );

                // Select default validation model per provider
                let validationModel = model;
                if (!validationModel) {
                    if (providerLower === 'openrouter')
                        validationModel = 'google/gemini-2.0-flash-001';
                    else if (providerLower === 'openai') validationModel = 'gpt-4o-mini';
                    else if (providerLower === 'anthropic' || providerLower === 'claude')
                        validationModel = 'claude-3-5-haiku-latest';
                    else if (providerLower === 'google' || providerLower === 'gemini')
                        validationModel = 'gemini-1.5-flash';
                }

                const modelRef = providerInstance(validationModel);

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
                    throw llmFactory.mapError(valErr);
                }
                return true;
            }

            // For Ollama, resolve the model name using our smart resolver first!
            const validationModelInput = model || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
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
            return health;
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
            const trimmedModel = requestedModel?.trim() || '';
            const health = await this.healthCheck({ baseUrl });
            if (!health.ollamaRunning) return trimmedModel; // Let it fail normally if not running

            const availableModels = health.models || [];
            if (availableModels.length === 0) return trimmedModel;

            // 1. Exact match
            if (availableModels.includes(trimmedModel)) return trimmedModel;

            // 2. Case-insensitive exact match
            const exactCi = availableModels.find(
                (m) => m.toLowerCase() === trimmedModel.toLowerCase(),
            );
            if (exactCi) return exactCi;

            // 3. Prefix match (e.g. "gemma" matches "gemma3:latest")
            const prefixMatch = availableModels.find(
                (m) =>
                    m.startsWith(`${trimmedModel}:`) ||
                    m.startsWith(`${trimmedModel}3`) ||
                    m.includes(trimmedModel),
            );
            if (prefixMatch) {
                console.log(
                    `[AIService] Resolved Ollama model '${trimmedModel}' to '${prefixMatch}'`,
                );
                return prefixMatch;
            }

            // 4. Default to client-optimized models first, then gemma3, then first available
            if (trimmedModel === 'ollama' || trimmedModel === 'local') {
                for (const recommended of RECOMMENDED_LOCAL_MODELS) {
                    const found = availableModels.find((m) => m.includes(recommended));
                    if (found) return found;
                }
                const gemma = availableModels.find((m) => m.includes('gemma3'));
                return gemma || availableModels[0];
            }

            // 5. Ultimate fallback: if requested model is not found, return the trimmedModel directly
            // so that the validation/health-check system can report it as missing (and prompt user to run "ollama pull ...")
            console.log(
                `[AIService] Requested Ollama model '${trimmedModel}' not found in local tags.`,
            );
            return trimmedModel;
        } catch (e) {
            console.warn(`[AIService] Failed to resolve Ollama model: ${e.message}`);
            return requestedModel?.trim();
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
        model = process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL,
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

            // 1. Check if the currently selected/requested model is recommended/client-optimized
            const isModelRecommended = RECOMMENDED_LOCAL_MODELS.some(
                (optModel) =>
                    model === optModel ||
                    model.startsWith(`${optModel}:`) ||
                    model.startsWith(`${optModel}-`),
            );

            // 2. Check if any recommended client-optimized models are installed
            const installedOptimized = RECOMMENDED_LOCAL_MODELS.filter((optModel) =>
                result.models.some(
                    (m) =>
                        m === optModel ||
                        m.startsWith(`${optModel}:`) ||
                        m.startsWith(`${optModel}-`),
                ),
            );

            if (!isModelRecommended) {
                result.warning = `The selected model '${model}' is not a recommended client-optimized model (e.g., ${RECOMMENDED_LOCAL_MODELS.join(', ')}). Running larger models locally may cause high latency or freeze your screen.`;
            } else if (installedOptimized.length === 0) {
                result.warning = `You do not have any recommended client-optimized models installed (e.g., ${RECOMMENDED_LOCAL_MODELS.join(', ')}). Running larger models locally may cause high latency or freeze your screen. We strongly suggest pulling one with 'ollama pull ${DEFAULT_LOCAL_MODEL}'`;
            }

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

    /**
     * Advanced Tiered Selector Healing with Cache Alignment
     * Layer 2: Prefix Stabilization for Ollama (KV Cache optimization)
     * Layer 3: Tiered Prompt Escalation (Fast Pass -> Self-Correction -> Fuzzy Fallback)
     */
    async healSelector({
        _screenshotBase64,
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
        retryCount = 0,
        previousSelectors = [],
    }) {
        try {
            let selected = { provider, model: forcedModel };
            if (!forcedModel || !provider) {
                selected = this.selectBestModel(forcedModel ? 'reasoning' : 'local', provider);
            }

            const activeProvider = provider || selected.provider;
            let activeModel = forcedModel || selected.model;

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

            // Layer 2: Cache Alignment (Prefix Stabilization)
            // System prompt and DOM layout are static and at the beginning.
            const systemPrompt = `You are a Senior QA Automation Expert.
Repair the failing Playwright selector based on the dense DOM context below.

DOM CONTEXT (Interactive elements):
${domSnippet || 'No DOM available'}`;

            // Layer 3: Tiered Prompt Escalation
            let tierInstructions = '';
            let maxTokens = 150;
            let temperature = 0.1;

            if (retryCount === 0) {
                // Tier 1: Fast Pass
                tierInstructions = `TIER 1 (Fast Pass): Identify the element matching intent: "${intent}".
Original failing selector: "${originalSelector}"
Response Format: Return ONLY raw JSON: {"correctedSelector": "css", "confidence": 0.9}`;
            } else if (retryCount === 1) {
                // Tier 2: Self-Correction Log Inversion
                maxTokens = 200;
                temperature = 0.2;
                const failedList = previousSelectors.join(', ');
                tierInstructions = `TIER 2 (Self-Correction): The following selectors failed: [${failedList}]. 
Re-evaluate the dense layout data, avoid these signatures, and extract an alternative structural locator.
Response Format: Return ONLY raw JSON: {"correctedSelector": "css", "confidence": 0.8, "reasoning": "..."}`;
            } else {
                // Tier 3: Fuzzy/Coordinate Fallback
                maxTokens = 250;
                temperature = 0.4;
                tierInstructions = `TIER 3 (Fuzzy Fallback): Structural locators failed.
Locate the element purely via fuzzy text matching or its relative position in the DOM sequence.
Response Format: Return ONLY raw JSON: {"correctedSelector": "text=...", "confidence": 0.7}`;
            }

            // Layer 2: Dynamic error context is appended at the ABSOLUTE END
            const prompt = `${tierInstructions}\n\n[DYNAMIC ERROR CONTEXT]\nFailed Selector: "${originalSelector}"\nError: "${error}"`;

            console.log(
                `[AIService] Healing Tier ${retryCount + 1}. Provider: ${activeProvider}. maxTokens: ${maxTokens}`,
            );

            if (activeProvider === 'ollama') {
                const timeoutSignal = AbortSignal.timeout(customTimeout || 25000);
                const combinedSignal = parentSignal
                    ? AbortSignal.any
                        ? AbortSignal.any([parentSignal, timeoutSignal])
                        : parentSignal
                    : timeoutSignal;

                const { text } = await generateText({
                    model: modelRef,
                    system: systemPrompt, // System prompt contains the static DOM tree
                    prompt, // Prompt contains the dynamic tier/error instructions
                    temperature,
                    maxTokens,
                    abortSignal: combinedSignal,
                });

                console.log(
                    `[AIService] Ollama Tier ${retryCount + 1} response: ${text.substring(0, 200)}...`,
                );

                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const parsed = JSON.parse(jsonMatch[0]);
                        const corrected = parsed.correctedSelector || parsed.new_selector || null;

                        return {
                            correctedSelector: corrected,
                            alternative_selectors: [corrected].filter(Boolean),
                            confidence: parsed.confidence || (corrected ? 0.7 : 0),
                            reasoning: parsed.reasoning || `Tier ${retryCount + 1} repair`,
                            tier: retryCount + 1,
                        };
                    } catch (pErr) {
                        console.warn(`[AIService] Tier ${retryCount + 1} JSON parse failed.`);
                    }
                }

                return {
                    correctedSelector: null,
                    confidence: 0,
                    reasoning: 'Failed to parse Tier response',
                };
            }

            // Cloud fallback (unchanged but using tiered prompt)
            const { object } = await generateObject({
                model: modelRef,
                system: systemPrompt,
                schema: z.object({
                    correctedSelector: z.string(),
                    confidence: z.number(),
                    reasoning: z.string().optional(),
                }),
                prompt,
                abortSignal: parentSignal || AbortSignal.timeout(customTimeout || 60000),
            });

            return { ...object, tier: retryCount + 1 };
        } catch (error) {
            console.error(`[AIService] Tier ${retryCount + 1} Error:`, error);
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
        temperature = 0.7,
        expectedFormat = 'json',
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
                `[AIService] Generating structured data. Using: ${activeProvider}/${activeModel} (format: ${expectedFormat}, temp: ${temperature})`,
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

            // If a non-JSON format (like csv or text) is requested, we must use generateText
            if (expectedFormat && expectedFormat.toLowerCase() !== 'json') {
                const { text } = await generateText({
                    model: modelRef,
                    prompt: description,
                    temperature: Number(temperature),
                    maxTokens: maxTokens ? Number(maxTokens) : undefined,
                    abortSignal: combinedSignal,
                });
                return text ? text.trim() : '';
            }

            // Ollama: structured output via prompt Engineering (generateObject might fail)
            if (activeProvider === 'ollama') {
                const prompt = `Produce a JSON object matching this description: ${description}. 
                Ensure the output is valid JSON.`;

                const { text } = await generateText({
                    model: modelRef,
                    prompt,
                    temperature: Number(temperature),
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
                temperature: Number(temperature),
                maxTokens: maxTokens ? Number(maxTokens) : undefined,
                abortSignal: combinedSignal,
            });

            return object;
        } catch (error) {
            console.error('[AIService] Error in generateStructured:', error);
            throw llmFactory.mapError(error);
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
            throw llmFactory.mapError(error);
        }
    }
}

export default new AIService();
export { repairJson, parseToolCalls };
