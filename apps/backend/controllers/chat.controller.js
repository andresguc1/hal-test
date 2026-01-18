import aiService from '../services/AIService.js';

export const chatWithTools = async (req, res) => {
    try {
        const { messages, browserId } = req.body;
        // EXTRACT KEYS
        const rawKey = req.headers['x-ai-api-key'] || process.env.OPENAI_API_KEY;
        const apiKey = rawKey?.trim();
        const model = req.headers['x-ai-model'] || 'gpt-4o';
        const provider = req.headers['x-ai-provider'] || 'openai';

        if (!apiKey) {
            return res.status(401).json({ error: 'Missing API configuration.' });
        }

        // Convert frontend messages to Vercel SDK format if needed
        // But for generateText, we usually pass just the prompt or a history string.
        // generateText accepts 'prompt' string or 'messages' array (in newer versions).
        // Let's assume we pass the last user message as prompt + history in system or context.

        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user') {
            return res.status(400).json({ error: 'No user message found' });
        }

        // Construct a prompt that includes browser context info if available
        let finalPrompt = lastMessage.content;
        if (browserId) {
            finalPrompt += `\n\n[System: Active Browser ID: ${browserId}]`;
        }

        const system = `You are Hal-9001. You have direct control over the browser with ID "${browserId}". 
        If the user asks to inspect, check, or fix something, USE YOUR TOOLS. 
        Do not halluncinate selectors. Use 'inspect_page' to see reality.
        `;

        const result = await aiService.generateTextWithTools({
            prompt: finalPrompt,
            system,
            model,
            provider,
            apiKey,
            maxSteps: 10,
        });

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
