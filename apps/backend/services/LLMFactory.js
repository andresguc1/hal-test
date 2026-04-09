import { createOpenAI } from '@ai-sdk/openai';
import { keyVaultService } from './KeyVaultService.js';

/**
 * LLM Factory
 * Responsible for creating provider instances on-demand using secured keys.
 */
class LLMFactory {
    /**
     * Creates a provider instance for a specific Key Alias/ID
     * @param {string} keyAliasOrId - The alias, ID, OR raw API Key (Legacy)
     * @param {string} [fallbackProvider] - Provider string (e.g. 'openai') to use if raw key is detected
     * @returns {object} The Vercel AI SDK provider instance
     */
    getProviderInstance(keyAliasOrId, fallbackProvider, baseUrl) {
        // 1. Try to Retrieve from Vault
        const securedKey = keyVaultService.getDecryptedKey(keyAliasOrId);

        if (securedKey) {
            return this.createInstance(
                securedKey.provider,
                securedKey.key,
                baseUrl || securedKey.baseUrl,
            );
        }

        // 2. Legacy/Raw Key Support
        if (this.isLikelyRawKey(keyAliasOrId)) {
            return this.createInstance(fallbackProvider || 'ollama', keyAliasOrId, baseUrl);
        }

        // 3. Force requested provider or Ollama as ultimate fallback
        return this.createInstance(fallbackProvider || 'ollama', null, baseUrl);
    }

    createInstance(provider, key, baseUrl) {
        if (provider === 'openrouter') {
            return createOpenAI({
                baseURL: baseUrl || 'https://openrouter.ai/api/v1',
                apiKey: key,
                compatibility: 'compatible',
                fetch: async (url, options) => {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for cloud models
                    try {
                        // OpenRouter requires HTTP referer and X-Title if possible, but basic API works without it.
                        const headers = {
                            ...options.headers,
                            'HTTP-Referer': 'http://localhost:5173', // Basic default for local testing
                            'X-Title': 'HalTest',
                        };
                        const response = await fetch(url, {
                            ...options,
                            headers,
                            signal: controller.signal,
                        });
                        clearTimeout(id);
                        return response;
                    } catch (error) {
                        clearTimeout(id);
                        throw error;
                    }
                },
            });
        }

        // We now consolidate everything to Ollama's OpenAI compatible endpoint
        let ollamaUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1';
        if (ollamaUrl.includes('localhost')) {
            ollamaUrl = ollamaUrl.replace('localhost', '127.0.0.1');
        }
        if (!ollamaUrl.endsWith('/v1')) {
            ollamaUrl = `${ollamaUrl.replace(/\/$/, '')}/v1`;
        }

        return createOpenAI({
            baseURL: ollamaUrl,
            apiKey: 'ollama',
            compatibility: 'compatible',
            fetch: async (url, options) => {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout for local models
                try {
                    const response = await fetch(url, { ...options, signal: controller.signal });
                    clearTimeout(id);
                    return response;
                } catch (error) {
                    clearTimeout(id);
                    throw error;
                }
            },
        });
    }

    isLikelyRawKey(str) {
        if (!str) return false;
        // Common prefixes: sk- (OpenAI), AIza (Google), xai- (Grok), sk-ant (Anthropic)
        return (
            str.startsWith('sk-') ||
            str.startsWith('AIza') ||
            str.startsWith('xai-') ||
            str.length > 40
        );
    }

    /**
     * Standardizes Errors from different providers
     */
    mapError(error) {
        const msg = error.message?.toLowerCase() || '';

        if (
            msg.includes('401') ||
            msg.includes('unauthorized') ||
            msg.includes('invalid api key')
        ) {
            return new Error('Authentication Failed: Invalid API Key. Please check your Wallet.');
        }

        if (msg.includes('429') || msg.includes('quota')) {
            return new Error(
                'Rate Limit Exceeded: You have run out of credits or hit the speed limit.',
            );
        }

        if (msg.includes('500') || msg.includes('internal server error')) {
            return new Error(
                'Provider Error: The AI Service is having a bad day (500). Try again later.',
            );
        }

        return error;
    }
}

export const llmFactory = new LLMFactory();
