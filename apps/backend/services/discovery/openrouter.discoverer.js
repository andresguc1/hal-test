import { createOpenAICompatibleDiscoverer } from './genericOpenAI.discoverer.js';

export const openrouterDiscoverer = createOpenAICompatibleDiscoverer({ provider: 'openrouter' });
