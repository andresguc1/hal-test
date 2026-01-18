import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
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
    getProviderInstance(keyAliasOrId, fallbackProvider) {
        // 1. Try to Retrieve from Vault
        const securedKey = keyVaultService.getDecryptedKey(keyAliasOrId);

        if (securedKey) {
            return this.createInstance(securedKey.provider, securedKey.key, securedKey.baseUrl);
        }

        // 2. Legacy/Raw Key Support
        // If the 'Alias' passed is actually a raw key (heuristic), use it directly.
        if (this.isLikelyRawKey(keyAliasOrId)) {
            // Warn only once per session or use debug log
            // console.warn("[LLMFactory] Using RAW API Key (Legacy Mode). Please migrate to Key Vault.");
            if (!fallbackProvider) {
                throw new Error('Raw Key provided but Provider type is unknown.');
            }
            return this.createInstance(fallbackProvider, keyAliasOrId);
        }

        // 3. Fallback for Environment Variables (e.g. 'openai' passed as ID)
        if (['openai', 'google', 'anthropic', 'ollama', 'grok'].includes(keyAliasOrId)) {
            return this.createFromEnv(keyAliasOrId);
        }

        // 4. Not Found - Securely Log
        const masked =
            keyAliasOrId.length > 10
                ? `${keyAliasOrId.substring(0, 4)}...${keyAliasOrId.substring(keyAliasOrId.length - 4)}`
                : keyAliasOrId;

        throw new Error(`Key Alias '${masked}' not found in Vault and is not a valid Provider.`);
    }

    createInstance(provider, key, baseUrl) {
        switch (provider) {
            case 'openai':
                return createOpenAI({ apiKey: key });
            case 'google':
                return createGoogleGenerativeAI({ apiKey: key });
            case 'anthropic':
                return createAnthropic({ apiKey: key });
            case 'ollama':
                return createOpenAI({
                    baseURL: baseUrl || 'http://localhost:11434/v1',
                    apiKey: 'ollama',
                });
            case 'grok':
                return createOpenAI({ baseURL: 'https://api.x.ai/v1', apiKey: key });
            default:
                throw new Error(`Provider '${provider}' not supported.`);
        }
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
     * Fallback for Environment Variables (Legacy/Dev)
     */
    createFromEnv(provider) {
        switch (provider) {
            case 'openai':
                return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
            case 'google':
                return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY });
            case 'anthropic':
                return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            case 'ollama':
                return createOpenAI({
                    baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
                    apiKey: 'ollama',
                });
            default:
                throw new Error(`Env provider '${provider}' not found`);
        }
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
