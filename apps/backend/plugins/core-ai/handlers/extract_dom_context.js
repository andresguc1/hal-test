import { validateBrowser, getOrCreateContext } from '../../../core/browser-utils.js';
import aiService from '../../../services/AIService.js';
import { DEFAULT_LOCAL_MODEL } from '../../../services/LLMFactory.js';
import { variableManager } from '../../../services/VariableManager.js';
import { emitLog } from '../../../socket.js';

const extractDomContextAction = async (req, res) => {
    try {
        const {
            browserId,
            selector,
            extractionType = 'text',
            variableName = 'domContext',
            maxTokens = 2048,
            nodeId,
        } = req.body;

        const validation = validateBrowser(req, browserId);
        if (validation.error) {
            return res
                .status(validation.status)
                .json({ success: false, message: validation.message });
        }
        const browserIdActual = validation.browserId;
        const entry = validation.entry;
        const browser = entry.browser || entry;

        const context = await getOrCreateContext(req, browser, browserIdActual);
        const pages = context.pages();
        const page = pages.length > 0 ? pages[pages.length - 1] : await context.newPage();

        emitLog({
            message: `Extracting DOM Context (${extractionType}) using ${selector || 'body'}`,
            type: 'info',
            nodeId,
        });

        let rawContent = '';
        if (selector) {
            const resolvedSelector = variableManager.resolve(selector);
            if (extractionType === 'html') {
                rawContent = await page.$eval(resolvedSelector, (el) => el.outerHTML);
            } else {
                rawContent = await page.$eval(resolvedSelector, (el) => el.innerText);
            }
        } else {
            if (extractionType === 'html') {
                rawContent = await page.content();
            } else {
                rawContent = await page.innerText('body');
            }
        }

        let finalContent = rawContent;

        // --- AI SMART EXTRACTION (Zero-Config) ---
        if (extractionType === 'text' || extractionType === 'markdown') {
            const activeProvider = req.headers['x-ai-provider'] || 'ollama';
            const activeModel =
                req.headers['x-ai-model'] || process.env.OLLAMA_MODEL || DEFAULT_LOCAL_MODEL;
            const headerBaseUrl = req.headers['x-ai-base-url'];
            const apiKey =
                req.headers['x-ai-api-key'] ||
                (activeProvider === 'openrouter' ? process.env.OPENROUTER_API_KEY : undefined) ||
                (activeProvider === 'ollama' ? 'ollama' : undefined);

            emitLog({
                message: `Cleaning up content with AI (${activeModel})...`,
                type: 'ai',
                nodeId,
            });

            const prompt =
                extractionType === 'markdown'
                    ? `Convert the following content into clean, well-structured Markdown. Remove UI noise like navigation menus, footers, and ads. Focus on the main content.\n\nContent:\n${rawContent}`
                    : `Extract and clean the main text from the following content. Remove boilerplate, UI artifacts, and repetitive elements. Retain only the actual information.\n\nContent:\n${rawContent}`;

            const response = await aiService.generateText({
                prompt,
                provider: activeProvider,
                model: activeModel,
                apiKey,
                baseUrl: headerBaseUrl,
                maxTokens: Number(maxTokens),
                parentSignal: req.signal,
            });

            finalContent = response.text || rawContent;
        }

        variableManager.set(variableName, finalContent, req.body.runId);

        emitLog({
            message: `Context extracted and saved to ${variableName}`,
            type: 'success',
            nodeId,
        });

        return res.status(200).json({
            success: true,
            message: req.t('actions.extract_dom_context.success'),
            data: {
                content: finalContent.substring(0, 500),
                variable: variableName,
                isSmart: extractionType !== 'html',
            },
        });
    } catch (error) {
        console.error('[ERROR] extractDomContextAction:', error.message);
        emitLog({
            message: `Error extracting DOM context: ${error.message}`,
            type: 'error',
            nodeId: req.body?.nodeId,
        });
        return res.status(500).json({
            success: false,
            message: req.t('actions.extract_dom_context.error'),
            error: error.message,
        });
    }
};

export default extractDomContextAction;
