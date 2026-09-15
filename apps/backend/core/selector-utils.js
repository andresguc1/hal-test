// core/selector-utils.js - Selector & Locator Utilities
// Extracted from action.controller.js for reuse across plugins
// ==========================================================

function extractQuotedValue(str, prefixLength) {
    const content = str.slice(prefixLength, -1);
    return content.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"');
}

function extractOptionsAfterFirstArg(content, endIndex) {
    let after = content.slice(endIndex + 1).trim();
    if (after.startsWith(',')) {
        after = after.slice(1).trim();
    }
    let options = {};
    if (after.startsWith('{')) {
        options = parseOptionsObject(after.slice(1, -1));
    }
    return options;
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

const SAFE_TARGET_OPTION_KEYS = [
    'name',
    'exact',
    'level',
    'checked',
    'expanded',
    'pressed',
    'selected',
    'disabled',
    'includeHidden',
];

function parseOptionsObject(content) {
    const options = {};
    let i = 0;
    while (i < content.length) {
        if (content[i] === '}' || content[i] === ',') {
            i++;
            continue;
        }
        let key = '';
        while (
            i < content.length &&
            content[i] !== ':' &&
            content[i] !== '}' &&
            content[i] !== ','
        ) {
            key += content[i++];
        }
        key = key.trim();
        if (i >= content.length || content[i] !== ':') break;
        i++;
        while (i < content.length && content[i] === ' ') i++;
        let value = '';
        if (content[i] === "'" || content[i] === '"') {
            const quote = content[i++];
            while (i < content.length && content[i] !== quote) {
                if (content[i] === '\\' && i + 1 < content.length) {
                    value += content[i + 1];
                    i += 2;
                } else {
                    value += content[i++];
                }
            }
            i++;
        } else if (content[i] === 't' && content.startsWith('true', i)) {
            value = true;
            i += 4;
        } else if (content[i] === 'f' && content.startsWith('false', i)) {
            value = false;
            i += 5;
        } else {
            while (i < content.length && content[i] !== ',' && content[i] !== '}') {
                value += content[i++];
            }
            value = value.trim();
            if (!isNaN(value) && value !== '') value = Number(value);
        }
        if (key && SAFE_TARGET_OPTION_KEYS.includes(key)) {
            options[key] = value;
        }
        i++;
    }
    return options;
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
                const content = call.slice(method.length + 1, -1);
                const firstQuote = content[0];
                if (firstQuote === "'" || firstQuote === '"') {
                    let text = '';
                    let j = 1;
                    while (j < content.length) {
                        if (content[j] === '\\' && j + 1 < content.length) {
                            text += content[j + 1];
                            j += 2;
                        } else if (content[j] === firstQuote) {
                            break;
                        } else {
                            text += content[j];
                            j++;
                        }
                    }
                    const options = extractOptionsAfterFirstArg(content, j);
                    const callWithOptions = Object.keys(options).length > 0;
                    locator = locator
                        ? callWithOptions
                            ? locator.getByText(text, options)
                            : locator.getByText(text)
                        : callWithOptions
                          ? page.getByText(text, options)
                          : page.getByText(text);
                }
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
                    const options = extractOptionsAfterFirstArg(content, j);
                    const callWithOptions = Object.keys(options).length > 0;
                    locator = locator
                        ? callWithOptions
                            ? locator.getByRole(role, options)
                            : locator.getByRole(role)
                        : callWithOptions
                          ? page.getByRole(role, options)
                          : page.getByRole(role);
                }
                break;
            }
            case 'locator': {
                const value = extractQuotedValue(call, method.length + 1);
                locator = locator ? locator.locator(value) : page.locator(value);
                break;
            }
            case 'filter': {
                const content = call.slice(method.length + 1, -1).trim();
                let filterOptions = {};
                if (content.startsWith('{')) {
                    filterOptions = parseOptionsObject(content.slice(1, -1));
                    const mapped = {};
                    if (filterOptions.hasText) mapped.hasText = filterOptions.hasText;
                    if (filterOptions.has) mapped.has = filterOptions.has;
                    if (filterOptions.hasNot) mapped.hasNot = filterOptions.hasNot;
                    filterOptions = Object.keys(mapped).length ? mapped : { hasText: content };
                } else {
                    filterOptions = { hasText: content };
                }
                locator = locator.filter(filterOptions);
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
        const content = trimmed.slice(10, -1);
        const firstQuote = content[0];
        if (firstQuote === "'" || firstQuote === '"') {
            let text = '';
            let j = 1;
            while (j < content.length) {
                if (content[j] === '\\' && j + 1 < content.length) {
                    text += content[j + 1];
                    j += 2;
                } else if (content[j] === firstQuote) {
                    break;
                } else {
                    text += content[j];
                    j++;
                }
            }
            const options = extractOptionsAfterFirstArg(content, j);
            return Object.keys(options).length > 0
                ? page.getByText(text, options)
                : page.getByText(text);
        }
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

            const options = extractOptionsAfterFirstArg(content, i);
            return Object.keys(options).length > 0
                ? page.getByRole(role, options)
                : page.getByRole(role);
        }
        throw new Error(
            `Invalid getByRole format: "${selector}". Use getByRole('button', { name: 'Submit' })`,
        );
    }

    if (/^\/\//.test(trimmed) || /^\.\.\//.test(trimmed) || /^\(?\/\//.test(trimmed)) {
        return page.locator(`xpath=${trimmed}`);
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

const PICKER_CANDIDATE_ORDER = [
    'playwrightTestId',
    'playwrightRole',
    'playwrightLabel',
    'playwrightPlaceholder',
    'playwrightAltText',
    'playwrightTitle',
    'playwrightText',
    'testId',
    'id',
    'name',
    'aria',
    'text',
    'cssPath',
    'xpath',
];

function deduplicateCandidates(primary, candidates) {
    const seen = new Set();
    const ordered = [];
    if (primary && typeof primary === 'string' && primary.trim()) {
        ordered.push(primary.trim());
        seen.add(primary.trim());
    }
    if (candidates && typeof candidates === 'object') {
        for (const key of PICKER_CANDIDATE_ORDER) {
            const val = candidates[key];
            if (val && typeof val === 'string' && val.trim() && !seen.has(val.trim())) {
                ordered.push(val.trim());
                seen.add(val.trim());
            }
        }
    }
    return ordered;
}

function isValidSelectorString(sel) {
    return typeof sel === 'string' && sel.trim().length > 0;
}

async function probeAttached(page, selector, probeTimeoutMs) {
    try {
        const locator = buildPlaywrightLocator(page, selector);
        await locator.waitFor({ state: 'attached', timeout: probeTimeoutMs });
        return { locator, error: null };
    } catch (err) {
        return { locator: null, error: err.message };
    }
}

async function resolveTarget({ page, target, scope, timeout = 30000 }) {
    if (scope === 'page') {
        return {
            locator: page.locator('body'),
            usedSelector: 'body',
            selectorType: 'page',
            resolution: 'page',
            candidatesTried: [],
            errors: [],
        };
    }

    const primary = target?.selector;
    const candidates = target?.candidates;
    const selectorType = target?.selectorType || 'unknown';

    if (!isValidSelectorString(primary)) {
        return {
            locator: null,
            usedSelector: null,
            selectorType,
            resolution: 'none',
            candidatesTried: [],
            errors: ['No valid primary selector provided'],
        };
    }

    const orderedCandidates = deduplicateCandidates(primary, candidates);

    if (orderedCandidates.length <= 1) {
        const normalized = await normalizeSelectorForDotId(page, primary);
        const locator = buildPlaywrightLocator(page, normalized);
        return {
            locator,
            usedSelector: primary,
            selectorType,
            resolution: 'primary',
            candidatesTried: [{ selector: primary, status: 'used' }],
            errors: [],
        };
    }

    const probeMs = Math.min(1500, timeout || 30000);
    const candidatesTried = [];
    const errors = [];

    for (const candidate of orderedCandidates) {
        const { locator, error } = await probeAttached(page, candidate, probeMs);
        if (locator) {
            candidatesTried.push({ selector: candidate, status: 'attached' });
            return {
                locator,
                usedSelector: candidate,
                selectorType:
                    PICKER_CANDIDATE_ORDER.find((k) => candidates?.[k] === candidate) || 'fallback',
                resolution: candidate === primary ? 'primary' : 'fallback',
                candidatesTried,
                errors,
            };
        }
        candidatesTried.push({ selector: candidate, status: 'not-attached', error });
        if (error) errors.push(`${candidate}: ${error}`);
    }

    const normalized = await normalizeSelectorForDotId(page, primary);
    const locator = buildPlaywrightLocator(page, normalized);
    candidatesTried.push({ selector: primary, status: 'used-as-last-resort' });
    return {
        locator,
        usedSelector: primary,
        selectorType,
        resolution: 'none',
        candidatesTried,
        errors,
    };
}

const SELECTOR_FIELDS_BY_ACTION = {
    click: ['selector'],
    type_text: ['selector'],
    fill_form: ['formSelector', 'submitSelector'],
    find_element: ['selector'],
    wait_visible: ['selector'],
    select_option: ['selector', 'containerSelector'],
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
    PICKER_CANDIDATE_ORDER,
    resolveTarget,
};
