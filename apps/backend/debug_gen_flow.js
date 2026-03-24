import aiService from './services/AIService.js';
import { canvasTools } from './mcp/canvasTools.js';

async function test() {
    console.log('Starting test...');
    try {
        // Convert canvasTools array to map as expected by generateTextWithTools
        // Wait, AIService.generateTextWithTools expects `tools` map or array?
        // Let's check AIService.js line 155:
        // `async generateTextWithTools({ prompt, provider, model, baseUrl, apiKey, maxSteps, tools })`
        // In chat.controller.js: It passes `canvasTools` array or object?
        // Let's check chat.controller.js line 102:
        // code: `tools: canvasTools`
        const toolsObject = {};
        canvasTools.forEach((t) => {
            toolsObject[t.name] = t;
        });

        const result = await aiService.generateTextWithTools({
            prompt: 'Crea un flujo que busque el termino metallica en Ebay',
            provider: 'ollama',
            model: 'gemma3',
            baseUrl: 'http://127.0.0.1:11434',
            tools: toolsObject, // Passed as map
            maxSteps: 10,
            maxTokens: 500, // Force limit to test performance loop
        });
        console.log('\n--- RESULT TEXT ---\n', result.text);
        console.log('\n--- TOOL CALLS ---\n', JSON.stringify(result.toolCalls, null, 2));
        console.log('\n--- TOOL RESULTS ---\n', JSON.stringify(result.toolResults, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
