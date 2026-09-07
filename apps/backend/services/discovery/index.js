import modelDiscoveryService from '../ModelDiscoveryService.js';
import { ollamaDiscoverer } from './ollama.discoverer.js';
import { openaiDiscoverer } from './openai.discoverer.js';
import { openrouterDiscoverer } from './openrouter.discoverer.js';
import { anthropicDiscoverer } from './anthropic.discoverer.js';
import { googleDiscoverer } from './google.discoverer.js';
import { createOpenAICompatibleDiscoverer } from './genericOpenAI.discoverer.js';

modelDiscoveryService.register(ollamaDiscoverer);
modelDiscoveryService.register(openaiDiscoverer);
modelDiscoveryService.register(openrouterDiscoverer);
modelDiscoveryService.register(anthropicDiscoverer);
modelDiscoveryService.register(googleDiscoverer);
modelDiscoveryService.register(createOpenAICompatibleDiscoverer({ provider: 'custom' }));

export default modelDiscoveryService;
