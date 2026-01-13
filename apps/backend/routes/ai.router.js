import express from 'express';
import AIService from '../services/AIService.js';

const router = express.Router();

/**
 * @swagger
 * /ai/validate:
 *   post:
 *     summary: Test AI Provider Connection
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *               apiKey:
 *                 type: string
 *               model:
 *                 type: string
 *               baseUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connection successful
 *       400:
 *         description: Connection failed
 */
router.post('/validate', async (req, res) => {
    try {
        const { provider, apiKey, model, baseUrl } = req.body;

        // Simple "Ping" prompt
        const response = await AIService.generateText({
            provider,
            apiKey,
            model, // Use specific model to test access
            prompt: "Say 'OK' if you can hear me.",
            maxTokens: 5,
            baseUrl,
        });

        res.json({ success: true, message: 'Connection successful', data: response.text });
    } catch (error) {
        console.error('AI Validation Error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /ai/generate-flow:
 *   post:
 *     summary: Generate an Automation Flow from Prompt
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *               aiConfig:
 *                 type: object
 *     responses:
 *       200:
 *         description: Generated nodes and edges
 */
router.post('/generate-flow', async (req, res) => {
    try {
        const { prompt, aiConfig } = req.body;

        if (!prompt || !aiConfig) {
            return res.status(400).json({ success: false, message: 'Missing prompt or AI config' });
        }

        const config = {
            provider: aiConfig.activeProvider,
            apiKey: aiConfig.keys[aiConfig.activeProvider],
            model: aiConfig.selectedModel,
            baseUrl: aiConfig.keys[`${aiConfig.activeProvider}_baseurl`],
        };

        const flow = await AIService.generateFlow(prompt, config);

        res.json({ success: true, data: flow });
    } catch (error) {
        console.error('Generate Flow Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
