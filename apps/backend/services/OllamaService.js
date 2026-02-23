import aiService from './AIService.js';

/**
 * OllamaService - Specialized for Phase 4 AI Selector Sanitization
 * Uses local Ollama to "clean" fragile selectors.
 */
class OllamaService {
    /**
     * Sanitizes a selector using local AI.
     * @param {string} selector - The raw selector picked by the inspector.
     * @param {string} htmlContext - A snippet of the surrounding DOM.
     * @returns {Promise<{ sanitizedSelector: string, confidence: number, reasoning: string }>}
     */
    async sanitizeSelector(selector, htmlContext) {
        try {
            console.log(`[OllamaService] Sanitizing selector: ${selector}`);

            const prompt = `
            You are a Senior Test Automation Engineer. Clean this CSS selector to make it as robust and non-fragile as possible.
            
            Raw Selector: "${selector}"
            DOM Context:
            \`\`\`html
            ${htmlContext || 'No context available'}
            \`\`\`
            
            RULES:
            1. Prefer data-testid or stable attributes over long CSS paths.
            2. Avoid dynamic IDs (e.g., numbers, random hashes).
            3. If it is already perfect, return the same.
            4. Keep it concise.
            
            Return ONLY a JSON object with:
            {
              "sanitizedSelector": "string",
              "confidence": number,
              "reasoning": "string"
            }
            `;

            // We use AIService's internal health check or just try to generate
            // Task type 'local' forces Ollama/gemma3 in AIService matrix
            const response = await aiService.generateText({
                prompt,
                taskType: 'local',
                provider: 'ollama',
                temperature: 0.1, // Precision is key
            });

            // Parse JSON from response (similar logic to AIService.healSelector)
            const text = response.text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    sanitizedSelector: parsed.sanitizedSelector || selector,
                    confidence: parsed.confidence || 0.5,
                    reasoning: parsed.reasoning || 'AI Refined',
                };
            }

            return {
                sanitizedSelector: selector,
                confidence: 0,
                reasoning: 'Failed to parse AI output',
            };
        } catch (error) {
            console.warn(
                '[OllamaService] Sanitization failed, falling back to raw selector:',
                error.message,
            );
            return { sanitizedSelector: selector, confidence: 0, reasoning: error.message };
        }
    }
}

export default new OllamaService();
