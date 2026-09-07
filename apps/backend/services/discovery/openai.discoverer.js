import { createOpenAICompatibleDiscoverer } from './genericOpenAI.discoverer.js';

export const openaiDiscoverer = createOpenAICompatibleDiscoverer({ provider: 'openai' });
