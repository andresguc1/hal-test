/* eslint-disable no-undef */
import { emitElementPicked } from '../socket.js';

/**
 * Injects the inspection script into the Page.
 * @param {import('playwright').Page} page
 */
export async function startInspector(page) {
    if (!page || page.isClosed()) {
        throw new Error('No active page found to inspect.');
    }

    console.log('[Inspector] Starting inspection mode on page...');

    // 1. Expose the callback function to Node.js
    // Wrap in try-catch because if it's already exposed, it throws an error
    try {
        console.log('[Inspector] Exposing onElementSelected function...');
        await page.exposeFunction('onElementSelected', (data) => {
            console.log(
                '[Inspector] 🎯 Element selected callback triggered with data:',
                JSON.stringify(data, null, 2),
            );
            emitElementPicked(data);
        });
        console.log('[Inspector] ✅ onElementSelected function exposed successfully.');
    } catch (error) {
        // Ignore "already has been exposed" or "already has been registered" error
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

    // 2. Inject the client-side script
    await page.evaluate(() => {
        // --- CLIENT SIDE CODE ---
        const HIGHLIGHT_ID = 'haltest-inspector-highlight';

        // NOTE: If we re-run this, we want to RESET the inspector, not return early.
        // So we call cleanup first just in case.
        if (window.__haltestInspectorActive) {
            // We assume a global cleanup function might exist or we just manually remove listeners common to this logic
            // But since scope is isolated, we can't easily call the previous 'cleanup'.
            // However, we can use the window flag to check.
            console.log('[Inspector] Inspector already active, resetting...');
        }

        window.__haltestInspectorActive = true;

        // Cleanup Helper
        window.__haltestInspectorCleanup = function () {
            const oldEl = document.getElementById(HIGHLIGHT_ID);
            if (oldEl) oldEl.remove();

            // Remove listeners if they were attached to window/document (simulated here by reload/navigation usually,
            // but we should ideally track them. For now, removing the UI is the main visual reset).
            window.__haltestInspectorActive = false;
        };

        // Run once to start fresh
        window.__haltestInspectorCleanup();

        // Create Highlighter Element
        let highlightEl = document.createElement('div');
        highlightEl.id = HIGHLIGHT_ID;
        Object.assign(highlightEl.style, {
            position: 'fixed',
            pointerEvents: 'none',
            background: 'rgba(64, 150, 255, 0.2)', // Semi-transparent blue
            border: '2px solid #4096ff',
            zIndex: '2147483647', // Max z-index
            transition: 'all 0.1s ease',
            display: 'none',
            borderRadius: '4px',
            boxSizing: 'border-box', // Ensure border doesn't add size
        });
        document.body.appendChild(highlightEl);

        // Helper to check if ID looks dynamic (e.g., container-1234, uid-abcde)
        function isDynamicId(id) {
            if (!id) return false;
            // Matches: long numbers, GUID-like strings, randomized suffixes
            return /([0-9]{3,})/.test(id) || /([a-f0-9]{8}-[a-f0-9]{4})/.test(id);
        }

        // Smart Selector Generator
        function generateSelector(el) {
            const candidates = {};

            // 1. Data-Test Attributes (Gold Standard)
            const testIdAttrs = ['data-testid', 'data-test-id', 'data-test', 'data-cy'];
            for (const attr of testIdAttrs) {
                if (el.hasAttribute(attr)) {
                    candidates.testId = `[${attr}="${el.getAttribute(attr)}"]`;
                    break;
                }
            }

            // 2. ID (Attributes) - Only if not dynamic
            if (el.id && !isDynamicId(el.id)) {
                candidates.id = `#${el.id}`;
            }

            // 3. Aria Label (Accessibility)
            if (el.getAttribute('aria-label')) {
                candidates.aria = `[aria-label="${el.getAttribute('aria-label')}"]`;
            }

            // 4. Input Name (Forms)
            if (el.tagName === 'INPUT' && el.getAttribute('name')) {
                candidates.name = `input[name="${el.getAttribute('name')}"]`;
            }

            // 5. Text Content (Buttons/Links) - Contextual
            if (['BUTTON', 'A', 'SPAN'].includes(el.tagName)) {
                const text = el.innerText.trim();
                // Short, meaningful text, no newlines
                if (text && text.length < 30 && !text.includes('\n')) {
                    // Using XPath for text as standard CSS doesn't support text matching seamlessly without :has or special syntax
                    // We format this as a pseudo-selector for readability or standard xpath
                    candidates.text = `//${el.tagName.toLowerCase()}[contains(text(), '${text}')]`;
                }
            }

            // 6. Full CSS Path (Fallback)
            candidates.cssPath = getCssPath(el);

            // --- SELECTION STRATEGY ---
            // Priority: TestID > Stable ID > Input Name > Aria > Text > CSS Path

            if (candidates.testId)
                return { best: candidates.testId, type: 'test_id', all: candidates };
            if (candidates.id) return { best: candidates.id, type: 'id', all: candidates };
            if (candidates.name) return { best: candidates.name, type: 'name', all: candidates };
            if (candidates.aria)
                return { best: candidates.aria, type: 'accessibility', all: candidates };
            if (candidates.text) return { best: candidates.text, type: 'content', all: candidates };

            return { best: candidates.cssPath, type: 'path', all: candidates };
        }

        function getCssPath(el) {
            if (!(el instanceof Element)) return;
            const path = [];
            while (el.nodeType === Node.ELEMENT_NODE) {
                let selector = el.nodeName.toLowerCase();
                if (el.id && !isDynamicId(el.id)) {
                    selector += '#' + el.id;
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

        // Event Handlers
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
            // Prevent default click behavior
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const el = e.target;
            const result = generateSelector(el);
            console.log('[HaltestInspector] Selection result:', result);

            // Clean up
            cleanup();

            // Send to backend
            // We verify the backend expects 'selector' property for backward compatibility
            if (window.onElementSelected) {
                console.log(
                    '[HaltestInspector] Sending to backend via window.onElementSelected...',
                );
                window.onElementSelected({
                    selector: result.best,
                    candidates: result.all,
                    strategy: result.type,
                    timestamp: new Date().toISOString(),
                });
            } else {
                console.error('[HaltestInspector] CRITICAL: window.onElementSelected not found!');
            }
        }

        function cleanup() {
            // Remove listeners
            document.removeEventListener('mouseover', onMouseOver, true);
            document.removeEventListener('click', onClick, true);

            if (highlightEl) highlightEl.remove();

            window.__haltestInspectorActive = false;
        }

        // Store cleanup on window so we can potentially call it later if needed (though we rely on this closure for now)
        // Ideally we would want to remove previous listeners if they exist, but simple overwriting works if we trust the flow.
        // For robustness, lets attach to document (capturing) to ensure we get events first.
        document.addEventListener('mouseover', onMouseOver, true);
        document.addEventListener('click', onClick, true);

        // Expose robust cleanup that removes listeners
        window.__haltestInspectorCleanup = cleanup;
    });
}

/**
 * Stops the inspector by calling cleanup on the page.
 * @param {import('playwright').Page} page
 */
export async function stopInspector(page) {
    if (!page || page.isClosed()) return;

    try {
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
