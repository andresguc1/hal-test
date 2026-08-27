// core/selector-utils.js - Selector & Locator Utilities
// Extracted from action.controller.js for reuse across plugins
// ==========================================================

function extractQuotedValue(str, prefixLength) {
    const content = str.slice(prefixLength, -1);
    return content.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
}

function splitLocatorChain(selector) {
    const trimmed = selector.trim();
    if (!trimmed.startsWith('page.')) return null;

    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;

    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];

        if (inQuotes) {
            current += char;
            if (char === quoteChar && (i === 0 || trimmed[i - 1] !== '\\')) {
                inQuotes = false;
            }
        } else if (char === "'" || char === '"') {
            inQuotes = true;
            quoteChar = char;
            current += char;
        } else if (char === '.') {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    if (current) parts.push(current);
    return parts.length > 1 ? parts : null;
}

function buildChainedLocator(page, selector) {
    const parts = splitLocatorChain(selector);
    if (!parts || parts.length < 2) return page.locator(selector);

    let locator = null;

    for (let i = 1; i < parts.length; i++) {
        const call = parts[i];
        const method = call.split('(')[0];

        switch (method) {
            case 'getByTestId': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator ? locator.getByTestId(value) : page.getByTestId(value);
                break;
            }
            case 'getByPlaceholder': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator ? locator.getByPlaceholder(value) : page.getByPlaceholder(value);
                break;
            }
            case 'getByLabel': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator ? locator.getByLabel(value) : page.getByLabel(value);
                break;
            }
            case 'getByAltText': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator ? locator.getByAltText(value) : page.getByAltText(value);
                break;
            }
            case 'getByTitle': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator ? locator.getByTitle(value) : page.getByTitle(value);
                break;
            }
            case 'getByText': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator ? locator.getByText(value) : page.getByText(value);
                break;
            }
            case 'getByRole': {
                const content = call.slice(method.length + 1, -1);
                const firstQuote = content[0];
                if (firstQuote === "'" || firstQuote === '"') {
                    let role = '';
                    let j = 1;
                    while (j < content.length) {
                        if (content[j] === '\\' && j + 1 < content.length) {
                            role += content[j + 1];
                            j += 2;
                        } else if (content[j] === firstQuote) {
                            break;
                        } else {
                            role += content[j];
                            j++;
                        }
                    }
                    const afterRole = content.slice(j + 1);
                    const nameIndex = afterRole.indexOf('name:');
                    if (nameIndex !== -1) {
                        const afterName = afterRole.slice(nameIndex + 5).trim();
                        const nameQuote = afterName[0];
                        if (nameQuote === "'" || nameQuote === '"') {
                            let name = '';
                            let k = 1;
                            while (k < afterName.length) {
                                if (afterName[k] === '\\' && k + 1 < afterName.length) {
                                    name += afterName[k + 1];
                                    k += 2;
                                } else if (afterName[k] === nameQuote) {
                                    break;
                                } else {
                                    name += afterName[k];
                                    k++;
                                }
                            }
                            locator = locator
                                ? locator.getByRole(role, { name })
                                : page.getByRole(role, { name });
                        } else {
                            locator = locator ? locator.getByRole(role) : page.getByRole(role);
                        }
                    } else {
                        locator = locator ? locator.getByRole(role) : page.getByRole(role);
                    }
                }
                break;
            }
            case 'locator': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator ? locator.locator(value) : page.locator(value);
                break;
            }
            case 'filter': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator.filter({ hasText: value });
                break;
            }
            case 'nth': {
                const content = call.slice(method.length + 1, -1).trim();
                const index = parseInt(content, 10);
                locator = locator.nth(index);
                break;
            }
            case 'first': {
                locator = locator.first();
                break;
            }
            case 'last': {
                locator = locator.last();
                break;
            }
            default:
                return page.locator(selector);
        }
    }

    return locator;
}

