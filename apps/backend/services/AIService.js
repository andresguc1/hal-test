// apps/backend/services/AIService.js
import { generateText, generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

class AIService {
    constructor() {
        this.openai = process.env.OPENAI_API_KEY
            ? createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
            : null;
        this.google = process.env.GOOGLE_API_KEY
            ? createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_API_KEY })
            : null;
        this.anthropic = process.env.ANTHROPIC_API_KEY
            ? createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
            : null;
        // xAI (Grok) uses OpenAI-compatible SDK
        this.grok = process.env.GROK_API_KEY
            ? createOpenAI({
                  apiKey: process.env.GROK_API_KEY,
                  baseURL: 'https://api.x.ai/v1',
              })
            : null;
    }

    /**
     * Get the correct model provider instance based on model name and user keys
     */
    _getModel(modelName, keys = {}) {
        const name = modelName || 'gpt-4o';

        // Google Gemini
        if (name.startsWith('gemini')) {
            console.log(`[AIService] Using Google Gemini model: ${name}`);
            if (keys.google) return createGoogleGenerativeAI({ apiKey: keys.google })(name);
            if (this.google) return this.google(name);
            throw new Error('Missing Google API Key. Please provide it in User Settings.');
        }

        // Anthropic Claude
        if (name.startsWith('claude')) {
            if (keys.anthropic) return createAnthropic({ apiKey: keys.anthropic })(name);
            if (this.anthropic) return this.anthropic(name);
            throw new Error('Missing Anthropic API Key. Please provide it in User Settings.');
        }

        // Grok (xAI)
        if (name.startsWith('grok')) {
            if (keys.grok)
                return createOpenAI({
                    apiKey: keys.grok,
                    baseURL: 'https://api.x.ai/v1',
                })(name);
            if (this.grok) return this.grok(name);
            throw new Error('Missing Grok API Key. Please provide it in User Settings.');
        }

        // Default to OpenAI
        if (keys.openai) return createOpenAI({ apiKey: keys.openai })(name);
        if (this.openai) return this.openai(name);
        throw new Error('Missing OpenAI API Key. Please provide it in User Settings.');
    }

    async generateText({ prompt, system, modelName, defaultModel, keys }) {
        const modelToUse = modelName || defaultModel || 'gpt-4o';
        const model = this._getModel(modelToUse, keys);

        const { text } = await generateText({
            model,
            system,
            prompt,
        });

        return text;
    }

    async generateStructured({ description, schema, modelName, defaultModel, keys }) {
        const modelToUse = modelName || defaultModel || 'gpt-4o';
        const model = this._getModel(modelToUse, keys);

        const { object } = await generateObject({
            model,
            schema,
            prompt: `Generate data matching this description: ${description}`,
        });

        return object;
    }

    async validate({ content, criteria, defaultModel, keys }) {
        const modelToUse = defaultModel || 'gpt-4o';
        const model = this._getModel(modelToUse, keys);

        const { object } = await generateObject({
            model,
            schema: z.object({
                isValid: z.boolean().describe('Whether the content meets the criteria'),
                reasoning: z.string().describe('Explanation of why it passed or failed'),
            }),
            prompt: `
            Analyze this content: "${content}"
            
            Criteria: "${criteria}"
            
            Determine if the content meets the criteria.
            `,
        });

        return object;
    }
}

export const aiService = new AIService();
