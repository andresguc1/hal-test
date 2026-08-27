import { emitElementPicked, emitElementSanitized } from '../socket.js';
/* global window, document, Element, Node, CSS */
import ollamaService from './OllamaService.js';

/**
 * The client-side code injected into the browser.
 * This runs in the context of the Web Page, NOT Node.js.
 */
const injectInspectorUI = () => {
    const HIGHLIGHT_ID = 'haltest-inspector-highlight';

    const IMPLICIT_ROLE_MAP = {
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
            candidates.playwrightPlaceholder = `getByPlaceholder('${escapeSelectorValue(placeholder)}')`;
        }

        let labelText = null;
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
            const elId = el.getAttribute('id');
            if (elId) {
                try {
                    const label = document.querySelector(`label[for="${window.CSS.escape(elId)}"]`);
                    if (label) {
                        labelText = label.innerText.trim();
                    }
                } catch (e) {
                    // ignore selector errors
                }
            }
            if (!labelText) {
                const parentLabel = el.closest?.('label');
                if (parentLabel) {
                    labelText = parentLabel.innerText
                        .trim()
                        .replace(el.value || el.innerText || '', '')
                        .trim();
                }
            }
        }
        if (labelText) {
            candidates.playwrightLabel = `getByLabel('${escapeSelectorValue(labelText)}')`;
        }

        if (el.tagName === 'IMG' && el.hasAttribute('alt')) {
            const altText = el.getAttribute('alt');
            if (altText) {
                candidates.playwrightAltText = `getByAltText('${escapeSelectorValue(altText)}')`;
            }
        }

        const title = el.getAttribute('title');
        if (title && !candidates.playwrightLabel && !candidates.playwrightRole) {
            candidates.playwrightTitle = `getByTitle('${escapeSelectorValue(title)}')`;
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

        if (!candidates.xpath) {
            candidates.xpath = getCssPath(el);
        }

        if (candidates.playwrightTestId) {
            return {
                best: candidates.playwrightTestId,
                type: 'playwright_test_id',
                all: candidates,
            };
        }
        if (candidates.playwrightRole) {
            const role = candidates.playwrightRole.match(/getByRole\('([^']+)'/)?.[1];
            const name = candidates.playwrightRole.match(/name:\s*['"]([^'"]+)['"]/)?.[1];
            const matchCount = countRoleMatches(role, name);
            if (matchCount > 1) {
                const contextChain = findStableContextChain(el);
                if (contextChain.length > 0) {
                    const resolved = countRoleMatchesInChain(role, name, contextChain);
                    if (resolved <= 1) {
                        candidates.playwrightRole = wrapWithContextChain(
                            candidates.playwrightRole.replace('page.', ''),
                            contextChain,
                        );
                        candidates.ambiguous = true;
                        candidates.context = contextChain[0];
                        candidates.contextChain = contextChain;
                    } else {
                        const cardinality = getCardinalitySelector(
                            el,
                            candidates.playwrightRole,
                            (child) => matchesRoleAndName(child, role, name),
                        );
                        if (cardinality) {
                            candidates.playwrightRole = wrapWithContextChain(
                                cardinality,
                                contextChain,
                            );
                            candidates.ambiguous = true;
                            candidates.context = contextChain[0];
                            candidates.contextChain = contextChain;
                            candidates.cardinality = true;
                        } else {
                            candidates.ambiguous = true;
                        }
                    }
                } else {
                    const cardinality = getCardinalitySelector(
                        el,
                        candidates.playwrightRole,
                        (child) => matchesRoleAndName(child, role, name),
                    );
                    if (cardinality) {
                        candidates.playwrightRole = cardinality;
                        candidates.ambiguous = true;
                        candidates.cardinality = true;
                    } else {
                        candidates.ambiguous = true;
                    }
                }
            }
            return { best: candidates.playwrightRole, type: 'playwright_role', all: candidates };
        }
        if (candidates.playwrightLabel) {
            const labelValue = candidates.playwrightLabel.match(
                /getByLabel\(['"]([^'"]+)['"]\)/,
            )?.[1];
            const matchCount = countLabelMatches(labelValue);
            if (matchCount > 1) {
                const contextChain = findStableContextChain(el);
                if (contextChain.length > 0) {
                    candidates.playwrightLabel = wrapWithContextChain(
                        candidates.playwrightLabel.replace('page.', ''),
                        contextChain,
                    );
                    candidates.ambiguous = true;
                    candidates.context = contextChain[0];
                    candidates.contextChain = contextChain;
                } else {
                    const cardinality = getCardinalitySelector(
                        el,
                        candidates.playwrightLabel,
                        (child) => matchesLabel(child, labelValue),
                    );
                    if (cardinality) {
                        candidates.playwrightLabel = cardinality;
                        candidates.ambiguous = true;
                        candidates.cardinality = true;
                    } else {
                        candidates.ambiguous = true;
                    }
                }
            }
            return { best: candidates.playwrightLabel, type: 'playwright_label', all: candidates };
        }
        if (candidates.testId) return { best: candidates.testId, type: 'test_id', all: candidates };
        if (candidates.id) return { best: candidates.id, type: 'id', all: candidates };
        if (candidates.name) return { best: candidates.name, type: 'name', all: candidates };
        if (candidates.playwrightPlaceholder) {
            const placeholderValue = candidates.playwrightPlaceholder.match(
                /getByPlaceholder\(['"]([^'"]+)['"]\)/,
            )?.[1];
            const matchCount = countPlaceholderMatches(placeholderValue);
            if (matchCount > 1) {
                candidates.playwrightPlaceholder = candidates.playwrightPlaceholder.replace(
                    'page.',
                    '',
                );
                candidates.ambiguous = true;
            }
            return {
                best: candidates.playwrightPlaceholder,
                type: 'playwright_placeholder',
                all: candidates,
            };
        }
        if (candidates.aria)
            return { best: candidates.aria, type: 'accessibility', all: candidates };
        if (candidates.playwrightAltText) {
            const altValue = candidates.playwrightAltText.match(
                /getByAltText\(['"]([^'"]+)['"]\)/,
            )?.[1];
            const matchCount = countAltTextMatches(altValue);
            if (matchCount > 1) {
                candidates.playwrightAltText = candidates.playwrightAltText.replace('page.', '');
                candidates.ambiguous = true;
            }
            return {
                best: candidates.playwrightAltText,
                type: 'playwright_alt_text',
                all: candidates,
            };
        }
        if (candidates.playwrightTitle) {
            const titleValue = candidates.playwrightTitle.match(
                /getByTitle\(['"]([^'"]+)['"]\)/,
            )?.[1];
            const matchCount = countTitleMatches(titleValue);
            if (matchCount > 1) {
                candidates.playwrightTitle = candidates.playwrightTitle.replace('page.', '');
                candidates.ambiguous = true;
            }
            return {
                best: candidates.playwrightTitle,
                type: 'playwright_title',
                all: candidates,
            };
        }
        if (candidates.playwrightText) {
            const textValue = candidates.playwrightText.match(/getByText\(['"]([^'"]+)['"]\)/)?.[1];
            const matchCount = countTextMatches(textValue);
            if (matchCount > 1) {
                candidates.playwrightText = candidates.playwrightText.replace('page.', '');
                candidates.ambiguous = true;
            }
            return { best: candidates.playwrightText, type: 'playwright_text', all: candidates };
        }
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

    function getAccessibleName(el) {
        if (!(el instanceof Element)) return '';
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel.trim();

        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
            const parts = labelledBy.split(/\s+/);
            const text = parts
                .map((id) => {
                    const node = document.getElementById(id);
                    return node ? node.innerText.trim() : '';
                })
                .filter(Boolean)
                .join(' ');
            if (text) return text;
        }

        const role =
            el.getAttribute('role') || IMPLICIT_ROLE_MAP[el.tagName] || el.tagName.toLowerCase();
        if (
            [
                'button',
                'link',
                'textbox',
                'combobox',
                'checkbox',
                'radio',
                'heading',
                'listitem',
                'menuitem',
            ].includes(role)
        ) {
            const text = el.innerText.trim();
            if (text) return text;
        }

        const placeholder = el.getAttribute('placeholder');
        if (placeholder && (role === 'textbox' || role === 'combobox')) {
            return placeholder;
        }

        const title = el.getAttribute('title');
        if (title) return title;

        return '';
    }

    function isElementVisible(el) {
        if (!(el instanceof Element)) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;
        const style = window.getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0';
    }

    function countRoleMatches(role, name) {
        if (!role || !name) return 0;
        const lowerName = name.toLowerCase();
        const elements = document.querySelectorAll('*');
        let count = 0;
        for (const el of elements) {
            if (!isElementVisible(el)) continue;
            const elRole =
                el.getAttribute('role') ||
                IMPLICIT_ROLE_MAP[el.tagName] ||
                el.tagName.toLowerCase();
            if (elRole !== role) continue;
            const accessibleName = getAccessibleName(el);
            if (accessibleName.toLowerCase() === lowerName) {
                count++;
            }
        }
        return count;
    }

    function countRoleMatchesInChain(role, name, contextChain) {
        if (!role || !name || !contextChain || contextChain.length === 0)
            return countRoleMatches(role, name);

        const outerCtx = contextChain[0];
        let scope;
        if (outerCtx.name) {
            scope =
                document.querySelector(
                    `[role="${outerCtx.role}"][aria-label="${CSS.escape(outerCtx.name)}"]`,
                ) || document.querySelector(outerCtx.role);
        } else {
            scope = document.querySelector(`[role="${outerCtx.role}"]`);
        }
        if (!scope) return countRoleMatches(role, name);

        const lowerName = name.toLowerCase();
        const elements = scope.querySelectorAll('*');
        let count = 0;
        for (const el of elements) {
            if (!isElementVisible(el)) continue;
            const elRole =
                el.getAttribute('role') ||
                IMPLICIT_ROLE_MAP[el.tagName] ||
                el.tagName.toLowerCase();
            if (elRole !== role) continue;
            const accessibleName = getAccessibleName(el);
            if (accessibleName.toLowerCase() === lowerName) {
                count++;
            }
        }
        return count;
    }

    function countTextMatches(text) {
        if (!text) return 0;
        const elements = document.querySelectorAll('*');
        let count = 0;
        for (const el of elements) {
            if (!isElementVisible(el)) continue;
            if (el.children.length === 0) {
                const nodeText = el.innerText.trim();
                if (nodeText === text) {
                    count++;
                }
            }
        }
        return count;
    }

    function countPlaceholderMatches(placeholder) {
        if (!placeholder) return 0;
        const elements = document.querySelectorAll('input, textarea, select');
        let count = 0;
        for (const el of elements) {
            if (!isElementVisible(el)) continue;
            if (el.getAttribute('placeholder') === placeholder) {
                count++;
            }
        }
        return count;
    }

    function countLabelMatches(label) {
        if (!label) return 0;
        const lowerLabel = label.toLowerCase();
        const elements = document.querySelectorAll('input, select, textarea');
        let count = 0;
        for (const el of elements) {
            if (!isElementVisible(el)) continue;
            const elId = el.getAttribute('id');
            if (elId) {
                try {
                    const labelEl = document.querySelector(
                        `label[for="${window.CSS.escape(elId)}"]`,
                    );
                    if (labelEl && labelEl.innerText.trim().toLowerCase() === lowerLabel) {
                        count++;
                        continue;
                    }
                } catch (e) {
                    // ignore
                }
            }
            const parentLabel = el.closest?.('label');
            if (parentLabel) {
                const labelText = parentLabel.innerText
                    .trim()
                    .replace(el.value || el.innerText || '', '')
                    .trim();
                if (labelText.toLowerCase() === lowerLabel) {
                    count++;
                }
            }
        }
        return count;
    }

    function countAltTextMatches(altText) {
        if (!altText) return 0;
        const elements = document.querySelectorAll('img[alt]');
        let count = 0;
        for (const el of elements) {
            if (!isElementVisible(el)) continue;
            if (el.getAttribute('alt') === altText) {
                count++;
            }
        }
        return count;
    }

    function countTitleMatches(title) {
        if (!title) return 0;
        const elements = document.querySelectorAll('[title]');
        let count = 0;
        for (const el of elements) {
            if (!isElementVisible(el)) continue;
            if (el.getAttribute('title') === title) {
                count++;
            }
        }
        return count;
    }

    function findStableContextChain(el) {
        if (!el) return [];
        const contextRoles = [
            'dialog',
            'form',
            'fieldset',
            'navigation',
            'main',
            'header',
            'footer',
            'section',
            'aside',
            'article',
            'table',
            'list',
        ];
        const chain = [];
        let current = el.parentElement;
        while (current && current !== document.body && chain.length < 3) {
            const role =
                current.getAttribute('role') ||
                IMPLICIT_ROLE_MAP[current.tagName] ||
                current.tagName.toLowerCase();
            if (contextRoles.includes(role)) {
                const contextName = getAccessibleName(current);
                chain.push({ role, name: contextName || null });
            }
            current = current.parentElement;
        }
        return chain;
    }

    function wrapWithContextChain(locator, contextChain) {
        if (!contextChain || contextChain.length === 0) return locator;
        let result = 'page';
        for (const ctx of contextChain) {
            if (ctx.name) {
                result += `.getByRole('${ctx.role}', { name: '${escapeSelectorValue(ctx.name)}' })`;
            } else {
                result += `.locator('[role="${ctx.role}"]')`;
            }
        }
        result += `.${locator}`;
        return result;
    }

    function getCardinalitySelector(el, baseSelector, matchFn) {
        const parent = el.parentElement;
        if (!parent) return null;

        const siblings = Array.from(parent.children).filter((child) => {
            try {
                return matchFn(child);
            } catch {
                return false;
            }
        });

        if (siblings.length <= 1) return null;

        const index = siblings.indexOf(el);
        if (index === -1) return null;

        const tag = el.tagName.toLowerCase();
        return `page.locator('${tag}').nth(${index})`;
    }

    function matchesRoleAndName(el, role, name) {
        if (!role || !name) return false;
        const elRole =
            el.getAttribute('role') || IMPLICIT_ROLE_MAP[el.tagName] || el.tagName.toLowerCase();
        if (elRole !== role) return false;
        const accessibleName = getAccessibleName(el);
        return accessibleName.toLowerCase() === name.toLowerCase();
    }

    function matchesLabel(el, label) {
        if (!label) return false;
        const lowerLabel = label.toLowerCase();
        const elId = el.getAttribute('id');
        if (elId) {
            try {
                const labelEl = document.querySelector(`label[for="${window.CSS.escape(elId)}"]`);
                if (labelEl && labelEl.innerText.trim().toLowerCase() === lowerLabel) {
                    return true;
                }
            } catch {
                /* label lookup failed — fall through */
            }
        }
        const parentLabel = el.closest?.('label');
        if (parentLabel) {
            const labelText = parentLabel.innerText
                .trim()
                .replace(el.value || el.innerText || '', '')
                .trim();
            if (labelText.toLowerCase() === lowerLabel) return true;
        }
        return false;
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
                ambiguous: result.ambiguous || false,
                locatorContext: result.context || null,
                contextChain: result.contextChain || null,
                cardinality: result.cardinality || false,
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

            const pickId = data.pickId || `${Date.now()}-${Math.random()}`;

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
