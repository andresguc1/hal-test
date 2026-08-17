import { validateBrowser, getOrCreateContext } from '../../../core/browser-utils.js';
import aiService from '../../../services/AIService.js';
import { DEFAULT_LOCAL_MODEL } from '../../../services/LLMFactory.js';
import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';

const smartSelectorAction = async (req, res) => {
    try {
        const {
            browserId,
            originalSelector,
            intent,
            variableName = 'suggestedSelector',
            nodeId,
        } = req.body;

        const validation = validateBrowser(req, browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }
        const browserIdActual = validation.browserId;
        const entry = validation.entry;
        const browser = entry.browser || entry;

        const context = await getOrCreateContext(req, browser, browserIdActual);
        const pages = context.pages();
        const page = pages.length > 0 ? pages[0] : await context.newPage();

        // --- ZERO-CONFIG LOGIC ---
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        emitLog({
            message: `Healing selector with AI (${activeModel})...`,
            type: 'ai',
            nodeId,
        });

        // Extract DOM snippet for context
        const domSnippet = await page.content();

        const resolvedIntent = variableManager.resolve(intent);

        const result = await aiService.healSelector({
            domSnippet,
            originalSelector,
            intent: resolvedIntent,
            error: 'Element not found with original selector',
            provider: activeProvider,
            model: activeModel,
            apiKey,
            baseUrl: headerBaseUrl,
            timeout: 60000, // 1 minute timeout for healer
            parentSignal: req.signal,
        });

        const newSelector = result.correctedSelector || originalSelector;
        variableManager.set(variableName, newSelector, req.body.runId);

        emitLog({
            message: `Selector healed: ${newSelector} (Confidence: ${(result.confidence * 100).toFixed(0)}%)`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.smart_selector.success'),
            data: {
                suggestedSelector: newSelector,
                confidence: result.confidence,
                reasoning: result.reasoning,
            },
        });
    } catch (error) {
        console.error('[ERROR] smartSelectorAction:', error.message);
        emitLog({
            message: `Error healing selector: ${error.message}`,
            type: 'error',
            nodeId: req.body?.nodeId,
        });
        return res.status(500).json({
            success: false,
            message: req.t('actions.smart_selector.error'),
            error: error.message,
        });
    }
};

export default smartSelectorAction;
