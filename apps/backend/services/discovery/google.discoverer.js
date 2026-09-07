import { trimTrailingSlash } from './genericOpenAI.discoverer.js';

const DEFAULT_GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function malformed(message) {
    const err = new Error(message);
    err.code = 'MALFORMED';
    return err;
}

/**
 * Google / Gemini discoverer.
 * Lists models through GET {base}/models?key=<apiKey> and strips the
 * leading "models/" prefix from `name` so identifiers match the runtime.
 */
export const googleDiscoverer = {
    provider: 'google',
    timeoutMs: 10000,
    async listModels({ key, baseUrl, signal }) {
        const base = trimTrailingSlash(baseUrl || DEFAULT_GEMINI_BASE);
        const modelsUrl = `${base}/models?key=${encodeURIComponent(key || '')}`;

        const response = await fetch(modelsUrl, { signal, redirect: 'error' });

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

        const list = data?.models;
        if (!Array.isArray(list)) {
            throw malformed('Malformed "models" response: missing "models" array');
        }

        return list
            .filter((m) => m && typeof m.name === 'string' && m.name)
            .map((m) => ({
                id: (m.name || '').replace(/^models\//, ''),
                label: m.displayName || undefined,
                source: 'google-native',
            }))
            .filter((m) => m.id);
    },
};
