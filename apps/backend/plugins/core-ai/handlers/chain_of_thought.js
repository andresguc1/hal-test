import aiService from '../../../services/AIService.js';
import { DEFAULT_LOCAL_MODEL } from '../../../services/LLMFactory.js';
import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';

const chainOfThoughtAction = async (req, res) => {
    try {
        const {
            instruction,
            thoughtVariable = 'aiThought',
            answerVariable = 'aiAnswer',
            temperature = 0.7,
            maxTokens = 2048,
            nodeId,
        } = req.body;

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
            message: `Iniciando razonamiento (CoT) con modelo ${activeModel}...`,
            type: 'ai',
            nodeId,
        });

        const resolvedInstruction = variableManager.resolve(instruction);
        const prompt = `Task: ${resolvedInstruction}\n\nPlease think step by step. Use this exact format:\nTHOUGHT: <your detailed reasoning process>\nANSWER: <your final concise answer>`;

        const response = await aiService.generateText({
            prompt,
            provider: activeProvider,
            model: activeModel,
            apiKey,
            baseUrl: headerBaseUrl,
            temperature: Number(temperature),
            maxTokens: Number(maxTokens),
            taskType: 'reasoning',
            parentSignal: req.signal,
        });

        const text = response.text || '';
        const thoughtMatch = text.match(/THOUGHT:([\s\S]*?)(?=ANSWER:|$)/i);
        const answerMatch = text.match(/ANSWER:([\s\S]*)/i);

        const thought = thoughtMatch ? thoughtMatch[1].trim() : 'No separate thought extracted.';
        const answer = answerMatch ? answerMatch[1].trim() : text;

        variableManager.set(thoughtVariable, thought, req.body.runId);
        variableManager.set(answerVariable, answer, req.body.runId);

        emitLog({
            message: `Razonamiento completado. Resultado guardado en ${answerVariable}.`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.chain_of_thought.success'),
            data: { thought, answer, thoughtVariable, answerVariable },
        });
    } catch (error) {
        console.error('[ERROR] chainOfThoughtAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.chain_of_thought.error'),
            error: error.message,
        });
    }
};

export default chainOfThoughtAction;
