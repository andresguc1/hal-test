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
     * Delegated aggressively to the browser for performance on heavy pages.
     * Includes proximity-based prioritization if an original selector is provided.
     */
    /**
     * In-browser DOM compression function.
     * Evaluated in browser context via page.evaluate.
     * Safely handles SVGs, normalizes text spaces, avoids layout thrashing, and uses native parameter passing.
     */
    getCompressionScript() {
        return (origSelector) => {
            const interactiveSelectors =
                'button, a, input, select, textarea, label, [role="button"], [role="link"], [role="searchbox"], [onclick], [data-testid], [aria-label]';

            // 1. Get potential candidates
            let elements = Array.from(document.querySelectorAll(interactiveSelectors));

            // 2. Efficient visibility filtering (Avoid getComputedStyle when possible)
            elements = elements.filter((el) => {
                if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
                const style = window.getComputedStyle(el);
                return (
                    style.visibility !== 'hidden' &&
                    style.display !== 'none' &&
                    style.opacity !== '0'
                );
            });

            // 3. Proximity-based Prioritization (Pre-calculating coordinates to avoid layout thrashing)
            let targetLocation = null;
            if (origSelector) {
                try {
                    let targetEl = document.querySelector(origSelector);
                    if (!targetEl) {
                        // Fallback: try to find the nearest parent if selector is partially valid
                        const parts = origSelector.split(/[> ]+/);
                        for (let i = parts.length - 1; i >= 1; i--) {
                            try {
                                const sub = parts.slice(0, i).join(' ');
                                targetEl = document.querySelector(sub);
                                if (targetEl) break;
                            } catch (e) {
                                // ignore query error for invalid sub-selectors
                            }
                        }
                    }
                    if (targetEl) {
                        const r = targetEl.getBoundingClientRect();
                        targetLocation = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                    }
                } catch (e) {
                    // ignore query error for invalid original selector
                }
            }

            if (targetLocation) {
                elements = elements
                    .map((el) => {
                        const r = el.getBoundingClientRect();
                        const x = r.left + r.width / 2;
                        const y = r.top + r.height / 2;
                        const dist = Math.sqrt(
                            Math.pow(x - targetLocation.x, 2) + Math.pow(y - targetLocation.y, 2),
                        );
                        return { el, dist };
                    })
                    .sort((a, b) => a.dist - b.dist)
                    .map((item) => item.el);
            }

            // 4. Compact Representation (Max 500 elements)
            return elements
                .slice(0, 500)
                .map((el, index) => {
                    const breadcrumbs = [];
                    let curr = el.parentElement;
                    for (let i = 0; i < 3 && curr; i++) {
                        breadcrumbs.unshift(
                            curr.tagName.toLowerCase() + (curr.id ? '#' + curr.id : ''),
                        );
                        curr = curr.parentElement;
                    }

                    // Resolve class safely (handling SVGAnimatedString)
                    const rawClass =
                        typeof el.className === 'string'
                            ? el.className
                            : el.getAttribute('class') || '';
                    const className = rawClass.trim()
                        ? rawClass.split(/\s+/).slice(0, 3).join('.')
                        : undefined;

                    // Clean whitespace and newlines from text
                    const textContent = el.textContent
                        ? el.textContent.trim().replace(/\s+/g, ' ')
                        : '';

                    const obj = {
                        ref: index,
                        tag: el.tagName.toLowerCase(),
                        id: el.id || undefined,
                        class: className || undefined,
                        text: textContent.substring(0, 60) || undefined,
                        'aria-label': el.getAttribute('aria-label') || undefined,
                        'data-testid': el.getAttribute('data-testid') || undefined,
                        path: breadcrumbs.join(' > '),
                    };

                    return Object.entries(obj)
                        .filter(([_, v]) => v !== undefined && v !== '')
                        .map(([k, v]) => `${k}="${v}"`)
                        .join(' ');
                })
                .join('\n');
        };
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

    async heal({
        page,
        originalSelector,
        errorMessage,
        actionName,
        aiConfig,
        timeout = 30000,
        onProgress = null,
    }) {
        try {
            console.log(
                `[SelectorHealer] Healing selector: ${originalSelector} (Timeout: ${timeout}ms)`,
            );

            // 1. Extract Compressed DOM with Semantic Context
            let compressedDOM = '';
            if (page && !page.isClosed()) {
                compressedDOM = await Promise.race([
                    page.evaluate(this.getCompressionScript(), originalSelector),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('DOM extraction timed out')), 10000),
                    ),
                ]);
            }

            // 2. Delegate to AI service requesting multiple candidates
            const aiStart = Date.now();
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
            const aiResponseTime = Date.now() - aiStart;
            const domSize = compressedDOM?.length || 0;

            // 3. Multi-Candidate Verification Loop (Phase 3)
            const candidates = result.alternative_selectors || [result.correctedSelector];
            console.log(
                `[SelectorHealer] AI suggested ${candidates.length} candidates. Verifying...`,
            );

            for (let i = 0; i < candidates.length; i++) {
                const candidate = candidates[i];
                if (!candidate || candidate === originalSelector) continue;

                if (onProgress) {
                    onProgress({
                        step: 'verifying_candidate',
                        candidate,
                        index: i + 1,
                        total: candidates.length,
                    });
                }

                const verification = await this.verifySelector(page, candidate);
                if (verification.valid && verification.visible) {
                    if (onProgress) {
                        onProgress({
                            step: 'candidate_success',
                            candidate,
                            unique: verification.unique,
                        });
                    }
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
                        metadata: {
                            aiResponseTime,
                            domSize,
                            model: aiConfig?.model || 'ollama',
                            provider: aiConfig?.provider || 'ollama',
                            candidateCount: candidates.length,
                        },
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
                    metadata: {
                        aiResponseTime,
                        domSize,
                        model: aiConfig?.model || 'ollama',
                        provider: aiConfig?.provider || 'ollama',
                    },
                };
            }

            return {
                correctedSelector: null,
                reasoning: 'No valid candidates found during verification',
                confidence: 0,
                metadata: {
                    aiResponseTime,
                    domSize,
                    model: aiConfig?.model || 'ollama',
                    provider: aiConfig?.provider || 'ollama',
                },
            };
        } catch (error) {
            console.error('[SelectorHealer] Error during healing:', error);
            return { correctedSelector: null, reasoning: error.message, confidence: 0 };
        }
    }
}

export default new SelectorHealer();
