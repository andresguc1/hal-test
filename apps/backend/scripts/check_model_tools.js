import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import dotenv from 'dotenv';

dotenv.config();

const ollamaModel = process.env.OLLAMA_MODEL || 'gemma3';
const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';

console.log(`Checking tool support for model: ${ollamaModel} at ${ollamaUrl}`);

const provider = createOpenAI({
    baseURL: ollamaUrl,
    apiKey: 'ollama',
});

const tools = {
    get_weather: {
        description: 'Get the weather in a location',
        parameters: {
            type: 'object',
            properties: {
                location: { type: 'string' },
            },
            required: ['location'],
        },
    },
};

try {
    const { text, toolCalls } = await generateText({
        model: provider(ollamaModel),
        prompt: 'What is the weather in London?',
        tools,
    });

    if (toolCalls && toolCalls.length > 0) {
        console.log('✅ Tool support verified!');
        console.log('Tool Calls:', JSON.stringify(toolCalls, null, 2));
    } else {
        console.log('❌ Model did not trigger a tool call.');
        console.log('Response:', text);
    }
} catch (error) {
    if (error.message.includes('does not support tools')) {
        console.error(`❌ Error: Model '${ollamaModel}' does NOT support tools.`);
    } else {
        console.error('❌ Error during verification:', error.message);
    }
    console.log('\nTip: Try pulling a model that supports tools, like llama3.2:');
    console.log('ollama pull llama3.2');
    console.log('Then set OLLAMA_MODEL=llama3.2 in your .env file.');
}
