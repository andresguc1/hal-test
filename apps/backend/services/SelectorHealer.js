import aiService from './AIService.js';

/**
 * SelectorHealer Service
 * Handles DOM compression and AI-powered selector repair.
 */
class SelectorHealer {
    /**
     * Compresses the DOM to only include interactive and relevant elements.
     * This reduces token usage and improves AI accuracy.
     * @param {string} html
     * @returns {string} Simplified HTML
     */
    compressDOM(html) {
        // Since we are running in Node, we could use a parser like JSDOM,
        // but for a lightweight "compressor" we can use regex or simple string manipulation
        // if we have the content. However, the best way is to do it on the browser side
        // via page.evaluate to have access to the actual DOM tree.
        return html; // Placeholder if called with already filtered string
    }

    /**
     * In-browser DOM compression script.
     * To be executed via page.evaluate()
     */
    getCompressionScript() {
        return `
            (() => {
                const interactiveSelectors = 'button, a, input, select, textarea, [role="button"], [role="link"], [role="searchbox"], [role="img"], [onclick], [aria-label], [title]';
                const elements = document.querySelectorAll(interactiveSelectors);
                const simplified = Array.from(elements)
                    .filter(el => {
                        // Basic visibility check
                        return el.offsetWidth > 0 && el.offsetHeight > 0 && window.getComputedStyle(el).visibility !== 'hidden';
                    })
                    .slice(0, 500) // Limit to 500 most relevant elements
                    .map(el => {
                    const obj = {
                        tag: el.tagName.toLowerCase(),
                        id: el.id || undefined,
                        class: el.className || undefined,
                        name: el.getAttribute('name') || undefined,
                        placeholder: el.getAttribute('placeholder') || undefined,
                        'aria-label': el.getAttribute('aria-label') || undefined,
                        text: el.textContent.trim().substring(0, 50) || undefined
                    };
                    // Remove undefined keys
                    return Object.entries(obj)
                        .filter(([_, v]) => v !== undefined)
                        .map(([k, v]) => \`\${k}="\${v}"\`)
                        .join(' ');
                }).join('\\n');
                console.log(\`[SelectorHealer] Extracted \${elements.length} interactive elements.\`);
                return simplified;
            })()
        `;
    }

    async heal({ page, originalSelector, errorMessage, actionName, apiKey, timeout = 30000 }) {
        try {
            console.log(
                `[SelectorHealer] Healing selector: ${originalSelector} (Timeout: ${timeout}ms)`,
            );

            // 1. Extract Compressed DOM
            let compressedDOM = '';
            if (page && !page.isClosed()) {
                // Use a smaller timeout for DOM extraction (e.g., 10s)
                compressedDOM = await Promise.race([
                    page.evaluate(this.getCompressionScript()),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('DOM extraction timed out')), 10000),
                    ),
                ]);
            }

            // 2. Delegate to central AI service with structured output
            const result = await aiService.healSelector({
                screenshotBase64: null,
                domSnippet: compressedDOM || 'No DOM available',
                originalSelector: originalSelector,
                error: errorMessage,
                intent: `Perform action: ${actionName}`,
                apiKey: apiKey,
                provider: 'ollama',
                model: 'gemma3',
                timeout: timeout, // Pass the timeout to AIService
            });

            return {
                correctedSelector: result.correctedSelector,
                reasoning: result.reasoning,
                confidence: result.confidence || 0.9,
            };
        } catch (error) {
            console.error('[SelectorHealer] Error during healing:', error);
            return { correctedSelector: null, reasoning: error.message, confidence: 0 };
        }
    }
}

export default new SelectorHealer();
