import { listOpenAICompatibleModels } from './genericOpenAI.discoverer.js';

/**
 * Ollama discoverer.
 * 1) Reuses AIService.healthCheck (native GET {base}/api/tags) when the server answers.
 * 2) Falls back to any OpenAI-compatible /v1/models endpoint (Ollama, LM Studio, vLLM, ...).
 */
export const ollamaDiscoverer = {
    provider: 'ollama',
    timeoutMs: 8000,
    async listModels({ key, baseUrl, signal, healthCheck }) {
        let nativeModels = null;
        try {
            const health = await healthCheck?.({ baseUrl });
            if (health?.ollamaRunning) {
                nativeModels = health.models || [];
            }
        } catch (err) {
            if (err?.code === 'OLLAMA_NOT_RUNNING') throw err;
        }

        if (nativeModels) {
            return nativeModels
                .filter((name) => name)
                .map((name) => ({ id: name, label: name, source: 'native' }));
        }

        return listOpenAICompatibleModels({
            key: key || 'ollama',
            baseUrl,
            signal,
            source: 'openai-compatible',
        });
    },
};