function buildPlaywrightLocator(page, selector) {
    if (!selector || typeof selector !== 'string') return page.locator(selector);

    const trimmed = selector.trim();

    if (trimmed.startsWith('page.')) {
        return buildChainedLocator(page, trimmed);
    }

    if (/^getByTestId\(/i.test(trimmed)) {
        return page.getByTestId(extractQuotedValue(trimmed, 12));
    }

    if (/^getByPlaceholder\(/i.test(trimmed)) {
        return page.getByPlaceholder(extractQuotedValue(trimmed, 17));
    }

    if (/^getByLabel\(/i.test(trimmed)) {
        return page.getByLabel(extractQuotedValue(trimmed, 11));
    }

    if (/^getByAltText\(/i.test(trimmed)) {
        return page.getByAltText(extractQuotedValue(trimmed, 13));
    }

    if (/^getByTitle\(/i.test(trimmed)) {
        return page.getByTitle(extractQuotedValue(trimmed, 11));
    }

    if (/^getByText\(/i.test(trimmed)) {
        return page.getByText(extractQuotedValue(trimmed, 10));
    }

    if (/^getByRole\(/i.test(trimmed)) {
        const content = trimmed.slice(10, -1);
        const firstQuote = content[0];
        if (firstQuote === "'" || firstQuote === '"') {
            let role = '';
            let i = 1;
            while (i < content.length) {
                if (content[i] === '\\' && i + 1 < content.length) {
                    role += content[i + 1];
                    i += 2;
                } else if (content[i] === firstQuote) {
                    break;
                } else {
                    role += content[i];
                    i++;
                }
            }

            const afterRole = content.slice(i + 1);
            const nameIndex = afterRole.indexOf('name:');
            if (nameIndex !== -1) {
                const afterName = afterRole.slice(nameIndex + 5).trim();
                const nameQuote = afterName[0];
                if (nameQuote === "'" || nameQuote === '"') {
                    let name = '';
                    let j = 1;
                    while (j < afterName.length) {
                        if (afterName[j] === '\\' && j + 1 < afterName.length) {
                            name += afterName[j + 1];
                            j += 2;
                        } else if (afterName[j] === nameQuote) {
                            break;
                        } else {
                            name += afterName[j];
                            j++;
                        }
                    }
                    return page.getByRole(role, { name });
                }
            }
            return page.getByRole(role);
        }
        throw new Error(
            `Invalid getByRole format: "${selector}". Use getByRole('button', { name: 'Submit' })`,
        );
    }

    return page.locator(selector);
}

function convertPlaywrightLocator(selector) {
    if (!selector || typeof selector !== 'string') return selector;

    const trimmed = selector.trim();

    if (
        /^getByTestId\(/i.test(trimmed) ||
        /^getByPlaceholder\(/i.test(trimmed) ||
        /^getByLabel\(/i.test(trimmed) ||
        /^getByAltText\(/i.test(trimmed) ||
        /^getByTitle\(/i.test(trimmed) ||
        /^getByText\(/i.test(trimmed) ||
        /^getByRole\(/i.test(trimmed)
    ) {
        return selector;
    }

    return selector;
}

async function normalizeSelectorForDotId(page, selector) {
    if (!selector || typeof selector !== 'string') return selector;

    const converted = convertPlaywrightLocator(selector);

    if (!converted.startsWith('#') || !converted.includes('.')) return converted;

    const idValue = converted.slice(1);
    const attributeSelector = `[id="${idValue.replace(/"/g, '\\"')}"]`;
    let originalCount = 0;
    try {
        originalCount = await page.locator(converted).count();
    } catch (err) {
        originalCount = 0;
    }

    if (originalCount > 0) return converted;

    let fallbackCount = 0;
    try {
        fallbackCount = await page.locator(attributeSelector).count();
    } catch (err) {
        fallbackCount = 0;
    }

    if (fallbackCount > 0) {
        console.warn(`[SelectorUtils] Selector fallback from ${converted} to ${attributeSelector}`);
        return attributeSelector;
    }

    return converted;
}

const SELECTOR_FIELDS_BY_ACTION = {
    click: ['selector'],
    type_text: ['selector'],
    fill_form: ['formSelector', 'submitSelector'],
    find_element: ['selector'],
    wait_visible: ['selector'],
    select_option: ['selector'],
    hover: ['selector'],
    scroll: ['selector'],
    drag_drop: ['sourceSelector', 'targetSelector'],
    upload_file: ['selector'],
    take_screenshot: ['selector'],
    extract_text: ['selector'],
    get_set_content: ['selector'],
    wait_for_element: ['selector'],
    save_dom: ['selector'],
};

function resolveSelectors(opts, actionName) {
    const fields = SELECTOR_FIELDS_BY_ACTION[actionName] || [];
    if (fields.length === 0) return opts;

    const resolved = { ...opts };
    for (const field of fields) {
        if (resolved[field]) {
            resolved[field] = convertPlaywrightLocator(resolved[field]);
        }
    }

    if (actionName === 'fill_form' && resolved.fields && Array.isArray(resolved.fields)) {
        resolved.fields = resolved.fields.map((field) => ({
            ...field,
            selector: convertPlaywrightLocator(field.selector),
        }));
    }

    return resolved;
}

export {
    extractQuotedValue,
    splitLocatorChain,
    buildChainedLocator,
    buildPlaywrightLocator,
    convertPlaywrightLocator,
    normalizeSelectorForDotId,
    SELECTOR_FIELDS_BY_ACTION,
    resolveSelectors,
};
