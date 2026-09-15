import aiService from '../services/AIService.js';
import { DEFAULT_LOCAL_MODEL } from '../services/LLMFactory.js';
import {
    buildChatSystemPrompt,
    buildOllamaToolInstructions,
    HALBIN_DEFAULT_PROMPT,
} from '../config/halbinIdentity.js';

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

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'No messages found in request' });
        }

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
            return res.status(400).json({ error: 'No user message found' });
        }

        let finalPrompt = lastMessage.content;
        if (browserId) {
            finalPrompt += `\n\n[System: Active Browser ID: ${browserId}]`;
        }

        let system = buildChatSystemPrompt(browserId, canvasState);

        if (provider === 'ollama') {
            system += buildOllamaToolInstructions();
        }

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
                browserId,
            });
        } catch (err) {
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
                    baseUrl: req.headers['x-ai-base-url'],
                });
                if (!result.toolCalls) result.toolCalls = [];
            } else {
                throw err;
            }
        }

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
