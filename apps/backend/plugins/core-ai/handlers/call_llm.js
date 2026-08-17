import aiService from '../../../services/AIService.js';
import { DEFAULT_LOCAL_MODEL } from '../../../services/LLMFactory.js';
import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';
import { fetchContext } from '../../../core/browser-utils.js';

const callLlmAction = async (req, res) => {
    try {
        const {
            prompt,
            system,
            variableName = 'llmResult',
            maxTokens,
            temperature,
            browserId,
            injectBrowserContext = false,
        } = req.body;

        // Debug headers
        console.log('[AI Debug] Received Headers:', {
            'x-ai-provider': req.headers['x-ai-provider'],
            'x-ai-model': req.headers['x-ai-model'],
            'x-ai-api-key': req.headers['x-ai-api-key']
                ? 'PRESENT (len: ' + req.headers['x-ai-api-key'].length + ')'
                : 'MISSING',
            'x-ai-base-url': req.headers['x-ai-base-url'],
        });

        // Resolve context: Read from headers
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';

        // Strictly use global config, ignore any node-level overrides
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        // --- AUTO CONTEXT INJECTION ---
        const autoContext = injectBrowserContext ? await fetchContext(req, browserId) : null;
        let resolvedPrompt = variableManager.resolve(prompt) || '';

        // Zero-Config Fallback: If prompt is empty but we have context
        if (!resolvedPrompt && autoContext) {
            resolvedPrompt =
                'Describe the visible content, main features, and purpose of this page in detail.';
        }

        if (autoContext) {
            resolvedPrompt = `[CURRENT PAGE CONTEXT]\n${autoContext}\n\n[USER PROMPT]\n${resolvedPrompt}`;
            console.log('[AI Context] Injected browser context into call_llm prompt');
        }
        // ------------------------------

        const response = await aiService.generateText({
            prompt: resolvedPrompt,
            system: system ? variableManager.resolve(system) : undefined,
            model: activeModel,
            provider: activeProvider,
            apiKey,
            baseUrl: headerBaseUrl,
            maxTokens,
            temperature,
            parentSignal: req.signal,
        });

        // Extract text from object
        const resultText = response.text ? response.text.trim() : '';

        // Set variable
        variableManager.set(variableName, resultText, req.body.runId);

        // Emit log for UI visualization
        emitLog({
            message: `AI Response: ${resultText.substring(0, 100)}${resultText.length > 100 ? '...' : ''}`,
            type: 'success',
            nodeId: req.body.nodeId || 'call_llm',
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.call_llm.success'),
            result: resultText,
            data: { response: resultText, usage: response.usage, variable: variableName },
        });
    } catch (error) {
        console.error('[ERROR] callLlmAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.call_llm.error'),
            error: error.message,
        });
    }
};

export default callLlmAction;
