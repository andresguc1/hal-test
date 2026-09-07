import aiService from '../services/AIService.js';

const KNOWN_PROVIDERS = new Set([
    'ollama',
    'openai',
    'openrouter',
    'anthropic',
    'claude',
    'google',
    'gemini',
    'custom',
]);

const CLOUD_PROVIDERS = new Set([
    'openai',
    'openrouter',
    'anthropic',
    'claude',
    'google',
    'gemini',
]);

const DISCOVERY_DEFAULT_BASE = {
    ollama: 'http://127.0.0.1:11434',
    openai: 'https://api.openai.com',
    openrouter: 'https://openrouter.ai',
    anthropic: 'https://api.anthropic.com',
    claude: 'https://api.anthropic.com',
    google: 'https://generativelanguage.googleapis.com',
    gemini: 'https://generativelanguage.googleapis.com',
    custom: '',
};

// SSRF scoped allowlist: loopback endpoints + known cloud model APIs.
// Custom hosts can be added through the HALTEST_ALLOWED_AI_BASE_URLS env var
// (comma separated) or with '*' to allow any http(s) host.
const DISCOVERY_ALLOWED_HOSTS = new Set([
    '127.0.0.1',
    '::1',
    'localhost',
    '[::1]',
    'api.openai.com',
    'api.anthropic.com',
    'generativelanguage.googleapis.com',
    'openrouter.ai',
]);

const ENV_ALLOWED_HOSTS = new Set(
    (process.env.HALTEST_ALLOWED_AI_BASE_URLS || '')
        .split(',')
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean),
);

/**
 * Scoped SSRF guard for the discovery endpoint.
 * Unlike sanitizeBaseUrl (which silently rewrites to loopback), this returns
 * null for disallowed hosts so the route can respond with an explicit
 * `REJECTED` state.
 */
function sanitizeDiscoveryBaseUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let url;
    try {
        url = new URL(raw.trim());
    } catch {
        return null;
    }
    if (!['http:', 'https:'].includes(url.protocol)) return null;

    const hostname = url.hostname.toLowerCase().replace(/^\[|]$/g, '');
    const allowed =
        DISCOVERY_ALLOWED_HOSTS.has(hostname) ||
        ENV_ALLOWED_HOSTS.has(hostname) ||
        ENV_ALLOWED_HOSTS.has('*');

    if (!allowed) return null;
    return `${url.protocol}//${url.host}`;
}

const REJECTED_MESSAGE =
    'This Base URL host is not allowed by the model discovery policy. Allowed: loopback ' +
    'endpoints, known cloud providers (OpenAI, Anthropic, Google Gemini, OpenRouter), or ' +
    'custom hosts via the HALTEST_ALLOWED_AI_BASE_URLS environment variable.';

export async function discoverAiModels(req, res) {
    const { provider, apiKey, baseUrl } = req.body || {};
    const providerLower = String(provider || '').toLowerCase();

    if (!providerLower || !KNOWN_PROVIDERS.has(providerLower)) {
        return res.status(400).json({ success: false, message: 'Unsupported or missing provider' });
    }

    const isCloud = CLOUD_PROVIDERS.has(providerLower) || providerLower === 'custom';
    const hasKey = Boolean(apiKey && apiKey.trim());
    if (isCloud && !hasKey) {
        return res
            .status(400)
            .json({ success: false, message: `API Key is required for provider ${providerLower}` });
    }

    const rawBase = baseUrl || DISCOVERY_DEFAULT_BASE[providerLower] || '';
    const safeBaseUrl = sanitizeDiscoveryBaseUrl(rawBase);

    if (!safeBaseUrl) {
        return res.json({
            success: true,
            provider: providerLower,
            baseUrl: typeof baseUrl === 'string' ? baseUrl : '',
            state: 'REJECTED',
            models: [],
            error: REJECTED_MESSAGE,
        });
    }

    try {
        const result = await aiService.discoverModels({
            provider,
            apiKey,
            baseUrl: safeBaseUrl,
        });
        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('[AI] Discover Models Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
