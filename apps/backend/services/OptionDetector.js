/**
 * OptionDetector
 *
 * Detects selectable "options" inside a given container element in the active
 * page. Supports native <select>, checkbox groups, radio groups, lists, ARIA
 * roles (listbox/option/checkbox/radio/menuitem...) and custom UI components.
 *
 * The heavy lifting runs inside the browser via page.evaluate with a fully
 * self-contained script so it works on any page without external dependencies.
 */
/* global window, document, Element, Node, CSS */

// Self-contained script injected + executed inside the page context. It is a
// single function (no factory) so that Playwright serializes it with its own
// helpers in scope. It receives the container selector and returns a normalized
// list of options.
function detectOptionsScript(containerSelector) {
    // Fully self-contained: all helpers and constants live inside this function
    // so Playwright serializes them along with the callback.
    const IMPLICIT_ROLE_MAP = {
        BUTTON: 'button',
        A: 'link',
        INPUT: 'textbox',
        SELECT: 'combobox',
        TEXTAREA: 'textbox',
    };

    function getText(el) {
        if (!el) return '';
        return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    }

    function getAccessibleName(el) {
        if (!(el instanceof Element)) return '';
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

        const labelledBy = el.getAttribute('aria-labelledby');
        if (labelledBy) {
            const parts = labelledBy.split(/\s+/);
            const text = parts
                .map((id) => {
                    const node = document.getElementById(id);
                    return node ? getText(node) : '';
                })
                .filter(Boolean)
                .join(' ');
            if (text) return text;
        }

        const role = el.getAttribute('role') || IMPLICIT_ROLE_MAP[el.tagName] || '';
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
                'option',
            ].includes(role) ||
            el.tagName === 'LABEL'
        ) {
            const text = getText(el);
            if (text) return text;
        }

        const title = el.getAttribute('title');
        if (title) return title.trim();

        const placeholder = el.getAttribute('placeholder');
        if (placeholder) return placeholder.trim();

        return '';
    }

    function isElementVisible(el) {
        if (!(el instanceof Element)) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 && rect.height <= 0) return false;
        if (el.hasAttribute('hidden')) return false;
        if (el.getAttribute('aria-hidden') === 'true') return false;
        const style = window.getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') return false;
        if (Number(style.opacity) === 0) return false;
        return true;
    }

    function isDynamicId(id) {
        return !id || /([0-9]{3,})/.test(id) || /([a-f0-9]{8}-[a-f0-9]{4})/.test(id);
    }

    function escapeSelectorValue(value) {
        if (value == null) return '';
        return String(value).replace(/'/g, "\\'");
    }

    function getCssPath(el) {
        if (!(el instanceof Element)) return '';
        const path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id && !isDynamicId(el.id)) {
                selector += '#' + CSS.escape(el.id);
                path.unshift(selector);
                break;
            }
            let sib = el;
            let nth = 1;
            while ((sib = sib.previousElementSibling)) {
                if (sib.nodeName.toLowerCase() === selector) nth++;
            }
            if (nth !== 1) selector += ':nth-of-type(' + nth + ')';
            path.unshift(selector);
            el = el.parentNode;
        }
        return path.join(' > ');
    }

    // Build the best possible Playwright locator for an option element.
    // Returns a string Playwright supports (getByRole / getByLabel / getByText /
    // data-testid / CSS path / '' = use container-relative index fallback).
    function buildLocator(el) {
        const testIdAttrs = ['data-testid', 'data-test-id', 'data-test', 'data-cy'];
        for (const attr of testIdAttrs) {
            if (el.hasAttribute(attr)) {
                return `[${attr}="${el.getAttribute(attr)}"]`;
            }
        }

        if (el.id && !isDynamicId(el.id)) {
            return `#${CSS.escape(el.id)}`;
        }

        const role = el.getAttribute('role') || IMPLICIT_ROLE_MAP[el.tagName] || '';
        let name = getAccessibleName(el);
        if (
            role &&
            name &&
            ['option', 'checkbox', 'radio', 'listitem', 'menuitem'].includes(role)
        ) {
            return `getByRole('${role}', { name: '${escapeSelectorValue(name)}' })`;
        }

        // Checkbox/radio -> label, but only when it comes from a real <label>
        // association (label[for] or wrapping <label>). `getByLabel` would fail
        // for "bare" inputs whose text comes from adjacent text, so those return
        // '' to let the writer use a container-relative index fallback.
        if (el.tagName === 'INPUT' && ['checkbox', 'radio'].includes(el.type)) {
            const elId = el.getAttribute('id');
            let labelText = '';
            if (elId) {
                const label = document.querySelector(`label[for="${CSS.escape(elId)}"]`);
                if (label) labelText = getText(label);
            }
            if (!labelText) {
                const parentLabel = el.closest('label');
                if (parentLabel) labelText = getText(parentLabel);
            }
            if (labelText) return `getByLabel('${escapeSelectorValue(labelText)}')`;
            return '';
        }

        name = name || getText(el);
        if (name) {
            return `getByText('${escapeSelectorValue(name)}')`;
        }

        return getCssPath(el);
    }

    function makeOption(el, base) {
        const selected = Boolean(base.selected);
        const checked = Boolean(base.checked);
        const enabled = !el.disabled && el.getAttribute('aria-disabled') !== 'true';
        const visible = isElementVisible(el);
        return {
            id: base.id || `${base.type}-${el.__hookIndex}`,
            label: base.label || getAccessibleName(el) || getText(el),
            value: base.value,
            type: base.type,
            locator: buildLocator(el),
            index: base.index,
            selected,
            checked,
            enabled,
            visible,
            actualState: {
                checked,
                selected,
                enabled,
                visible,
            },
            multiple: Boolean(base.multiple),
        };
    }

    function detectGroupType(els, opts) {
        // Derive the group type from the detected options when available.
        if (opts && opts.length > 0) {
            const first = opts[0];
            const t = first.type;
            if (t === 'select') return first.multi === true ? 'select-multi' : 'select';
            if (t === 'radio') return 'radio-group';
            if (t === 'checkbox') return 'checkbox-group';
            return 'list';
        }
        if (els.length === 0) return 'unknown';
        const first = els[0];
        if (first.tagName === 'SELECT') {
            return first.multiple ? 'select-multi' : 'select';
        }
        const t = first.type;
        if (t === 'radio') return 'radio-group';
        if (t === 'checkbox') return 'checkbox-group';
        if (first.getAttribute('role') === 'listbox' || first.getAttribute('role') === 'list') {
            return 'listbox';
        }
        return 'list';
    }

    // Reads the text node(s) that follow a control up to the next element
    // (<br> or sibling) in the same parent. Works for rows like
    // `<input type="checkbox"> Option 1<br>` with no <label>.
    function getAdjacentText(el) {
        try {
            const parent = el.parentNode;
            if (!parent) return '';
            let text = '';
            let node = el.nextSibling;
            while (node) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.nodeName === 'BR') break;
                    text += getText(node);
                    break;
                }
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.nodeValue;
                }
                node = node.nextSibling;
            }
            return text.replace(/\s+/g, ' ').trim();
        } catch (err) {
            return '';
        }
    }

    // Resolve the accessible label for a form control.
    function resolveControlLabel(el) {
        let label = getAccessibleName(el);
        if (!label) {
            const elId = el.getAttribute('id');
            if (elId) {
                const labelEl = document.querySelector(`label[for="${CSS.escape(elId)}"]`);
                if (labelEl) label = getText(labelEl);
            }
        }
        if (!label) {
            const parentLabel = el.closest('label');
            if (parentLabel) label = getText(parentLabel);
        }
        // Try to find label text within same li / row
        if (!label) {
            const row = el.closest('li, .option, [data-option]');
            if (row) label = getText(row);
        }
        // Fallback for "bare" controls (e.g. <input type="checkbox"> checkbox 1<br>)
        if (!label) {
            label = getAdjacentText(el);
        }
        return label;
    }

    // Main detection body -------------------------------------------------
    const containers = [];
    const container = document.querySelector(containerSelector);
    if (container) containers.push(container);
    if (containers.length === 0) {
        document.querySelectorAll(containerSelector).forEach((c) => containers.push(c));
    }
    if (containers.length === 0) {
        return { found: false, groupType: 'not-found', options: [] };
    }

    const options = [];
    const indexCounter = {};

    containers.forEach((containerEl) => {
        // pushControlOption: emit an option (or a set, for <select>) for a control.
        const pushControlOption = (el, type) => {
            const key = type;
            indexCounter[key] = indexCounter[key] || 0;
            const i = indexCounter[key]++;

            if (type === 'select') {
                const opts = Array.from(el.querySelectorAll('option'));
                if (opts.length === 0) {
                    options.push(
                        makeOption(el, {
                            id: `select-${i}`,
                            label: resolveControlLabel(el),
                            value: el.value,
                            type: 'select',
                            index: i,
                            selected: el.selected,
                            checked: el.selected,
                            multiple: el.multiple,
                        }),
                    );
                    return;
                }
                opts.forEach((opt, j) => {
                    options.push(
                        makeOption(opt, {
                            id: `select-${i}-option-${j}`,
                            label: getText(opt),
                            value: opt.value,
                            type: 'select',
                            index: j,
                            selected: opt.selected,
                            checked: opt.selected,
                            multiple: el.multiple,
                        }),
                    );
                });
                return;
            }

            const label = resolveControlLabel(el);
            options.push(
                makeOption(el, {
                    id: `${type}-${i}`,
                    label: label || el.value || el.name || '',
                    value: el.value,
                    type,
                    index: i,
                    selected: el.checked,
                    checked: el.checked,
                }),
            );
        };

        // CASE 1: container is a <select>
        if (containerEl.tagName === 'SELECT') {
            const opts = Array.from(containerEl.querySelectorAll('option'));
            opts.forEach((el, i) => {
                options.push(
                    makeOption(el, {
                        id: `option-${i}`,
                        label: getText(el) || el.getAttribute('label') || '',
                        value: el.value,
                        type: 'select',
                        index: i,
                        selected: el.selected,
                        checked: el.selected,
                        multiple: containerEl.multiple,
                    }),
                );
            });
            return;
        }

        // CASE 0: container resolves to a selectable control itself (e.g. the
        // element picker returned `form > input`). Widen to the nearest grouping
        // parent so all sibling controls of the same kind are detected.
        if (
            containerEl.matches('input[type="checkbox"], input[type="radio"], select') &&
            isElementVisible(containerEl)
        ) {
            const selfType =
                containerEl.type === 'radio'
                    ? 'radio'
                    : containerEl.type === 'checkbox'
                      ? 'checkbox'
                      : 'select';

            const groupHost =
                containerEl.closest(
                    'form, fieldset, [role="group"], [role="radiogroup"], [role="checkboxgroup"], [role="listbox"]',
                ) || containerEl.parentElement;

            if (selfType === 'select') {
                pushControlOption(containerEl, 'select');
            } else if (groupHost) {
                const scope = groupHost === containerEl ? containerEl : groupHost;
                Array.from(scope.querySelectorAll(`input[type="${selfType}"]`))
                    .filter(isElementVisible)
                    .forEach((el) => pushControlOption(el, selfType));
            } else {
                pushControlOption(containerEl, selfType);
            }
        }

        // CASE 2: direct selectable form controls inside the container
        const directControls = Array.from(
            containerEl.querySelectorAll('input[type="checkbox"], input[type="radio"], select'),
        ).filter(isElementVisible);

        directControls.forEach((el) => {
            const type =
                el.type === 'radio' ? 'radio' : el.type === 'checkbox' ? 'checkbox' : 'select';
            pushControlOption(el, type);
        });

        // CASE 3: ARIA-based listbox / role=option / role=checkbox / role=radio
        const roleCandidates = Array.from(
            containerEl.querySelectorAll(
                '[role="option"], [role="checkbox"], [role="radio"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="listbox"] > [role="option"]',
            ),
        ).filter(isElementVisible);

        roleCandidates.forEach((el) => {
            const role = el.getAttribute('role');
            let type;
            if (role === 'checkbox' || role === 'menuitemcheckbox') type = 'checkbox';
            else if (role === 'radio' || role === 'menuitemradio') type = 'radio';
            else type = 'list';

            const ariaChecked = el.getAttribute('aria-checked');
            const ariaSelected = el.getAttribute('aria-selected');
            const isSelected =
                ariaChecked === 'true' ||
                ariaSelected === 'true' ||
                el.classList.contains('selected') ||
                el.classList.contains('active') ||
                el.classList.contains('is-selected');

            indexCounter[type] = indexCounter[type] || 0;
            const i = indexCounter[type]++;

            options.push(
                makeOption(el, {
                    id: `${type}-${i}`,
                    label: getAccessibleName(el) || getText(el),
                    value: el.getAttribute('data-value') || el.getAttribute('value') || getText(el),
                    type,
                    index: i,
                    selected: isSelected,
                    checked: isSelected,
                }),
            );
        });

        // CASE 4: list items (ul/ol > li) with option-like content
        const listItems = Array.from(
            containerEl.querySelectorAll(
                'ul li, ol li, div[data-option], .option-item, [data-role="option"]',
            ),
        ).filter(isElementVisible);

        listItems.forEach((el) => {
            const role = el.getAttribute('role');
            if (['option', 'checkbox', 'radio'].includes(role)) return;

            const innerCheckbox = el.querySelector('input[type="checkbox"], input[type="radio"]');
            if (innerCheckbox) {
                // Already captured in CASE 2; avoid duplicates.
                return;
            }

            indexCounter.list = indexCounter.list || 0;
            const i = indexCounter.list++;

            options.push(
                makeOption(el, {
                    id: `list-${i}`,
                    label: getAccessibleName(el) || getText(el),
                    value: el.getAttribute('data-value') || getText(el),
                    type: 'list',
                    index: i,
                    selected: el.classList.contains('selected') || el.classList.contains('active'),
                    checked: el.classList.contains('selected') || el.classList.contains('active'),
                }),
            );
        });
    });

    // De-dup by locator (keep the first occurrence). Empty locators (bare
    // controls resolved by index) must NOT be de-duplicated.
    const seen = new Set();
    const unique = options.filter((o) => {
        if (!o.locator) return true;
        if (seen.has(o.locator)) return false;
        seen.add(o.locator);
        return true;
    });

    return {
        found: true,
        groupType: detectGroupType(containers, unique),
        options: unique,
    };
}

