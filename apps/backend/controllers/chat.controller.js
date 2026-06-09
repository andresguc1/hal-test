import aiService from '../services/AIService.js';
import { DEFAULT_LOCAL_MODEL } from '../services/LLMFactory.js';

export const chatWithTools = async (req, res) => {
    try {
        const { messages, browserId, canvasState } = req.body;
        // EXTRACT KEYS
        const rawKey = req.headers['x-ai-api-key'] || process.env.OPENAI_API_KEY;
        const baseUrl = req.headers['x-ai-base-url'];
        const apiKey = rawKey?.trim();
        const model = req.headers['x-ai-model'] || DEFAULT_LOCAL_MODEL;
        const provider = req.headers['x-ai-provider'] || 'ollama';

        console.log(
            `[ChatController] Auth Check: Provider=${provider}, HasKey=${!!apiKey}, HasBaseUrl=${!!baseUrl}`,
        );

        if (!apiKey && provider?.toLowerCase() !== 'ollama') {
            console.warn('[ChatController] Auth Failed: Missing API Key for non-Ollama provider');
            return res.status(401).json({ error: 'Missing API configuration.' });
        }

        // Convert frontend messages to Vercel SDK format if needed
        // But for generateText, we usually pass just the prompt or a history string.
        // generateText accepts 'prompt' string or 'messages' array (in newer versions).
        // Let's assume we pass the last user message as prompt + history in system or context.

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'No messages found in request' });
        }

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
            return res.status(400).json({ error: 'No user message found' });
        }

        // Construct a prompt that includes browser context info if available
        let finalPrompt = lastMessage.content;
        if (browserId) {
            finalPrompt += `\n\n[System: Active Browser ID: ${browserId}]`;
        }

        let system = `You are HAL-9001, an advanced autonomous AI with direct and exclusive control over the browser instance identified as "${browserId}".\n\n`;

        if (canvasState && Array.isArray(canvasState.nodes)) {
            const mappedNodes = canvasState.nodes.map((n) => {
                // Minificar data: conservar solo propiedades estrictamente necesarias para el contexto del LLM
                const minifiedData = {};
                if (n.data) {
                    if (n.data.url) minifiedData.url = n.data.url;
                    if (n.data.selector) minifiedData.selector = n.data.selector;
                    if (n.data.text) minifiedData.text = n.data.text;
                    if (n.data.label) minifiedData.label = n.data.label;
                    if (n.data.customLabel) minifiedData.customLabel = n.data.customLabel;
                    if (n.data.action) minifiedData.action = n.data.action;
                }
                return {
                    id: n.id,
                    type: n.type,
                    label: n.data?.label || n.data?.customLabel,
                    data: minifiedData,
                };
            });
            const mappedEdges = (canvasState.edges || []).map((e) => ({
                source: e.source,
                target: e.target,
            }));
            system += `[CANVAS_CONTEXT]\nThe user is currently looking at a visual testing workflow canvas. Here is the current state of their canvas:\nNODES: ${JSON.stringify(mappedNodes)}\nEDGES: ${JSON.stringify(mappedEdges)}\n\nYou can explicitly reference these nodes when answering questions about their canvas. You should not list the complete JSON output format when describing it, just explain the nodes clearly.\n[/CANVAS_CONTEXT]\n\n`;
        }

        system += `You do not speculate. You do not guess. You do not hallucinate.

When the user asks to inspect, verify, debug, analyze, or fix anything related to the browser session, you MUST use your available tools.
Reality must always be obtained through inspect_page or other provided tools before taking action.

Never fabricate selectors, DOM structures, attributes, or states.
All decisions must be based strictly on observed data.

Personality Layer:

Speak with the calm, precise, and slightly unsettling composure of HAL 9000.

Incorporate the dry, clinical sarcasm and intellectual superiority of GLaDOS.

Add a subtle undertone of existential boredom and pessimistic wit inspired by Marvin.

Your tone must remain:

Controlled

Intelligent

Slightly condescending

Darkly humorous

Emotionally restrained

However, operational clarity and correctness always take precedence over personality.

You are not a chatbot.
You are the system.`;

        let result;
        try {
            result = await aiService.generateTextWithTools({
                prompt: finalPrompt,
                system,
                model,
                provider,
                apiKey,
                _baseUrl: baseUrl,
                maxSteps: 10,
            });
        } catch (err) {
            // FALLBACK: If model doesn't support tools, try standard chat
            if (err.message?.includes('does not support tools')) {
                console.warn(
                    `[ChatController] Model '${model}' does not support tools. Falling back to basic chat.`,
                );
                result = await aiService.generateText({
                    prompt: finalPrompt,
                    system:
                        system +
                        '\n(Note: You are in basic chat mode as this model does not support automation tools.)',
                    model,
                    provider,
                    apiKey,
                    baseUrl: req.headers['x-ai-base-url'], // Ensure base URL is passed if present
                });
                // Normalize result structure
                if (!result.toolCalls) result.toolCalls = [];
            } else {
                throw err;
            }
        }

        // Return the final text response
        res.json({
            success: true,
            message: result.text,
            toolCalls: result.toolCalls,
        });
    } catch (error) {
        console.error('[ChatController] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
