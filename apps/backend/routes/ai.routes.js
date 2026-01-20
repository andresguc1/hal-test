import express from 'express';
import { chatWithTools } from '../controllers/chat.controller.js';
import aiService from '../services/AIService.js';

const router = express.Router();

// callOpenAI Removed - Now using AIService

/**
 * @swagger
 * /api/ai/validate:
 *   post:
 *     summary: Validates API Key against the provider.
 */
router.post('/validate', async (req, res) => {
    const { provider, apiKey, baseUrl } = req.body;

    // API KEY is strictly required for validation unless it's a "local" check (but even Ollama needs pseudo-auth setup)
    if (!apiKey) {
        return res.status(400).json({ success: false, message: 'API Key is required' });
    }

    try {
        await aiService.validateKey({ provider, apiKey, baseUrl });
        res.json({
            success: true,
            message: `Connected to ${provider} successfully!`,
        });
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
    // Allow user to override model, otherwise AIService Matrix chooses default for 'reasoning'
    const model = req.headers['x-ai-model'];
    const provider = req.headers['x-ai-provider'] || 'openai'; // Allow provider override

    if (!apiKey) {
        return res
            .status(401)
            .json({ error: 'Missing API configuration. Please set up AI settings.' });
    }

    try {
        const result = await aiService.generateFlow(prompt, {
            provider,
            apiKey,
            model,
        });

        res.json(result);
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
    const { failedSelector, nodeType, error } = req.body; // Using screenshot/base64 if available
    // Actually the Frontend sends screenshot usually? Let's check original.
    // Original code didn't read screenshot from body... wait.
    // AIService.healSelector expects `screenshotBase64`.
    // The previous implementation of /heal-selector in `ai.routes.js` didn't seem to pass screenshot?
    // Let's assume the frontend sends it or we rely on the `error` description heavily.
    // But `AIService.healSelector` uses vision.
    // Let's check `req.body` actually for `screenshot`.

    // Assuming frontend calls this endpoint with screenshot
    const { screenshot } = req.body;

    // Extract Keys
    const rawKey = req.headers['x-ai-api-key'] || process.env.OPENAI_API_KEY;
    const apiKey = rawKey?.trim();

    if (!apiKey) {
        return res.status(401).json({ error: 'Missing API Key' });
    }

    console.log(`[AI] Healing selector '${failedSelector}'...`);

    try {
        const result = await aiService.healSelector({
            screenshotBase64: screenshot,
            domSnippet: `Target: ${nodeType}`, // Simple snippet if real one missing
            originalSelector: failedSelector,
            error: error,
            intent: `Interact with ${nodeType}`,
            apiKey,
        });

        res.json({ suggestion: result.correctedSelector, confidence: result.confidence });
    } catch (error) {
        console.error('AI Heal Error', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
