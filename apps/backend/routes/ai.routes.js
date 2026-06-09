import express from 'express';
import { chatWithTools } from '../controllers/chat.controller.js';
import aiService from '../services/AIService.js';
import { browserService } from '../services/browser.service.js';
import selectorHealer from '../services/SelectorHealer.js';
import { DEFAULT_LOCAL_MODEL } from '../services/LLMFactory.js';

const router = express.Router();

// callOpenAI Removed - Now using AIService

/**
 * @swagger
 * /api/ai/validate:
 *   post:
 *     summary: Validates API Key against the provider.
 */
router.post('/validate', async (req, res) => {
    const { provider, apiKey, baseUrl, model } = req.body;

    const providerLower = provider?.toLowerCase();
    const hasEnvKey =
        (providerLower === 'openai' && process.env.OPENAI_API_KEY) ||
        (providerLower === 'openrouter' && process.env.OPENROUTER_API_KEY) ||
        ((providerLower === 'anthropic' || providerLower === 'claude') &&
            process.env.ANTHROPIC_API_KEY) ||
        ((providerLower === 'google' || providerLower === 'gemini') &&
            (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY));

    if (!apiKey && provider !== 'ollama' && !hasEnvKey) {
        return res.status(400).json({ success: false, message: 'API Key is required' });
    }

    try {
        const validationResult = await aiService.validateKey({ provider, apiKey, baseUrl, model });
        res.json({
            success: true,
            message: `Connected to ${provider} successfully!`,
            ...(typeof validationResult === 'object' ? validationResult : {}),
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

    if (!apiKey && provider?.toLowerCase() !== 'ollama') {
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

    // Assuming frontend calls this endpoint with screenshot and DOM
    const { screenshot, domSnippet } = req.body;

    // Extract Keys and Params
    const rawKey = req.headers['x-ai-api-key'] || process.env.OPENAI_API_KEY;
    const apiKey = rawKey?.trim();
    const provider = req.headers['x-ai-provider'] || 'ollama';
    const model = req.headers['x-ai-model'] || DEFAULT_LOCAL_MODEL;
    const browserId = req.headers['x-browser-id'] || req.body.browserId;

    if (!apiKey && provider !== 'ollama') {
        return res.status(401).json({ error: 'Missing API Key' });
    }

    let finalDomSnippet = domSnippet;
    let retrievalMethod = domSnippet ? 'Frontend provided' : 'None';

    // AUTO-RETRIEVE DOM IF MISSING
    if (!finalDomSnippet) {
        try {
            const browserEntry = browserService.get(browserId) || browserService.getLatest();
            if (browserEntry) {
                const browser = browserEntry.browser || browserEntry;
                const contexts = browser.contexts();
                if (contexts.length > 0) {
                    const pages = contexts[0].pages();
                    if (pages.length > 0) {
                        const activePage = pages[pages.length - 1];
                        console.log(
                            `[AI] Fetching live DOM for healing context (Browser: ${browserId || 'latest'})...`,
                        );
                        finalDomSnippet = await activePage.evaluate(
                            selectorHealer.getCompressionScript(),
                        );
                        retrievalMethod = 'Live Fetch';
                    }
                }
            }
        } catch (domError) {
            console.error('[AI] Could not fetch live DOM:', domError.message);
        }
    }

    console.log(`[AI] Starting Heal:
      - Provider/Model: ${provider}/${model}
      - Selector: ${failedSelector}
      - DOM Retrieval: ${retrievalMethod}
      - DOM Length: ${finalDomSnippet?.length || 0} characters
      - Has Screenshot: ${!!screenshot}`);

    try {
        const result = await aiService.healSelector({
            screenshotBase64: screenshot,
            domSnippet: finalDomSnippet || `Target element type: ${nodeType}`,
            originalSelector: failedSelector,
            error: error,
            // 🎯 SEMANTIC INTENT: Help the AI by telling it the node's purpose (e.g. 'Enter Username')
            intent: `${nodeType} action (Targeting "${failedSelector}"). 
Response Format (Strict JSON - Return ONLY the JSON block, no markdown, no conversational text):
{
  "correctedSelector": "the best single CSS selector",
  "alternative_selectors": ["list of up to 3 ranked css selectors"],
  "confidence": number (0.0 to 1.0),
  "reasoning": "detailed explanation of why the original failed and how the new one was found",
  "is_breaking_change": boolean
}

IMPORTANT: Do not wrap the JSON in markdown code blocks. Return it as RAW text.
If no element is found, return {"correctedSelector": null, "confidence": 0, "reasoning": "No matching element found in DOM context"}`,
            provider,
            model,
            apiKey,
        });

        console.log(
            `[AI] Heal Success: Suggested '${result.correctedSelector}' (Confidence: ${result.confidence})`,
        );
        res.json({ suggestion: result.correctedSelector, confidence: result.confidence });
    } catch (error) {
        console.error('AI Heal Error', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     summary: Health check for Ollama (or any local LLM)
 *     parameters:
 *       - in: query
 *         name: baseUrl
 *         schema:
 *           type: string
 *         description: Ollama base URL
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Model to check availability for
 */
router.get('/health', async (req, res) => {
    let baseUrl = req.query.baseUrl || 'http://127.0.0.1:11434';
    if (baseUrl.includes('localhost')) baseUrl = baseUrl.replace('localhost', '127.0.0.1');
    const model = req.query.model || DEFAULT_LOCAL_MODEL;

    try {
        const result = await aiService.healthCheck({ baseUrl, model });
        res.json({
            success: result.ollamaRunning && result.modelLoaded,
            ...result,
        });
    } catch (error) {
        console.error('[AI] Health Check Error:', error);
        res.status(500).json({
            success: false,
            ollamaRunning: false,
            modelLoaded: false,
            error: error.message,
        });
    }
});

/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Ask AI - Debug console for testing LLM connectivity
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *               model:
 *                 type: string
 *               baseUrl:
 *                 type: string
 *               temperature:
 *                 type: number
 */
router.post('/ask', async (req, res) => {
    const { prompt, messages, model, baseUrl, temperature } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
        return res.status(400).json({ error: 'Prompt or messages is required' });
    }

    // Resolve provider/model from headers or body
    const provider = req.headers['x-ai-provider'] || 'ollama';
    const activeModel = model || req.headers['x-ai-model'] || DEFAULT_LOCAL_MODEL;
    let activeBaseUrl = baseUrl || req.headers['x-ai-base-url'] || 'http://127.0.0.1:11434';
    if (activeBaseUrl.includes('localhost'))
        activeBaseUrl = activeBaseUrl.replace('localhost', '127.0.0.1');
    const apiKey = req.headers['x-ai-api-key'] || 'ollama';
    const temp = temperature !== undefined ? temperature : 0.7;

    // Construct prompt from history if messages provided
    let finalPrompt = prompt;
    if (messages && messages.length > 0) {
        // Use full history as prompt if prompt is missing, or append prompt to history
        const historyText = messages
            .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n');
        finalPrompt = prompt ? `${historyText}\nUser: ${prompt}` : historyText;
    }

    console.log(`[AI] Ask AI request. Provider: ${provider}, Model: ${activeModel}`);

    try {
        const result = await aiService.generateText({
            prompt: finalPrompt,
            model: activeModel,
            provider,
            apiKey,
            baseUrl: activeBaseUrl,
            temperature: temp,
            system: 'You are HAL-9001, a QA automation expert assistant. Answer testing-related queries concisely and accurately.',
            taskType: 'reasoning',
        });

        res.json({
            success: true,
            text: result.text,
            usage: result.usage,
            model: activeModel,
            provider,
        });
    } catch (error) {
        console.error('[AI] Ask AI Error:', error);

        // Classify errors for better frontend UX
        const msg = error.message?.toLowerCase() || '';
        let statusCode = 500;
        let userMessage = error.message;

        if (msg.includes('econnrefused') || msg.includes('fetch failed')) {
            statusCode = 503;
            userMessage = 'Cannot connect to Ollama. Is it running? Start with: ollama serve';
        } else if (msg.includes('model') && msg.includes('not found')) {
            statusCode = 404;
            userMessage = `Model '${activeModel}' not found. Pull it with: ollama pull ${activeModel}`;
        } else if (msg.includes('timeout')) {
            statusCode = 504;
            userMessage = 'Request timed out. The model may be loading or the server is busy.';
        }

        res.status(statusCode).json({ success: false, error: userMessage });
    }
});

export default router;
