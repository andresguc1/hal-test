import aiService from '../../../services/AIService.js';
import { DEFAULT_LOCAL_MODEL } from '../../../services/LLMFactory.js';
import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';
import { fetchContext } from '../../../core/browser-utils.js';
import { auditService } from '../../../services/AuditService.js';

const validateSemanticAction = async (req, res) => {
    try {
        const {
            browserId,
            content: rawContent,
            criteria: rawCriteria,
            expectedAnswer,
            variableName = 'semanticValid',
            maxTokens = 2048,
            nodeId,
        } = req.body;

        // --- AUTO CONTEXT INJECTION ---
        const autoContext = await fetchContext(req, browserId);
        let content = variableManager.resolve(rawContent);
        if (autoContext && (!content || content.length < 5)) {
            // If content is empty or very short, use the browser context as content
            content = autoContext;
            console.log('[AI Context] Using browser context for semantic validation');
        }
        // ------------------------------

        // --- ZERO-CONFIG LOGIC: Read from headers ---
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        emitLog({
            message: `Ejecutando validación semántica con modelo ${activeModel} (maxTokens: ${maxTokens})`,
            type: 'ai',
            nodeId,
        });

        const keys = {
            openai: req.headers['x-openai-key'] || process.env.OPENAI_API_KEY,
            anthropic: req.headers['x-anthropic-key'] || process.env.ANTHROPIC_API_KEY,
            ollama: 'ollama',
            openrouter: apiKey,
            baseUrl: headerBaseUrl,
        };

        // Resolve inputs (may contain variables like ${text})
        let criteria = variableManager.resolve(rawCriteria, req.body.runId) || '';

        // Zero-Config Fallback
        if (!criteria && autoContext) {
            criteria =
                'Does this page appear to be loaded correctly with relevant content and no obvious error messages?';
        }

        if (!content) {
            throw new Error(`El contenido a validar está vacío o no se resolvió correctamente.`);
        }

        const result = await aiService.validate({
            content,
            criteria,
            provider: activeProvider,
            model: activeModel,
            apiKey,
            keys,
            maxTokens: Number(maxTokens),
            parentSignal: req.signal,
        });

        // Map result to a success/fail based on expectedAnswer
        const isMatch =
            String(result.isValid).toLowerCase() === String(expectedAnswer).toLowerCase() ||
            (result.isValid && String(expectedAnswer).toLowerCase() === 'true');

        variableManager.set(variableName, isMatch, req.body.runId);

        emitLog({
            message: `Validación finalizada. Resultado: ${result.isValid} (Coincidencia: ${isMatch})`,
            type: 'success',
            nodeId,
        });

        // --- JSONL AUDIT LOGGING ---
        const enableFineTuningVal = req.headers?.['x-hal-fine-tuning'] === 'true';
        if (enableFineTuningVal) {
            try {
                await auditService.logStep({
                    input: req.body,
                    domBefore: autoContext || null,
                    action: 'validate_semantic',
                    selector: null,
                    assertionResult: {
                        success: true,
                        status: 'success',
                        isValid: result.isValid,
                        isMatch,
                        reasoning: result.reasoning,
                    },
                    runId: req.body.runId,
                    nodeId,
                });
            } catch (auditErr) {
                console.error(
                    '[AuditService] Failed to write semantic audit log:',
                    auditErr.message,
                );
            }
        }

        return res.status(200).json({
            success: true,
            message: req.t('actions.validate_semantic.success'),
            data: {
                ...result,
                variable: variableName,
                isMatch,
            },
        });
    } catch (error) {
        console.error('[ERROR] validateSemanticAction:', error.message);
        emitLog({
            message: `Error en validación semántica: ${error.message}`,
            type: 'error',
            nodeId: req.body?.nodeId,
        });
        return res.status(500).json({
            success: false,
            message: req.t('actions.validate_semantic.error'),
            error: error.message,
        });
    }
};

export default validateSemanticAction;
