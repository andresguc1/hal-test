import { trimTrailingSlash } from './genericOpenAI.discoverer.js';

const ANTHROPIC_VERSION = '2023-06-01';

function malformed(message) {
    const err = new Error(message);
    err.code = 'MALFORMED';
    return err;
}

/**
 * Anthropic (Claude) discoverer.
 * Lists models through GET {base}/v1/models with the documented headers.
 */
export const anthropicDiscoverer = {
    provider: 'anthropic',
    timeoutMs: 10000,
    async listModels({ key, baseUrl, signal }) {
        const base = trimTrailingSlash(baseUrl || '');
        const modelsUrl = base.endsWith('/v1') ? `${base}/models` : `${base}/v1/models`;

        const response = await fetch(modelsUrl, {
            headers: {
                'x-api-key': key,
                'anthropic-version': ANTHROPIC_VERSION,
            },
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
                label: m.display_name || m.id,
                source: 'anthropic-native',
            }));
    },
};
