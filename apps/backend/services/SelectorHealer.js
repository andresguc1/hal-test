import aiService from './AIService.js';
import { bestSelector } from '../core/decisions/SelectorRanker.js';
import { applyPolicy, ACTIONS, MODES } from '../core/decisions/DecisionPolicy.js';
import { vectorCacheService, vectorCacheConfig } from './vector-cache/index.js';
import { createHash } from 'crypto';

/* global document, window */

/**
 * SelectorHealer Service
 * Handles DOM compression and AI-powered selector repair.
 */
class SelectorHealer {
    static MIN_CONFIDENCE = 0.5;
    static SENSITIVE_SELECTORS = /password|secret|token|api[_-]?key|authorization/i;

    _sanitizeCandidate(candidate, confidence, originalSelector) {
        if (!candidate || typeof candidate !== 'string') {
            return { valid: false, reason: 'Empty or non-string selector returned by AI' };
        }
        const trimmed = candidate.trim();
        if (trimmed.length === 0) {
            return { valid: false, reason: 'Empty selector after trimming' };
        }
        if (trimmed.length > 500) {
            return { valid: false, reason: `Selector suspiciously long (${trimmed.length} chars)` };
        }
        if (
            trimmed.includes('function(') ||
            trimmed.includes('eval(') ||
            trimmed.includes('document.cookie') ||
            trimmed.includes('localStorage') ||
            trimmed.includes('fetch(') ||
            trimmed.includes('XMLHttpRequest')
        ) {
            console.warn(
                `[SelectorHealer] 🚨 Rejected suspicious selector candidate: ${trimmed.substring(0, 100)}`,
            );
            return { valid: false, reason: 'Selector contains code injection patterns' };
        }
        if (confidence < SelectorHealer.MIN_CONFIDENCE) {
            return {
                valid: false,
                reason: `Confidence ${confidence} below minimum threshold ${SelectorHealer.MIN_CONFIDENCE}`,
            };
        }
        const originalIsSensitive = SelectorHealer.SENSITIVE_SELECTORS.test(originalSelector);
        const candidateIsSensitive = SelectorHealer.SENSITIVE_SELECTORS.test(trimmed);
        if (candidateIsSensitive && !originalIsSensitive) {
            console.warn(
                `[SelectorHealer] ⚠️ AI selected a sensitive field selector when original was not sensitive. ` +
                    `Original: "${originalSelector}" → Candidate: "${trimmed}"`,
            );
            return {
                valid: false,
                reason: 'Candidate targets a sensitive field not present in original selector',
            };
        }
        return { valid: true, reason: 'OK' };
    }

    compressDOM(html) {
        return html;
    }

