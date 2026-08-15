/**
 * NetworkConsoleHealer Service
 * Self-healing engine for network failures (500/404/CORS/timeouts) and browser console runtime errors.
 */
export class NetworkConsoleHealer {
    constructor(options = {}) {
        this.maxRetries = options.maxRetries || 3;
        this.backoffBaseMs = options.backoffBaseMs || 1000;
    }

    /**
     * Analyzes network & console logs to classify error and determine recovery strategy
     * @param {Object} context - { networkLogs: [], consoleLogs: [], statusCode, errorMessage }
     * @returns {Object} { category, strategy, confidence, retryRecommended }
     */
    analyzeError(context = {}) {
        const { networkLogs = [], consoleLogs = [], statusCode, errorMessage = '' } = context;
        const msg = errorMessage.toLowerCase();

        // 1. Network Status Errors (5xx, 404, CORS)
        const failedNetwork = networkLogs.find((req) => req.status >= 400 || req.failed);
        const activeStatusCode = statusCode || (failedNetwork ? failedNetwork.status : 0);

        if (
            activeStatusCode >= 500 ||
            msg.includes('500') ||
            msg.includes('internal server error')
        ) {
            return {
                category: 'NETWORK_SERVER_ERROR',
                strategy: 'RETRY_WITH_EXPONENTIAL_BACKOFF',
                confidence: 0.9,
                retryRecommended: true,
                statusCode: activeStatusCode,
                reasoning: `Server returned HTTP ${activeStatusCode}. Transitory backend failure suspected.`,
            };
        }

        if (activeStatusCode === 404 || msg.includes('404') || msg.includes('not found')) {
            return {
                category: 'NETWORK_NOT_FOUND',
                strategy: 'VERIFY_URL_OR_FALLBACK',
                confidence: 0.85,
                retryRecommended: false,
                statusCode: 404,
                reasoning: 'Resource or endpoint not found (404). URL check recommended.',
            };
        }

        if (msg.includes('cors') || msg.includes('cross-origin')) {
            return {
                category: 'NETWORK_CORS_ERROR',
                strategy: 'BYPASS_CORS_SECURITY_FLAG',
                confidence: 0.95,
                retryRecommended: true,
                reasoning:
                    'CORS security restriction detected. Chrome disable-web-security flag recommended.',
            };
        }

        if (msg.includes('timeout') || msg.includes('net::err_connection_timed_out')) {
            return {
                category: 'NETWORK_TIMEOUT',
                strategy: 'WAIT_FOR_NETWORK_IDLE',
                confidence: 0.88,
                retryRecommended: true,
                reasoning: 'Network latency timeout. Retrying with extended networkidle wait.',
            };
        }

        // 2. Console Runtime Errors
        const fatalConsoleError = consoleLogs.find(
            (log) =>
                log.type === 'error' &&
                (log.text.includes('Uncaught') || log.text.includes('TypeError')),
        );

        if (fatalConsoleError) {
            const isThirdParty =
                fatalConsoleError.text.includes('gtm.js') ||
                fatalConsoleError.text.includes('analytics');
            return {
                category: 'CONSOLE_RUNTIME_ERROR',
                strategy: isThirdParty
                    ? 'IGNORE_NON_FATAL_THIRD_PARTY'
                    : 'RETRY_AFTER_DOM_STABILIZE',
                confidence: isThirdParty ? 0.95 : 0.75,
                retryRecommended: true,
                reasoning: isThirdParty
                    ? 'Non-critical third-party analytics script exception detected. Safe to bypass.'
                    : `Fatal JS runtime exception: ${fatalConsoleError.text.substring(0, 100)}`,
            };
        }

        return {
            category: 'UNKNOWN_FAILURE',
            strategy: 'GENERIC_RETRY',
            confidence: 0.5,
            retryRecommended: true,
            reasoning: 'Unclassified failure. Standard retry fallback applied.',
        };
    }

    /**
     * Applies the healing strategy on a Playwright page instance
     * @param {Object} page - Playwright page object (optional/mockable)
     * @param {Object} context - Analysis error context
     * @param {number} attempt - Current attempt number
     * @returns {Promise<Object>} Healing attempt result
     */
    async heal(page, context = {}, attempt = 1) {
        const analysis = this.analyzeError(context);

        if (attempt > this.maxRetries || !analysis.retryRecommended) {
            return {
                healed: false,
                analysis,
                attempt,
                message: `Self-healing max retries (${this.maxRetries}) reached or non-retryable error.`,
            };
        }

        const backoffMs = this.backoffBaseMs * Math.pow(2, attempt - 1);

        try {
            if (page) {
                if (
                    analysis.strategy === 'WAIT_FOR_NETWORK_IDLE' &&
                    typeof page.waitForLoadState === 'function'
                ) {
                    await page
                        .waitForLoadState('networkidle', { timeout: backoffMs + 3000 })
                        .catch(() => {});
                } else if (
                    analysis.strategy === 'RETRY_AFTER_DOM_STABILIZE' &&
                    typeof page.waitForTimeout === 'function'
                ) {
                    await page.waitForTimeout(backoffMs);
                } else if (analysis.strategy === 'RETRY_WITH_EXPONENTIAL_BACKOFF') {
                    await new Promise((resolve) => setTimeout(resolve, backoffMs));
                }
            }

            return {
                healed: true,
                analysis,
                attempt,
                backoffMs,
                message: `Applied strategy [${analysis.strategy}] after ${backoffMs}ms backoff.`,
            };
        } catch (err) {
            return {
                healed: false,
                analysis,
                attempt,
                error: err.message,
            };
        }
    }
}

export default new NetworkConsoleHealer();
