import { emitElementPicked, emitElementSanitized } from '../socket.js';
/* global window, document, Element, Node */
import ollamaService from './OllamaService.js';

/**
 * The client-side code injected into the browser.
 * This runs in the context of the Web Page, NOT Node.js.
 */
const injectInspectorUI = () => {
    const HIGHLIGHT_ID = 'haltest-inspector-highlight';

    if (window.__haltestInspectorActive) {
        console.log('[Inspector] Inspector already active, resetting...');
    }

    window.__haltestInspectorActive = true;

    window.__haltestInspectorCleanup = function () {
        const oldEl = document.getElementById(HIGHLIGHT_ID);
        if (oldEl) oldEl.remove();
        window.__haltestInspectorActive = false;
    };

    window.__haltestInspectorCleanup();

    let highlightEl = document.createElement('div');
    highlightEl.id = HIGHLIGHT_ID;
    Object.assign(highlightEl.style, {
        position: 'fixed',
        pointerEvents: 'none',
        background: 'rgba(64, 150, 255, 0.2)',
        border: '2px solid #4096ff',
        zIndex: '2147483647',
        transition: 'all 0.1s ease',
        display: 'none',
        borderRadius: '4px',
        boxSizing: 'border-box',
    });
    document.body.appendChild(highlightEl);

    function isDynamicId(id) {
        if (!id) return false;
        return /([0-9]{3,})/.test(id) || /([a-f0-9]{8}-[a-f0-9]{4})/.test(id);
    }

    function escapeSelectorValue(value) {
        if (value == null) return '';
        return String(value).replace(/'/g, "\\'");
    }

    function escapeXPathValue(value) {
        if (value == null) return '';
        const escaped = String(value).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        if (escaped.includes("'")) {
            return `concat('${escaped.replace(/'/g, "', \"'\", '")}')`;
        }
        return escaped;
    }

    function generateSelector(el) {
        const candidates = {};

        const testIdAttrs = ['data-testid', 'data-test-id', 'data-test', 'data-cy'];
        for (const attr of testIdAttrs) {
            if (el.hasAttribute(attr)) {
                const testIdValue = el.getAttribute(attr);
                candidates.testId = `[${attr}="${testIdValue}"]`;
                if (attr === 'data-testid' || attr === 'data-test-id') {
                    candidates.playwrightTestId = `getByTestId('${escapeSelectorValue(testIdValue)}')`;
                }
                break;
            }
        }

        if (el.id && !isDynamicId(el.id)) {
            candidates.id = `#${window.CSS.escape(el.id)}`;
        }

        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) {
            candidates.aria = `[aria-label="${ariaLabel}"]`;
            const explicitRole = el.getAttribute('role');
            const implicitRoleMap = {
                BUTTON: 'button',
                A: 'link',
                INPUT: 'textbox',
                SELECT: 'combobox',
                TEXTAREA: 'textbox',
                H1: 'heading',
                H2: 'heading',
                H3: 'heading',
                NAV: 'navigation',
                MAIN: 'main',
                HEADER: 'banner',
                FOOTER: 'contentinfo',
            };
            const role = explicitRole || implicitRoleMap[el.tagName] || el.tagName.toLowerCase();
            candidates.playwrightRole = `getByRole('${role}', { name: '${escapeSelectorValue(ariaLabel)}' })`;
        }

        if (el.tagName === 'INPUT' && el.getAttribute('name')) {
            candidates.name = `input[name="${el.getAttribute('name')}"]`;
        }
        const placeholder = el.getAttribute('placeholder');
        if (placeholder && ['INPUT', 'TEXTAREA'].includes(el.tagName)) {
            candidates.playwrightLabel = `getByPlaceholder('${escapeSelectorValue(placeholder)}')`;
        }

        if (['BUTTON', 'A', 'SPAN', 'LI'].includes(el.tagName)) {
            const text = el.innerText.trim();
            if (text && text.length < 40 && !text.includes('\n')) {
                candidates.text = `//${el.tagName.toLowerCase()}[contains(text(), ${escapeXPathValue(text)})]`;

                if (!candidates.playwrightRole) {
                    const roleByTag = { BUTTON: 'button', A: 'link', LI: 'listitem' };
                    const tagRole = roleByTag[el.tagName];
                    if (tagRole) {
                        candidates.playwrightRole = `getByRole('${tagRole}', { name: '${escapeSelectorValue(text)}' })`;
                    }
                }
                candidates.playwrightText = `getByText('${escapeSelectorValue(text)}')`;
            }
        }

        candidates.cssPath = getCssPath(el);

        if (candidates.playwrightTestId)
            return {
                best: candidates.playwrightTestId,
                type: 'playwright_test_id',
                all: candidates,
            };
        if (candidates.playwrightRole)
            return { best: candidates.playwrightRole, type: 'playwright_role', all: candidates };
        if (candidates.testId) return { best: candidates.testId, type: 'test_id', all: candidates };
        if (candidates.id) return { best: candidates.id, type: 'id', all: candidates };
        if (candidates.name) return { best: candidates.name, type: 'name', all: candidates };
        if (candidates.playwrightLabel)
            return { best: candidates.playwrightLabel, type: 'playwright_label', all: candidates };
        if (candidates.aria)
            return { best: candidates.aria, type: 'accessibility', all: candidates };
        if (candidates.playwrightText)
            return { best: candidates.playwrightText, type: 'playwright_text', all: candidates };
        if (candidates.text) return { best: candidates.text, type: 'content', all: candidates };

        return { best: candidates.cssPath, type: 'path', all: candidates };
    }

    function getCssPath(el) {
        if (!(el instanceof Element)) return '';
        const path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id && !isDynamicId(el.id)) {
                selector += '#' + window.CSS.escape(el.id);
                path.unshift(selector);
                break;
            } else {
                let sib = el,
                    nth = 1;
                while ((sib = sib.previousElementSibling)) {
                    if (sib.nodeName.toLowerCase() == selector) nth++;
                }
                if (nth != 1) selector += ':nth-of-type(' + nth + ')';
            }
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(' > ');
    }

    function onMouseOver(e) {
        const el = e.target;
        if (el.id === HIGHLIGHT_ID) return;

        const rect = el.getBoundingClientRect();
        Object.assign(highlightEl.style, {
            display: 'block',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
        });
    }

    function onClick(e) {
        console.log('[HaltestInspector] Element clicked:', e.target);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const el = e.target;
        const result = generateSelector(el);
        console.log('[HaltestInspector] Selection result:', result);

        const pickId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

        const semanticContext = {
            tagName: el.tagName.toLowerCase(),
            role: el.getAttribute('role') || null,
            ariaLabel: el.getAttribute('aria-label') || null,
            ariaDescribedby: el.getAttribute('aria-describedby') || null,
            text: el.innerText ? el.innerText.trim().substring(0, 150) : null,
            type: el.getAttribute('type') || null,
            name: el.getAttribute('name') || null,
            placeholder: el.getAttribute('placeholder') || null,
            href: el.getAttribute('href') || null,
            parentTag: el.parentElement ? el.parentElement.tagName.toLowerCase() : null,
            parentRole: el.parentElement ? el.parentElement.getAttribute('role') : null,
            parentText:
                el.parentElement && el.parentElement.innerText
                    ? el.parentElement.innerText.trim().substring(0, 100)
                    : null,
            siblingCount: el.parentElement ? el.parentElement.children.length : 0,
            siblingIndex: el.parentElement ? Array.from(el.parentElement.children).indexOf(el) : -1,
        };

        cleanup();

        if (window.onElementSelected) {
            console.log('[HaltestInspector] Sending to backend via window.onElementSelected...');
            window.onElementSelected({
                pickId,
                selector: result.best,
                selectorType: result.type,
                candidates: result.all,
                strategy: result.type,
                htmlContext: el.innerText ? el.innerText.trim().substring(0, 400) : null,
                semanticContext,
                timestamp: new Date().toISOString(),
            });
        } else {
            console.error('[HaltestInspector] CRITICAL: window.onElementSelected not found!');
        }
    }

    function cleanup() {
        document.removeEventListener('mouseover', onMouseOver, true);
        document.removeEventListener('click', onClick, true);

        if (highlightEl) highlightEl.remove();

        window.__haltestInspectorActive = false;
    }

    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('click', onClick, true);

    window.__haltestInspectorCleanup = cleanup;
};

