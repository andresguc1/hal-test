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
        await page.exposeFunction('onElementSelected', (data) => {
            console.log('[Inspector] Element selected:', data);
            emitElementPicked(data);
        });
    } catch (error) {
        // Ignore "already has been exposed" error
        if (!error.message.includes('already has been exposed')) {
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

        // Cleanup Helper (to be attached to window for potential external use or just internal logic)
        function existingCleanup() {
            const oldEl = document.getElementById(HIGHLIGHT_ID);
            if (oldEl) oldEl.remove();
            // We can't remove anonymous event listeners from previous injection easily
            // unless we stored them on window. Ideally, we should.
        }
        existingCleanup();

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

        // Smart Selector Generator
        function generateSelector(el) {
            // 1. ID (Highest priority)
            if (el.id) return `#${el.id}`;

            // 2. Test IDs (Common in testing)
            const testIdAttrs = ['data-testid', 'data-test-id', 'data-test', 'data-cy'];
            for (const attr of testIdAttrs) {
                if (el.hasAttribute(attr)) {
                    return `[${attr}="${el.getAttribute(attr)}"]`;
                }
            }

            // 3. Text Content (Great for buttons/links)
            if (['BUTTON', 'A', 'SPAN', 'DIV'].includes(el.tagName)) {
                const text = el.innerText.trim();
                // Avoid long texts or empty ones
                if (text && text.length < 50 && !text.includes('\n')) {
                    // Try to use playwright text selector engine if possible,
                    // but for raw CSS/XPath we stick to standard attributes for now.
                    // Returning a specialized object could be better, but we return a primary string for now.
                    // We'll fallback to generation logic below.
                }
            }

            // 4. Input attributes (Name, Placeholder, Type)
            if (el.tagName === 'INPUT') {
                if (el.getAttribute('name')) return `input[name="${el.getAttribute('name')}"]`;
                if (el.getAttribute('placeholder'))
                    return `input[placeholder="${el.getAttribute('placeholder')}"]`;
                if (el.getAttribute('type')) return `input[type="${el.getAttribute('type')}"]`;
            }

            // 5. CSS Path (Fallback)
            return getCssPath(el);
        }

        function getCssPath(el) {
            if (!(el instanceof Element)) return;
            const path = [];
            while (el.nodeType === Node.ELEMENT_NODE) {
                let selector = el.nodeName.toLowerCase();
                if (el.id) {
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
            // Prevent default click behavior
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const el = e.target;
            const selector = generateSelector(el);

            // Clean up
            cleanup();

            // Send to backend
            window.onElementSelected({ selector });
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
    });
}
