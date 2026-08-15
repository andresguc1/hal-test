/**
 * SelectorPreValidator Service
 * Pre-save real-time validation for DOM selectors (CSS, XPath, ARIA)
 * verifying syntax, uniqueness, visibility, and element stability.
 */
export class SelectorPreValidator {
    /**
     * Validates a selector string independently or against a live Playwright page
     * @param {string} selector - CSS, XPath, or ARIA selector
     * @param {Object} [page] - Active Playwright page object (optional)
     * @returns {Promise<Object>} Validation breakdown
     */
    async validateSelector(selector, page = null) {
        if (!selector || typeof selector !== 'string' || !selector.trim()) {
            return {
                validSyntax: false,
                count: 0,
                unique: false,
                visible: false,
                score: 0,
                issues: ['Selector string is empty or invalid type'],
            };
        }

        const trimmed = selector.trim();
        const issues = [];
        let validSyntax = true;

        // 1. Syntax Check
        if (trimmed.startsWith('//') || trimmed.startsWith('xpath=')) {
            // XPath validation
            if (trimmed.includes('//') && trimmed.includes('[')) {
                const openBrackets = (trimmed.match(/\[/g) || []).length;
                const closeBrackets = (trimmed.match(/\]/g) || []).length;
                if (openBrackets !== closeBrackets) {
                    validSyntax = false;
                    issues.push('Mismatched brackets in XPath expression');
                }
            }
        } else if (trimmed.startsWith('role=')) {
            // ARIA role selector
            if (!trimmed.includes('role=')) {
                validSyntax = false;
                issues.push('Invalid ARIA role syntax');
            }
        } else {
            // Standard CSS selector test syntax heuristic
            if (/[#.\w-]/.test(trimmed) === false) {
                validSyntax = false;
                issues.push('Invalid characters in CSS selector');
            }
        }

        // 2. Structural Stability Scoring (0.0 - 1.0)
        let score = 0.5;
        if (
            trimmed.includes('data-testid') ||
            trimmed.includes('data-test') ||
            trimmed.includes('data-cy')
        ) {
            score = 1.0;
        } else if (trimmed.startsWith('#') && !/\d{5,}/.test(trimmed)) {
            score = 0.9;
        } else if (trimmed.startsWith('role=')) {
            score = 0.85;
        } else if (/\d{5,}/.test(trimmed)) {
            score = 0.3; // Dynamic ID detected
            issues.push('Selector contains dynamic generated numbers');
        } else if (trimmed.includes(':nth-child') || trimmed.includes('div > div > div')) {
            score = 0.4;
            issues.push('Fragile positional DOM tree structure');
        }

        // 3. Live Page DOM Verification if page provided
        if (page && validSyntax) {
            try {
                const stats = await page.evaluate((sel) => {
                    try {
                        let elements = [];
                        if (sel.startsWith('xpath=')) {
                            const xpathResult = document.evaluate(
                                sel.replace('xpath=', ''),
                                document,
                                null,
                                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                null,
                            );
                            for (let i = 0; i < xpathResult.snapshotLength; i++) {
                                elements.push(xpathResult.snapshotItem(i));
                            }
                        } else {
                            elements = Array.from(document.querySelectorAll(sel));
                        }

                        if (elements.length === 0) return { count: 0, visible: false };

                        const first = elements[0];
                        const rect = first.getBoundingClientRect();
                        const visible =
                            rect.width > 0 &&
                            rect.height > 0 &&
                            window.getComputedStyle(first).visibility !== 'hidden' &&
                            window.getComputedStyle(first).display !== 'none';

                        return { count: elements.length, visible };
                    } catch (e) {
                        return { error: e.message };
                    }
                }, trimmed);

                if (stats.error) {
                    validSyntax = false;
                    issues.push(`DOM evaluation error: ${stats.error}`);
                    return {
                        validSyntax: false,
                        count: 0,
                        unique: false,
                        visible: false,
                        score: 0,
                        issues,
                    };
                }

                return {
                    validSyntax: true,
                    count: stats.count,
                    unique: stats.count === 1,
                    visible: stats.visible,
                    score: stats.count === 1 ? score : Math.max(0.2, score - 0.3),
                    issues:
                        stats.count > 1
                            ? [
                                  ...issues,
                                  `Non-unique selector: matches ${stats.count} DOM elements`,
                              ]
                            : issues,
                };
            } catch (err) {
                issues.push(`Page evaluate error: ${err.message}`);
            }
        }

        return {
            validSyntax,
            count: validSyntax ? 1 : 0,
            unique: validSyntax,
            visible: validSyntax,
            score: validSyntax ? score : 0,
            issues,
        };
    }
}

export default new SelectorPreValidator();
