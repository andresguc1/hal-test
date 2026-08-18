/**
 * Selector and string escaping utilities for code generation.
 * Prevents code injection and broken output from user-provided values.
 */

/**
 * Escapes a string for use inside a JavaScript/TypeScript template literal (backtick).
 * @param {string} str
 * @returns {string}
 */
export function escapeForTemplateLiteral(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

/**
 * Escapes a string for use inside double quotes (Python, Java, C#, etc).
 * @param {string} str
 * @returns {string}
 */
export function escapeForDoubleQuotes(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Escapes a string for use inside single quotes (Cypress, some JS contexts).
 * @param {string} str
 * @returns {string}
 */
export function escapeForSingleQuotes(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Returns the appropriate escaper for the given quote context.
 * @param {'backtick' | 'double' | 'single'} context
 * @returns {(str: string) => string}
 */
export function getEscaper(context) {
    switch (context) {
        case 'backtick':
            return escapeForTemplateLiteral;
        case 'double':
            return escapeForDoubleQuotes;
        case 'single':
            return escapeForSingleQuotes;
        default:
            return escapeForTemplateLiteral;
    }
}

/**
 * Validates a selector string and returns warnings if it looks suspicious.
 * @param {string} selector - The selector to validate
 * @param {string} framework - Target framework ('playwright', 'cypress', 'selenium')
 * @param {string} nodeLabel - Label of the node for warning messages
 * @returns {{ valid: boolean, warnings: string[] }}
 */
export function validateSelector(selector, framework, nodeLabel) {
    const warnings = [];
    if (!selector || typeof selector !== 'string') {
        return { valid: true, warnings };
    }

    const trimmed = selector.trim();
    if (!trimmed) return { valid: true, warnings };

    // Check for empty/whitespace-only selectors
    if (trimmed.length === 0) {
        warnings.push(`Node "${nodeLabel}": Selector is empty`);
        return { valid: false, warnings };
    }

    // Playwright-specific: validate chained locator syntax
    if (framework === 'playwright') {
        // Check for page.getByX() without closing parens
        if (/^page\./.test(trimmed)) {
            const openParens = (trimmed.match(/\(/g) || []).length;
            const closeParens = (trimmed.match(/\)/g) || []).length;
            if (openParens !== closeParens) {
                warnings.push(`Node "${nodeLabel}": Unbalanced parentheses in Playwright locator`);
                return { valid: false, warnings };
            }
        }
    }

    // Check for common mistakes: using CSS selectors with Playwright getByX
    if (/^page\.getBy/.test(trimmed) && /[{}]/.test(trimmed)) {
        warnings.push(
            `Node "${nodeLabel}": Suspicious braces in Playwright locator — did you mean CSS selector?`,
        );
    }

    // Check for obviously broken selectors
    if (trimmed.startsWith('.') && !trimmed.startsWith('. ') && trimmed.length < 2) {
        warnings.push(`Node "${nodeLabel}": Selector looks incomplete (just ".")`);
        return { valid: false, warnings };
    }

    return { valid: true, warnings };
}
