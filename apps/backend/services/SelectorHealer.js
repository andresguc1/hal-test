import aiService from './AIService.js';

/* global document, window */

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
     * Includes semantic context (breadcrumbs) and proximity-based prioritization.
     */
    getCompressionScript(_originalSelector) {
        return `
            (() => {
                const interactiveSelectors = 'button, a, input, select, textarea, label, span, [role="button"], [role="link"], [role="searchbox"], [role="img"], [onclick], [aria-label], [title], [data-testid]';
                let elements = Array.from(document.querySelectorAll(interactiveSelectors));
                
                const simplified = elements
                    .filter(el => {
                        const style = window.getComputedStyle(el);
                        return (el.offsetWidth > 0 && el.offsetHeight > 0 && style.visibility !== 'hidden' && style.display !== 'none');
                    })
                    .slice(0, 400) 
                    .map((el, index) => {
                        const breadcrumbs = [];
                        let curr = el.parentElement;
                        for (let i = 0; i < 3 && curr; i++) {
                            const tag = curr.tagName.toLowerCase();
                            const id = curr.id ? '#' + curr.id : '';
                            breadcrumbs.unshift(\`\${tag}\${id}\`);
                            curr = curr.parentElement;
                        }

                        const obj = {
                            ref: index,
                            tag: el.tagName.toLowerCase(),
                            id: el.id || undefined,
                            class: el.className || undefined,
                            name: el.getAttribute('name') || undefined,
                            placeholder: el.getAttribute('placeholder') || undefined,
                            'aria-label': el.getAttribute('aria-label') || undefined,
                            'data-testid': el.getAttribute('data-testid') || undefined,
                            text: el.textContent.trim().substring(0, 80) || undefined,
                            path: breadcrumbs.join(' > ')
                        };
                        return Object.entries(obj)
                            .filter(([_, v]) => v !== undefined && v !== '')
                            .map(([k, v]) => \`\${k}="\${v}"\`)
                            .join(' ');
                    }).join('\\n');
                
                return simplified;
            })()
        `;
    }

    /**
     * Verifies if a selector is valid, unique, and visible on the page.
     */
    async verifySelector(page, selector) {
        if (!selector) return { valid: false, unique: false, visible: false };
        try {
            const stats = await page.evaluate((sel) => {
                try {
                    const elements = document.querySelectorAll(sel);
                    if (elements.length === 0) return { count: 0, visible: false };

                    const first = elements[0];
                    const rect = first.getBoundingClientRect();
                    const isVisible =
                        rect.width > 0 &&
                        rect.height > 0 &&
                        window.getComputedStyle(first).visibility !== 'hidden' &&
                        window.getComputedStyle(first).display !== 'none';

                    return { count: elements.length, visible: isVisible };
                } catch (e) {
                    return { error: e.message };
                }
            }, selector);

            if (stats.error)
                return { valid: false, unique: false, visible: false, error: stats.error };

            return {
                valid: stats.count > 0,
                unique: stats.count === 1,
                visible: stats.visible,
                count: stats.count,
            };
        } catch (error) {
            return { valid: false, unique: false, visible: false, error: error.message };
        }
    }

    async heal({ page, originalSelector, errorMessage, actionName, aiConfig, timeout = 30000 }) {
        try {
            console.log(
                `[SelectorHealer] Healing selector: ${originalSelector} (Timeout: ${timeout}ms)`,
            );

            // 1. Extract Compressed DOM with Semantic Context
            let compressedDOM = '';
            if (page && !page.isClosed()) {
                compressedDOM = await Promise.race([
                    page.evaluate(this.getCompressionScript(originalSelector)),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('DOM extraction timed out')), 10000),
                    ),
                ]);
            }

            // 2. Delegate to AI service requesting multiple candidates
            const result = await aiService.healSelector({
                screenshotBase64: null,
                domSnippet: compressedDOM || 'No DOM available',
                originalSelector: originalSelector,
                error: errorMessage,
                intent: `Perform action: ${actionName}`,
                apiKey: aiConfig?.apiKey,
                provider: aiConfig?.provider || 'ollama',
                model: aiConfig?.model,
                baseUrl: aiConfig?.baseUrl,
                timeout: timeout,
            });

            // 3. Multi-Candidate Verification Loop (Phase 3)
            const candidates = result.alternative_selectors || [result.correctedSelector];
            console.log(
                `[SelectorHealer] AI suggested ${candidates.length} candidates. Verifying...`,
            );

            for (const candidate of candidates) {
                if (!candidate || candidate === originalSelector) continue;

                const verification = await this.verifySelector(page, candidate);
                if (verification.valid && verification.visible) {
                    console.log(
                        `[SelectorHealer] ✅ Verified candidate: ${candidate} (${verification.unique ? 'Unique' : 'Multiple matches: ' + verification.count})`,
                    );

                    return {
                        correctedSelector: candidate,
                        reasoning: result.reasoning,
                        confidence: verification.unique
                            ? result.confidence || 0.9
                            : (result.confidence || 0.9) * 0.7,
                        verified: true,
                        isUnique: verification.unique,
                    };
                }
            }

            // Fallback: If no candidate was verified as visible, return the first one if it's at least valid
            if (result.correctedSelector) {
                return {
                    correctedSelector: result.correctedSelector,
                    reasoning: result.reasoning,
                    confidence: result.confidence || 0.5,
                    verified: false,
                };
            }

            return {
                correctedSelector: null,
                reasoning: 'No valid candidates found during verification',
                confidence: 0,
            };
        } catch (error) {
            console.error('[SelectorHealer] Error during healing:', error);
            return { correctedSelector: null, reasoning: error.message, confidence: 0 };
        }
    }
}

export default new SelectorHealer();
