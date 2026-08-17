import aiService from '../../../services/AIService.js';
import { DEFAULT_LOCAL_MODEL } from '../../../services/LLMFactory.js';
import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';
import { fetchContext } from '../../../core/browser-utils.js';
import { z } from 'zod';

const generateDataAction = async (req, res) => {
    try {
        const {
            browserId,
            description,
            expectedFormat = 'json',
            variableName = 'generatedData',
            variable, // Alias support
            maxTokens = 2048,
            temperature = 0.7,
            count = 1,
            fields,
            injectBrowserContext = false,
        } = req.body;

        const targetVariable = variable || variableName;

        // --- AUTO CONTEXT INJECTION ---
        const autoContext = injectBrowserContext ? await fetchContext(req, browserId) : null;
        let activeDescription = variableManager.resolve(description) || '';

        // Zero-Config Fallback
        if (!activeDescription && autoContext) {
            activeDescription =
                'Extract all meaningful data fields, products, lists, or structured information visible on this page.';
        }

        if (autoContext) {
            activeDescription = `[PAGE CONTEXT]\n${autoContext}\n\n[INSTRUCTION]\n${activeDescription}`;
            console.log('[AI Context] Injected browser context into generate_data prompt');
        }
        // ------------------------------

        // Read from headers
        const activeProvider = req.headers['x-ai-provider'] || 'ollama';
        const activeModel =
            req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
        const headerBaseUrl = req.headers['x-ai-base-url'];
        const apiKey =
            req.headers['x-ai-api-key'] ||
            (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
            (activeProvider === 'ollama' ? 'ollama' : undefined);

        const keys = {
            openai: req.headers['x-openai-key'] || process.env.OPENAI_API_KEY,
            anthropic: req.headers['x-anthropic-key'] || process.env.ANTHROPIC_API_KEY,
            ollama: 'ollama',
            openrouter: apiKey,
            baseUrl: headerBaseUrl,
        };

        // Build a robust, valid Zod schema for structured output to satisfy Vercel AI SDK requirements
        let schema;
        if (expectedFormat === 'json') {
            if (fields && Array.isArray(fields) && fields.length > 0) {
                const schemaFields = {};
                for (const field of fields) {
                    if (field && typeof field === 'object' && field.name) {
                        let fieldSchema = z.string();
                        if (field.type === 'number') fieldSchema = z.number();
                        else if (field.type === 'boolean') fieldSchema = z.boolean();
                        else if (field.type === 'array') fieldSchema = z.array(z.any());
                        else if (field.type === 'object') fieldSchema = z.record(z.any());

                        if (field.description) {
                            fieldSchema = fieldSchema.describe(field.description);
                        }
                        schemaFields[field.name] = fieldSchema;
                    }
                }
                schema = z.object(schemaFields);
            } else {
                // If no fields are explicitly defined, use a generic result schema
                // to guide generateObject and avoid AI SDK compilation failures
                schema = z.object({
                    result: z
                        .any()
                        .describe(
                            'The generated structured data matching the requested description',
                        ),
                });
            }
        } else {
            // Non-JSON format: schema is not used by generateText, so we pass a placeholder z.any()
            schema = z.any();
        }

        const finalPrompt = `Generate ${count} item(s) in ${expectedFormat} format. 
Description: ${activeDescription}
${fields ? `Fields: ${JSON.stringify(fields)}` : ''}`;

        const data = await aiService.generateStructured({
            description: finalPrompt,
            schema,
            provider: activeProvider,
            model: activeModel,
            apiKey,
            keys,
            maxTokens,
            temperature,
            expectedFormat,
            parentSignal: req.signal,
        });

        let resolvedData = data;
        // Extract generic result key for seamless backward compatibility if fields wasn't used
        if (expectedFormat === 'json' && (!fields || fields.length === 0)) {
            if (
                data &&
                typeof data === 'object' &&
                'result' in data &&
                Object.keys(data).length === 1
            ) {
                resolvedData = data.result;
            }
        }

        variableManager.set(targetVariable, resolvedData, req.body.runId);

        const displayData =
            typeof resolvedData === 'object' ? JSON.stringify(resolvedData) : String(resolvedData);
        const truncatedData =
            displayData.length > 80 ? displayData.substring(0, 80) + '...' : displayData;

        console.log(
            `[Generate Data] Generated value: "${displayData}" saved to variable "${targetVariable}"`,
        );

        // Emit log for UI visualization
        emitLog({
            message: `Generated Data (${expectedFormat}): "${truncatedData}" saved to ${targetVariable}`,
            type: 'success',
            nodeId: req.body.nodeId || 'generate_data',
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.generate_data.success'),
            data: resolvedData,
            result: resolvedData,
            variable: targetVariable,
        });
    } catch (error) {
        console.error('[ERROR] generateDataAction:', error.message);
        return res.status(500).json({
            success: false,
            message: req.t('actions.generate_data.error'),
            error: error.message,
        });
    }
};

export default generateDataAction;