export async function detectOptions(page, containerSelector, _options = {}) {
    if (!page || page.isClosed()) {
        throw new Error('No active page available to detect options.');
    }
    if (!containerSelector || typeof containerSelector !== 'string') {
        throw new Error('Container selector is required.');
    }

    let result;
    try {
        result = await page.evaluate(detectOptionsScript, containerSelector);
    } catch (err) {
        throw new Error(`Failed to detect options: ${err.message}`);
    }

    if (!result || !result.found) {
        return {
            found: false,
            groupType: 'not-found',
            options: [],
            message: `No options found inside "${containerSelector}". Check the container or ensure it exposes selectable controls.`,
        };
    }

    // Provide stable ids in case the page script could not
    result.options = (result.options || []).map((opt, idx) => {
        const checked = opt.checked === true || opt.selected === true;
        return {
            ...opt,
            id: opt.id || `option-${idx}`,
            label: opt.label || `Option ${idx + 1}`,
            type: opt.type || 'list',
            enabled: opt.enabled !== false,
            actualState: opt.actualState || {
                checked,
                selected: checked,
                enabled: opt.enabled !== false,
                visible: opt.visible !== false,
            },
        };
    });

    return { found: true, groupType: result.groupType, options: result.options };
}

export { detectOptionsScript };
export default { detectOptions };
