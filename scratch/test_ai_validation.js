import aiService from '../apps/backend/services/AIService.js';
import { llmFactory } from '../apps/backend/services/LLMFactory.js';

async function testValidation() {
    console.log('=== TEST 1: OpenRouter Validation with Empty Key ===');
    try {
        await aiService.validateKey({
            provider: 'openrouter',
            apiKey: '',
            model: 'google/gemini-2.0-flash-001'
        });
        console.error('FAIL: Validation succeeded with empty key!');
    } catch (e) {
        console.log('PASS: Validation correctly failed. Error:');
        console.log(e.message);
    }

    console.log('\n=== TEST 2: OpenRouter Validation with Invalid Key ===');
    try {
        await aiService.validateKey({
            provider: 'openrouter',
            apiKey: 'sk-or-v1-invalidkeythatdoesnotworkandisdefinitelywrong',
            model: 'google/gemini-2.0-flash-001'
        });
        console.error('FAIL: Validation succeeded with invalid key!');
    } catch (e) {
        console.log('PASS: Validation correctly failed. Error:');
        console.log(e.message);
    }

    console.log('\n=== TEST 3: LLMFactory mapError test for No Endpoints Found ===');
    const rawError = new Error('LiteLLM Router: No endpoints found for google/gemini-2.0-flash-001');
    const mapped = llmFactory.mapError(rawError);
    console.log('Mapped Error Message:', mapped.message);
    if (mapped.message.includes('balance') && mapped.message.includes('ZDR')) {
        console.log('PASS: Error correctly mapped to descriptive user friendly message.');
    } else {
        console.error('FAIL: Error mapping did not work correctly.');
    }
}

testValidation().catch(console.error);
