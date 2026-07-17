import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { keyVaultService } from './KeyVaultService.js';

/**
 * LLM Factory
 * Responsible for creating provider instances on-demand using secured keys.
 */
class LLMFactory {
    static RECOMMENDED_LOCAL_MODELS = ['gemma3:2b', 'phi4:mini'];
    static DEFAULT_LOCAL_MODEL = 'gemma3:2b';

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

        // 3. Environment Fallback
        const providerLower = fallbackProvider?.toLowerCase();
        if (providerLower === 'openrouter' && process.env.OPENROUTER_API_KEY) {
            return this.createInstance('openrouter', process.env.OPENROUTER_API_KEY, baseUrl);
        }
        if (providerLower === 'openai' && process.env.OPENAI_API_KEY) {
            return this.createInstance('openai', process.env.OPENAI_API_KEY, baseUrl);
        }
        if (
            (providerLower === 'anthropic' || providerLower === 'claude') &&
            process.env.ANTHROPIC_API_KEY
        ) {
            return this.createInstance('anthropic', process.env.ANTHROPIC_API_KEY, baseUrl);
        }
        if (
            (providerLower === 'google' || providerLower === 'gemini') &&
            (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
        ) {
            return this.createInstance(
                'google',
                process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
                baseUrl,
            );
        }

        // 4. Force requested provider or Ollama as ultimate fallback
        return this.createInstance(fallbackProvider || 'ollama', null, baseUrl);
    }

    createInstance(provider, key, baseUrl) {
        const providerLower = provider?.toLowerCase();

        if (providerLower === 'openrouter') {
            const finalKey = key || process.env.OPENROUTER_API_KEY;
            if (!finalKey) {
                throw new Error(
                    'API Key for OpenRouter is missing. Please configure your OpenRouter API Key in the AI Settings panel or set OPENROUTER_API_KEY in your .env file.',
                );
            }
            return createOpenAI({
                baseURL: baseUrl || 'https://openrouter.ai/api/v1',
                apiKey: finalKey,
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

        if (providerLower === 'openai') {
            const finalKey = key || process.env.OPENAI_API_KEY;
            if (!finalKey) {
                throw new Error(
                    'API Key for OpenAI is missing. Please configure your OpenAI API Key in the AI Settings panel or set OPENAI_API_KEY in your .env file.',
                );
            }
            return createOpenAI({
                baseURL: baseUrl || undefined,
                apiKey: finalKey,
            });
        }

        if (providerLower === 'anthropic' || providerLower === 'claude') {
            const finalKey = key || process.env.ANTHROPIC_API_KEY;
            if (!finalKey) {
                throw new Error(
                    'API Key for Anthropic (Claude) is missing. Please configure your Anthropic API Key in the AI Settings panel or set ANTHROPIC_API_KEY in your .env file.',
                );
            }
            return createAnthropic({
                baseURL: baseUrl || undefined,
                apiKey: finalKey,
            });
        }

        if (providerLower === 'google' || providerLower === 'gemini') {
            const finalKey = key || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            if (!finalKey) {
                throw new Error(
                    'API Key for Google (Gemini) is missing. Please configure your Google API Key in the AI Settings panel or set GEMINI_API_KEY or GOOGLE_API_KEY in your .env file.',
                );
            }
            return createGoogleGenerativeAI({
                baseURL: baseUrl || undefined,
                apiKey: finalKey,
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
        const bodyStr = error.responseBody?.toLowerCase() || '';
        const fullErrStr = `${msg} ${bodyStr}`;

        if (
            fullErrStr.includes('llama-server process has terminated') ||
            fullErrStr.includes('exit status 1') ||
            fullErrStr.includes('exit status 137') ||
            fullErrStr.includes('forcibly closed by the remote host') ||
            fullErrStr.includes('wsarecv') ||
            fullErrStr.includes('econnreset') ||
            fullErrStr.includes('connection reset by peer')
        ) {
            return new Error(
                'Connection dropped by the AI server. If using local Ollama, the model might be too large for your RAM/VRAM. If using an external server, a reverse proxy (like Nginx) might have timed out, or the server restarted.',
            );
        }

        if (
            msg.includes('401') ||
            msg.includes('unauthorized') ||
            msg.includes('invalid api key')
        ) {
            return new Error(
                'Authentication Failed: Invalid API Key. Please check your AI settings.',
            );
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

        if (msg.includes('no endpoints found')) {
            return new Error(
                'OpenRouter Routing Error: No endpoints found for the requested model. This typically happens when your API Key is missing or invalid, your OpenRouter account balance is $0, or strict data privacy policies (like ZDR) are blocking the model. Please check your AI Settings and OpenRouter account.',
            );
        }

        return error;
    }
}

export const llmFactory = new LLMFactory();
export const RECOMMENDED_LOCAL_MODELS = LLMFactory.RECOMMENDED_LOCAL_MODELS;
export const DEFAULT_LOCAL_MODEL = LLMFactory.DEFAULT_LOCAL_MODEL;