    getCompressionScript() {
        return (origSelector) => {
            const interactiveSelectors =
                'button, a, input, select, textarea, label, [role="button"], [role="link"], [role="searchbox"], [onclick], [data-testid], [aria-label]';
            let elements = Array.from(document.querySelectorAll(interactiveSelectors));
            elements = elements.filter((el) => {
                if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
                const style = window.getComputedStyle(el);
                return (
                    style.visibility !== 'hidden' &&
                    style.display !== 'none' &&
                    style.opacity !== '0'
                );
            });
            let targetLocation = null;
            if (origSelector) {
                try {
                    let targetEl = document.querySelector(origSelector);
                    if (!targetEl) {
                        const parts = origSelector.split(/[> ]+/);
                        for (let i = parts.length - 1; i >= 1; i--) {
                            try {
                                const sub = parts.slice(0, i).join(' ');
                                targetEl = document.querySelector(sub);
                                if (targetEl) break;
                            } catch (e) {
                                /* ignore */
                            }
                        }
                    }
                    if (targetEl) {
                        const r = targetEl.getBoundingClientRect();
                        targetLocation = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
                    }
                } catch (e) {
                    /* ignore */
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
            return elements
                .slice(0, 500)
                .map((el, index) => {
                    const tag = el.tagName.toLowerCase();
                    const id = el.id ? `id:${el.id}` : '';
                    const testId = el.getAttribute('data-testid')
                        ? `testId:${el.getAttribute('data-testid')}`
                        : '';
                    const aria = el.getAttribute('aria-label')
                        ? `aria:${el.getAttribute('aria-label')}`
                        : '';
                    const text = el.textContent
                        ? `text:${el.textContent.trim().replace(/\s+/g, ' ').substring(0, 50)}`
                        : '';
                    const role = el.getAttribute('role') ? `role:${el.getAttribute('role')}` : '';
                    const parts = [
                        `ref:${index}`,
                        `tag:${tag}`,
                        id,
                        testId,
                        aria,
                        role,
                        text,
                    ].filter((p) => p !== '' && !p.endsWith(':'));
                    return parts.join('|');
                })
                .join('\n');
        };
    }

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
        maxTiers = 3,
    }) {
        try {
            const tiers = Math.max(0, Math.min(3, maxTiers));
            console.log(
                `[SelectorHealer] Starting Advanced Tiered Healing: ${originalSelector} (Timeout: ${timeout}ms, maxTiers: ${tiers})`,
            );

            if (tiers === 0) {
                return {
                    correctedSelector: null,
                    reasoning: 'Self-healing skipped because retry limit is 0.',
                    confidence: 0,
                };
            }

            // 1. Extract Compressed DOM (Layer 1: DOM-Crusher)
            let compressedDOM = '';
            if (page && !page.isClosed()) {
                compressedDOM = await Promise.race([
                    page.evaluate(this.getCompressionScript(), originalSelector),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('DOM extraction timed out')), 10000),
                    ),
                ]);
            }

            // 1b. Deterministic gate (F0-F2): ranked candidates + policy, BEFORE any LLM call.
            const deterministicAttempt = bestSelector({
                domSnippet: compressedDOM,
                originalSelector,
            });
            if (
                deterministicAttempt.selector &&
                process.env.HALTEST_SELF_HEALING_MODE !== MODES.DISABLED
            ) {
                const policy = applyPolicy({
                    selector: deterministicAttempt.selector,
                    confidence: deterministicAttempt.confidence,
                });
                if (policy.action === ACTIONS.AUTO) {
                    const candidate = deterministicAttempt.selector;
                    const sanitization = this._sanitizeCandidate(
                        candidate,
                        deterministicAttempt.confidence,
                        originalSelector,
                    );
                    if (sanitization.valid) {
                        if (onProgress) {
                            onProgress({ step: 'verifying_candidate', candidate, tier: 0 });
                        }
                        const verification = await this.verifySelector(page, candidate);
                        if (verification.valid && verification.visible) {
                            console.log(
                                `[SelectorHealer] ✅ Deterministic heal: ${candidate} (conf=${deterministicAttempt.confidence})`,
                            );
                            return {
                                correctedSelector: candidate,
                                reasoning: `Deterministic signal match [${(deterministicAttempt.ranked[0]?.signals || []).join(', ') || deterministicAttempt.reason}]`,
                                confidence: deterministicAttempt.confidence,
                                verified: true,
                                tier: 0,
                                source: 'deterministic',
                                policyAction: policy.action,
                                metadata: {
                                    provider: 'deterministic',
                                    ambiguity: deterministicAttempt.ambiguity,
                                    signals: deterministicAttempt.ranked[0]?.signals || [],
                                    ranked: deterministicAttempt.ranked.map((r) => ({
                                        selector: r.selector,
                                        confidence: r.confidence,
                                    })),
                                },
                            };
                        }
                        console.warn(
                            `[SelectorHealer] ⚠️ Deterministic candidate failed verification: ${candidate}`,
                        );
                    }
                }
            }

            // 1c. Vector Cache Tier (Tier 0.5): Search for similar DOM fingerprints in local vector DB
            if (vectorCacheConfig.enabled && compressedDOM) {
                try {
                    console.log(
                        `[SelectorHealer] 🔍 Vector Cache Tier: searching for similar DOM patterns...`,
                    );
                    if (onProgress) {
                        onProgress({ step: 'vector_cache_search', tier: 0.5 });
                    }

                    const urlHash = createHash('sha256')
                        .update(page.url())
                        .digest('hex')
                        .slice(0, 16);
                    const domVector = await vectorCacheService.embed(compressedDOM);
                    const candidates = await vectorCacheService.searchSimilarSelectors({
                        domVector,
                        urlHash,
                        actionType: actionName,
                        k: vectorCacheConfig.maxCandidates,
                    });

                    for (const cand of candidates) {
                        console.log(
                            `[SelectorHealer] 🔍 Vector Cache candidate: ${cand.selector} (sim=${cand.similarity.toFixed(3)}, conf=${cand.confidence})`,
                        );
                        const sanitization = this._sanitizeCandidate(
                            cand.selector,
                            cand.confidence,
                            originalSelector,
                        );
                        if (!sanitization.valid) continue;

                        if (onProgress) {
                            onProgress({
                                step: 'verifying_candidate',
                                candidate: cand.selector,
                                tier: 0.5,
                            });
                        }

                        const verification = await this.verifySelector(page, cand.selector);
                        if (verification.valid && verification.visible) {
                            console.log(
                                `[SelectorHealer] ✅ Vector Cache heal: ${cand.selector} (similarity=${cand.similarity.toFixed(3)})`,
                            );
                            return {
                                correctedSelector: cand.selector,
                                reasoning: `Vector cache match (similarity: ${cand.similarity.toFixed(3)}, prior successes: ${cand.successCount})`,
                                confidence: Math.min(cand.confidence * cand.similarity, 0.95),
                                verified: true,
                                tier: 0.5,
                                source: 'vector-cache',
                                metadata: {
                                    similarity: cand.similarity,
                                    priorSuccesses: cand.successCount,
                                    actionType: cand.actionType,
                                },
                            };
                        }
                    }
                    console.log(`[SelectorHealer] ℹ️ Vector Cache: no valid candidates found`);
                } catch (error) {
                    console.warn(
                        `[SelectorHealer] ⚠️ Vector Cache tier error (continuing to AI):`,
                        error.message,
                    );
                }
            }

            const previousSelectors = [];

            for (let tier = 0; tier < tiers; tier++) {
                if (onProgress) {
                    onProgress({ step: `tier_${tier + 1}_start`, tier: tier + 1 });
                }

                console.log(`[SelectorHealer] Executing Tier ${tier + 1} for: ${originalSelector}`);

                // 2. AI Request with Tier context (Layer 2 & 3)
                const result = await aiService.healSelector({
                    domSnippet: compressedDOM || 'No DOM available',
                    originalSelector,
                    error: errorMessage,
                    intent: `Perform action: ${actionName}`,
                    apiKey: aiConfig?.apiKey,
                    provider: aiConfig?.provider || 'ollama',
                    model: aiConfig?.model,
                    baseUrl: aiConfig?.baseUrl,
                    timeout: timeout / tiers,
                    retryCount: tier,
                    previousSelectors: [...previousSelectors],
                });

                if (result.correctedSelector) {
                    const candidate = result.correctedSelector;

                    // Validate candidate before attempting DOM verification
                    const sanitization = this._sanitizeCandidate(
                        candidate,
                        result.confidence || 0,
                        originalSelector,
                    );
                    if (!sanitization.valid) {
                        console.warn(
                            `[SelectorHealer] ❌ Tier ${tier + 1} candidate rejected: ${sanitization.reason}`,
                        );
                        previousSelectors.push(candidate);
                        continue;
                    }

                    if (onProgress) {
                        onProgress({ step: 'verifying_candidate', candidate, tier: tier + 1 });
                    }

                    const verification = await this.verifySelector(page, candidate);
                    if (verification.valid && verification.visible) {
                        console.log(`[SelectorHealer] ✅ Tier ${tier + 1} Success: ${candidate}`);
                        return {
                            correctedSelector: candidate,
                            reasoning: result.reasoning,
                            confidence: result.confidence || 0.9,
                            verified: true,
                            tier: tier + 1,
                            metadata: {
                                model: aiConfig?.model || 'ollama',
                                provider: aiConfig?.provider || 'ollama',
                                tier: tier + 1,
                            },
                        };
                    } else {
                        console.warn(
                            `[SelectorHealer] ❌ Tier ${tier + 1} verification failed: ${candidate}`,
                        );
                        previousSelectors.push(candidate);
                    }
                } else {
                    console.warn(`[SelectorHealer] ⚠️ Tier ${tier + 1} returned no selector.`);
                }
            }

            return {
                correctedSelector: null,
                reasoning: 'All 3 tiers failed to produce a valid, visible selector',
                confidence: 0,
            };
        } catch (error) {
            console.error('[SelectorHealer] Error during tiered healing:', error);
            return { correctedSelector: null, reasoning: error.message, confidence: 0 };
        }
    }
}

export default new SelectorHealer();
