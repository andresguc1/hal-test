import express from 'express';
import { chatWithTools } from '../controllers/chat.controller.js';

const router = express.Router();

/**
 * Helper to call OpenAI API
 */
async function callOpenAI(apiKey, model, messages, jsonMode = false) {
    const cleanKey = apiKey?.trim();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            response_format: jsonMode ? { type: 'json_object' } : undefined,
            temperature: 0.2,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * @swagger
 * /api/ai/validate:
 *   post:
 *     summary: Validates API Key against the provider.
 */
router.post('/validate', async (req, res) => {
    const { provider, apiKey, model } = req.body;
    const cleanKey = apiKey?.trim();

    if (!cleanKey) {
        return res.status(400).json({ success: false, message: 'API Key is required' });
    }

    try {
        if (provider === 'openai') {
            // Validate using a minimal model list call which is cheap and fast
            const response = await fetch('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: { Authorization: `Bearer ${cleanKey}` },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('OpenAI Validation Error:', errorData);
                throw new Error(
                    errorData.error?.message || `OpenAI Verification Failed: ${response.status}`,
                );
            }

            return res.json({
                success: true,
                message: 'Connected to OpenAI',
                verifiedModel: model,
            });
        }

        // TODO: Implement Anthropic validation
        res.json({ success: true, message: 'Provider validation mocked (not implemented yet)' });
    } catch (error) {
        console.error('Validation Exception:', error);
        res.status(401).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with Hal-9001 using MCP Tools
 */
router.post('/chat', chatWithTools);

/**
 * @swagger
 * /api/ai/generate-flow:
 */
router.post('/generate-flow', async (req, res) => {
    const { prompt } = req.body;
    // EXTRACT KEYS FROM HEADERS (Sent by Frontend or default from ENV)
    const rawKey = req.headers['x-ai-api-key'] || process.env.OPENAI_API_KEY;
    const apiKey = rawKey?.trim();
    const model = req.headers['x-ai-model'] || 'gpt-4o';

    if (!apiKey) {
        return res
            .status(401)
            .json({ error: 'Missing API configuration. Please set up AI settings.' });
    }

    console.log(`[AI] Generating flow with ${model}...`);

    const systemPrompt = `
    You are an automation expert. 
    Convert the user's Natural Language request into a JSON structure representing a UI Automation Flow.
    
    Output Format (JSON):
    {
      "nodes": [
        { "id": "1", "type": "open_url", "position": { "x": 0, "y": 0 }, "data": { "configuration": { "url": "..." } } },
        { "id": "2", "type": "click", "position": { "x": 300, "y": 0 }, "data": { "configuration": { "selector": "..." } } }
      ],
      "edges": [
         { "id": "e1-2", "source": "1", "target": "2", "type": "custom", "animated": true }
      ]
    }
    
    Supported Node Types:
    - open_url (url)
    - click (selector)
    - type_text (selector, text)
    - wait_for_timeout (duration)
    - take_screenshot
    
    Keep the flow linear (x += 300). Ensure IDs are unique strings.
    `;

    try {
        const result = await callOpenAI(
            apiKey,
            model,
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            true,
        );

        res.json(JSON.parse(result));
    } catch (error) {
        console.error('AI Gen Error', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/ai/heal-selector:
 */
router.post('/heal-selector', async (req, res) => {
    const { failedSelector, nodeType, error } = req.body;
    const rawKey = req.headers['x-ai-api-key'] || process.env.OPENAI_API_KEY;
    const apiKey = rawKey?.trim();
    const model = req.headers['x-ai-model'] || 'gpt-4o';

    if (!apiKey) {
        return res.status(401).json({ error: 'Missing API Key' });
    }

    console.log(`[AI] Healing selector '${failedSelector}'...`);

    const systemPrompt = `
    You are a testing expert. A selector failed during execution.
    Analyze the failed selector and the error. Suggest a ROBUST alternative (XPath or CSS).
    
    Output JSON: { "suggestion": "..." }
    `;

    try {
        const result = await callOpenAI(
            apiKey,
            model,
            [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Failed Selector: ${failedSelector}\nNode Type: ${nodeType}\nError: ${error}`,
                },
            ],
            true,
        );

        const json = JSON.parse(result);
        res.json({ suggestion: json.suggestion, confidence: 0.8 });
    } catch (error) {
        console.error('AI Heal Error', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
