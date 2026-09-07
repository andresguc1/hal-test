/**
 * Shared helpers for OpenAI-compatible `/v1/models` listing.
 * Used by the openai, openrouter, custom providers and as a fallback for
 * non-Ollama OpenAI-compatible endpoints (LM Studio, vLLM, ...).
 */
export function trimTrailingSlash(url) {
    const value = (url || '').trim();
    return value.endsWith('/') ? value.slice(0, -1) : value;
}

function malformed(message) {
    const err = new Error(message);
    err.code = 'MALFORMED';
    return err;
}

/**
 * Lists models through an OpenAI-compatible GET {base}/v1/models endpoint.
 * @param {{ key?: string, baseUrl?: string, signal?: AbortSignal, source?: string }} options
 * @returns {Promise<import('./types.js').ModelMetadata[]>}
 */
export async function listOpenAICompatibleModels({
    key,
    baseUrl,
    signal,
    source = 'openai-compatible',
}) {
    const base = trimTrailingSlash(baseUrl || '');
    const modelsUrl = base.endsWith('/v1') ? `${base}/models` : `${base}/v1/models`;

    const response = await fetch(modelsUrl, {
        headers: { Authorization: `Bearer ${key || 'ollama'}` },
        signal,
        redirect: 'error',
    });

    if (!response.ok) {
        const err = new Error(`Models endpoint responded with status ${response.status}`);
        err.status = response.status;
        if (response.status === 404 || response.status === 501) {
            err.code = 'ENDPOINT_NOT_SUPPORTED';
        }
        throw err;
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw malformed('Malformed JSON from models endpoint');
    }

    const list = data?.data;
    if (!Array.isArray(list)) {
        throw malformed('Malformed /v1/models response: missing "data" array');
    }

    return list
        .filter((m) => m && typeof m.id === 'string' && m.id)
        .map((m) => ({
            id: m.id,
            label: m.id,
            ownedBy: m.owned_by || undefined,
            source,
        }));
}

/**
 * Builds a discoverer for any OpenAI-compatible provider.
 * @param {{ provider: string, source?: string }} config
 */
export function createOpenAICompatibleDiscoverer({ provider, source = 'openai-compatible' }) {
    return {
        provider,
        timeoutMs: 10000,
        async listModels({ key, baseUrl, signal }) {
            return listOpenAICompatibleModels({ key, baseUrl, signal, source });
        },
    };
}
