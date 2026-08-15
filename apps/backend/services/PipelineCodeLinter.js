/**
 * PipelineCodeLinter Service
 * Static analysis agent that audits generated native automation code (Playwright JS/TS / Cypress)
 * before users paste/commit code to CI/CD pipelines.
 *
 * Audits:
 * 1. Selector resilience (fragile IDs, raw positional XPaths)
 * 2. Dynamic waits (flagging fixed sleep / waitForTimeout)
 * 3. Credential security (hardcoded passwords, API keys, tokens)
 * 4. Assertion coverage & unhandled async promises
 */
export class PipelineCodeLinter {
    /**
     * Performs static code audit on automation code string
     * @param {string} codeString - Source code content
     * @param {string} [filename='test.spec.js'] - File name for logging
     * @returns {Object} Audit report { passed, score, issues, summary }
     */
    lintCode(codeString = '', filename = 'test.spec.js') {
        if (!codeString || typeof codeString !== 'string') {
            return {
                passed: false,
                score: 0,
                issues: [
                    {
                        rule: 'EMPTY_FILE',
                        line: 1,
                        severity: 'error',
                        message: 'Source code is empty or invalid format.',
                        fix: 'Provide valid JavaScript / TypeScript automation code.',
                    },
                ],
                summary: { total: 1, errors: 1, warnings: 0 },
            };
        }

        const lines = codeString.split('\n');
        const issues = [];

        // Rule patterns
        const dynamicIdRegex = /(#|id=["'])[a-zA-Z0-9_-]*\d{4,}[a-zA-Z0-9_-]*/;
        const rawXpathRegex = /(xpath=|\/\/)html\/body\/div/i;
        const staticSleepRegex = /(waitForTimeout|sleep|setTimeout)\s*\(\s*\d+\s*\)/;
        const hardcodedSecretRegex =
            /(password|secret|apikey|token|auth)\s*[:=]\s*["'][^"']{4,}["']/i;
        const unhandledAsyncRegex =
            /(^|\s)(page\.(click|fill|type|goto|waitForSelector|screenshot))\s*\(/;

        lines.forEach((lineText, index) => {
            const lineNumber = index + 1;
            const trimmed = lineText.trim();

            // Skip comments
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*'))
                return;

            // 1. Check Fragile Dynamic Selectors
            if (dynamicIdRegex.test(trimmed)) {
                issues.push({
                    rule: 'FRAGILE_DYNAMIC_SELECTOR',
                    line: lineNumber,
                    severity: 'warning',
                    message: 'Hardcoded dynamic ID with auto-generated numbers detected.',
                    codeSnippet: trimmed,
                    fix: 'Replace with semantic data-testid attribute or aria-role selector.',
                });
            }

            if (rawXpathRegex.test(trimmed)) {
                issues.push({
                    rule: 'FRAGILE_POSITIONAL_XPATH',
                    line: lineNumber,
                    severity: 'warning',
                    message:
                        'Positional absolute XPath (/html/body/...) is extremely fragile to DOM changes.',
                    codeSnippet: trimmed,
                    fix: 'Use relative CSS, data-testid, or ARIA role locator.',
                });
            }

            // 2. Check Static Sleeps / Fixed Waits
            if (staticSleepRegex.test(trimmed)) {
                issues.push({
                    rule: 'STATIC_SLEEP_WAIT',
                    line: lineNumber,
                    severity: 'error',
                    message: 'Static wait (waitForTimeout/sleep) introduces flaky pipeline delays.',
                    codeSnippet: trimmed,
                    fix: 'Replace static wait with dynamic auto-waiting (e.g. expect(locator).toBeVisible() or waitForSelector).',
                });
            }

            // 3. Check Hardcoded Credentials / Secrets
            if (hardcodedSecretRegex.test(trimmed) && !trimmed.includes('process.env')) {
                issues.push({
                    rule: 'HARDCODED_SECRET',
                    line: lineNumber,
                    severity: 'error',
                    message: 'Hardcoded sensitive credential, token, or password detected.',
                    codeSnippet: trimmed,
                    fix: 'Use environment variables via process.env (e.g. process.env.USER_PASSWORD).',
                });
            }

            // 4. Check Unhandled Async (Missing await)
            if (
                unhandledAsyncRegex.test(trimmed) &&
                !trimmed.startsWith('await ') &&
                !trimmed.startsWith('return ')
            ) {
                issues.push({
                    rule: 'UNHANDLED_ASYNC_PROMISE',
                    line: lineNumber,
                    severity: 'error',
                    message: 'Asynchronous Playwright operation invoked without "await".',
                    codeSnippet: trimmed,
                    fix: 'Add "await" before the Playwright page method invocation.',
                });
            }
        });

        // 5. Check Assertion Coverage
        const hasAssertion =
            codeString.includes('expect(') ||
            codeString.includes('assert(') ||
            codeString.includes('.should(');
        if (!hasAssertion) {
            issues.push({
                rule: 'MISSING_ASSERTION_COVERAGE',
                line: lines.length,
                severity: 'warning',
                message: 'No verification assertion (expect/assert) found in this test script.',
                codeSnippet: '',
                fix: 'Add at least one verification step using expect(locator).toBeVisible() or expect(value).toEqual().',
            });
        }

        const errorsCount = issues.filter((i) => i.severity === 'error').length;
        const warningsCount = issues.filter((i) => i.severity === 'warning').length;

        // Calculate quality score (0 - 100)
        let score = 100 - errorsCount * 20 - warningsCount * 10;
        if (score < 0) score = 0;

        return {
            filename,
            passed: errorsCount === 0,
            score,
            summary: {
                total: issues.length,
                errors: errorsCount,
                warnings: warningsCount,
            },
            issues,
        };
    }
}

export default new PipelineCodeLinter();