export async function startInspector(page) {
    if (!page || page.isClosed()) {
        throw new Error('No active page found to inspect.');
    }

    console.log('[Inspector] Starting inspection mode on page...');

    try {
        console.log('[Inspector] Exposing onElementSelected function...');
        await page.exposeFunction('onElementSelected', async (data) => {
            console.log(
                '[Inspector] 🎯 Element selected callback triggered with data:',
                JSON.stringify(data, null, 2),
            );

            const pickId = `${Date.now()}-${Math.random()}`;

            emitElementPicked({ ...data, pickId });

            (async () => {
                try {
                    const sanitized = await ollamaService.sanitizeSelector(
                        data.selector,
                        data.htmlContext,
                        data.selectorType,
                    );
                    if (sanitized && sanitized.confidence > 0.6) {
                        console.log(
                            `[Inspector] ✨ AI Optimized Selector — emitting element_sanitized: ${sanitized.sanitizedSelector} (confidence: ${sanitized.confidence})`,
                        );
                        emitElementSanitized({
                            pickId,
                            selector: sanitized.sanitizedSelector,
                            originalSelector: data.selector,
                            aiOptimized: true,
                            confidence: sanitized.confidence,
                            reasoning: sanitized.reasoning,
                        });
                    } else {
                        console.log(
                            '[Inspector] AI Sanitization confidence too low, skipping re-emit.',
                        );
                    }
                } catch (aiError) {
                    console.warn('[Inspector] AI Sanitization failed:', aiError.message);
                }
            })();
        });
        console.log('[Inspector] ✅ onElementSelected function exposed successfully.');
    } catch (error) {
        const msg = error.message || '';
        const isAlreadyExposed =
            msg.includes('already has been exposed') ||
            msg.includes('change the binding') ||
            msg.includes('already has been registered') ||
            msg.includes('already been registered') ||
            msg.includes('already registered');

        if (!isAlreadyExposed) {
            console.error('[Inspector] Failed to expose function:', error);
            throw error;
        }
    }

    if (!page.__halInspectorListenerAdded) {
        page.__halInspectorListenerAdded = true;

        page.on('domcontentloaded', async () => {
            if (page.__halIsPicking) {
                console.log('[Inspector] Navigation detected. Re-injecting inspector UI...');
                try {
                    await page.evaluate(injectInspectorUI);
                    console.log('[Inspector] Re-injection successful.');
                } catch (err) {
                    console.warn('[Inspector] Re-injection failed:', err.message);
                }
            }
        });
    }

    page.__halIsPicking = true;
    await page.evaluate(injectInspectorUI);
}

export async function stopInspector(page) {
    if (!page || page.isClosed()) return;

    try {
        page.__halIsPicking = false;

        await page.evaluate(() => {
            if (window.__haltestInspectorCleanup) {
                window.__haltestInspectorCleanup();
            }
        });
        console.log('[Inspector] Stopped inspection mode.');
    } catch (error) {
        console.warn('[Inspector] Error stopping inspector:', error.message);
    }
}
