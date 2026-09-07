/**
 * Discovery types (JSDoc typedefs only — no runtime exports).
 */

/**
 * Normalized model entry returned by discovery.
 * `id` must be 1:1 with what the runtime accepts as `x-ai-model`.
 *
 * @typedef {Object} ModelMetadata
 * @property {string} id - Exact model identifier (flows as `selectedModel` / `x-ai-model`).
 * @property {string} [label] - Human-friendly label (falls back to `id` in the UI).
 * @property {string} [ownedBy] - Provider of the model (OpenAI-compatible responses).
 * @property {number} [contextWindow] - Max context window if provided by the endpoint.
 * @property {string} source - 'native' | 'openai-compatible' | 'anthropic-native' | 'google-native'.
 */

/**
 * Result of a discovery attempt.
 *
 * @typedef {Object} DiscoveryResult
 * @property {string} provider - Normalized provider key.
 * @property {string} baseUrl - Normalized base URL used for discovery.
 * @property {string} state - One of the DiscoveryState values.
 * @property {ModelMetadata[]} models - Sorted, capped list (max 500).
 * @property {string|null} error - User-readable error when state !== SUCCESS/NO_MODELS_FOUND.
 */
