import { llmFactory } from './LLMFactory.js';

/**
 * Discovery states shared between backend and frontend UI.
 */
export const DiscoveryState = {
    IDLE: 'IDLE',
    LOADING: 'LOADING',
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
    UNAUTHORIZED: 'UNAUTHORIZED',
    CONNECTION_REFUSED: 'CONNECTION_REFUSED',
    NOT_SUPPORTED: 'NOT_SUPPORTED',
    NO_MODELS_FOUND: 'NO_MODELS_FOUND',
    PARTIAL: 'PARTIAL',
    OFFLINE: 'OFFLINE',
    CUSTOM: 'CUSTOM',
    REJECTED: 'REJECTED',
};

const MAX_MODELS = 500;

/**
 * Model Discovery Service
 * Lists available models per provider (keyed with the same provider strings as
 * LLMFactory: ollama | openai | openrouter | anthropic | google) and returns a
 * normalized, sorted list. This is the basis of the AI settings Model Selector
 * and a building block for a future AI Model Router.
 */
class ModelDiscoveryService {
    constructor() {
        this._discoverers = new Map();
    }

    register(discoverer) {
        if (!discoverer || !discoverer.provider) {
            throw new Error('Invalid discoverer: provider is required');
        }
        this._discoverers.set(discoverer.provider.toLowerCase(), discoverer);
    }

    normalizeProvider(provider) {
        const value = String(provider || '').toLowerCase();
        if (value === 'claude') return 'anthropic';
        if (value === 'gemini') return 'google';
        return value;
    }

    /**
     * Normalizes a base URL for discovery: strips trailing "/v1" / "/v1beta"
     * segments and normalizes "localhost" to loopback (same policy as LLMFactory).
     */
    toDiscoveryBase(raw) {
        if (!raw || typeof raw !== 'string') return '';
        let url = raw.trim().replace(/\/+$/, '');
        url = url.replace('localhost', '127.0.0.1');
        url = url.replace(/\/v1beta$/, '').replace(/\/v1$/, '');
        return url;
    }

    /**
     * Entrada única de discovery.
     * @param {{ provider: string, apiKey?: string, baseUrl?: string, healthCheck?: Function }} params
     * @returns {Promise<import('./discovery/types.js').DiscoveryResult>}
     */
    async discoverModels({ provider, apiKey, baseUrl, healthCheck }) {
        const providerKey = this.normalizeProvider(provider);
        const base = this.toDiscoveryBase(baseUrl);
        const discoverer = this._discoverers.get(providerKey);

        if (!discoverer) {
            return {
                provider: providerKey,
                baseUrl: base,
                state: DiscoveryState.NOT_SUPPORTED,
                models: [],
                error: `Model discovery is not supported for provider '${providerKey}'.`,
            };
        }

        const timeoutMs = discoverer.timeoutMs || 10000;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const models = await discoverer.listModels({
                key: apiKey,
                baseUrl: base,
                signal: controller.signal,
                healthCheck,
            });
            const sorted = (Array.isArray(models) ? models : [])
                .filter((m) => m && typeof m.id === 'string' && m.id)
                .sort((a, b) => a.id.localeCompare(b.id))
                .slice(0, MAX_MODELS);

            return {
                provider: providerKey,
                baseUrl: base,
                state: sorted.length > 0 ? DiscoveryState.SUCCESS : DiscoveryState.NO_MODELS_FOUND,
                models: sorted,
                error: null,
            };
        } catch (err) {
            const { state, error } = this._classifyError(err);
            return { provider: providerKey, baseUrl: base, state, models: [], error };
        } finally {
            clearTimeout(timeout);
        }
    }

    _classifyError(err) {
        const msg = (err?.message || '').toLowerCase();

        if (err?.name === 'AbortError' || msg.includes('aborted') || msg.includes('timeout')) {
            return { state: DiscoveryState.TIMEOUT, error: 'Timed out while listing models.' };
        }
        if (err?.code === 'ENDPOINT_NOT_SUPPORTED') {
            return {
                state: DiscoveryState.NOT_SUPPORTED,
                error: 'This endpoint does not expose a supported model listing API.',
            };
        }
        if (err?.code === 'OLLAMA_NOT_RUNNING') {
            return {
                state: DiscoveryState.CONNECTION_REFUSED,
                error: 'Ollama is not running. Start it with: ollama serve',
            };
        }
        if (
            err?.status === 401 ||
            err?.status === 403 ||
            msg.includes('unauthorized') ||
            msg.includes('invalid api key')
        ) {
            return {
                state: DiscoveryState.UNAUTHORIZED,
                error: 'Authentication Failed: invalid API key for this provider.',
            };
        }
        if (err?.status === 404 || err?.status === 501) {
            return {
                state: DiscoveryState.NOT_SUPPORTED,
                error: 'Model listing endpoint not found on this server.',
            };
        }
        if (err?.status === 429 || msg.includes('quota')) {
            return {
                state: DiscoveryState.FAILED,
                error: 'Rate limit exceeded while listing models.',
            };
        }
        if (
            msg.includes('econnrefused') ||
            msg.includes('fetch failed') ||
            msg.includes('network')
        ) {
            return {
                state: DiscoveryState.CONNECTION_REFUSED,
                error: 'Cannot connect to the AI server at the specified Base URL.',
            };
        }
        return {
            state: DiscoveryState.FAILED,
            error: `Model discovery failed: ${llmFactory.mapError(err).message}`,
        };
    }
}

const modelDiscoveryService = new ModelDiscoveryService();
export default modelDiscoveryService;
