import { generateObject } from 'ai';
import { z } from 'zod';
import { llmFactory } from '../apps/backend/services/LLMFactory.js';
import dotenv from 'dotenv';
dotenv.config();

async function testGenerate() {
    const providerInstance = llmFactory.getProviderInstance(
        process.env.OPENROUTER_API_KEY,
        'openrouter'
    );
    const modelRef = providerInstance('google/gemini-2.0-flash-001');

    try {
        console.log('Testing generateObject with z.any()...');
        const { object } = await generateObject({
            model: modelRef,
            schema: z.any(),
            prompt: 'Generate an object representing a user standard_user',
        });
        console.log('Success!', object);
    } catch (e) {
        console.error('Failed with error:', e);
    }
}

testGenerate().catch(console.error);
