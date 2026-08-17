import { executePlaywrightAction, smartEmitLog } from '../../../core/ActionExecutor.js';
import { emitExecutionStatus } from '../../../socket.js';

const NOISY_DOMAINS = [
    'backtrace.io',
    'google-analytics.com',
    'doubleclick.net',
    'sentry.io',
    'segment.io',
    'hotjar.com',
    'facebook.net',
    'facebook.com/tr',
    'clarity.ms',
    'browser-sync',
];

/**
 * Checks if a log message or URL belongs to a known noisy third-party domain
 */
const isNoisyLog = (text, url = '') => {
    const combined = (text + ' ' + url).toLowerCase();
    return NOISY_DOMAINS.some((domain) => combined.includes(domain));
};

const logErrorsAction = (req, res) =>
    executePlaywrightAction(req, res, 'log_errors', async (page, opts) => {
        const { enable } = opts;
        if (enable) {
            const context = page.context();
            const attachToPage = (p) => {
                p.on('console', (msg) => {
                    if (msg.type() === 'error') {
                        const content = msg.text();
                        if (isNoisyLog(content)) return; // Skip noisy analytics/tracking errors

                        // Skip redundant generic network failures from console (already captured by network monitor with URL)
                        if (content.includes('net::ERR_FAILED')) return;

                        const message = `[Browser Console] ${content}`;
                        console.log(message);
                        smartEmitLog(message, 'error', opts.nodeId);
                        // Update node state to warning to give visual feedback
                        emitExecutionStatus({
                            stepId: opts.nodeId,
                            status: 'warning',
                            error: { message: 'Errors detected in console' },
                        });
                    }
                });
                p.on('pageerror', (err) => {
                    const content = err.message;
                    if (isNoisyLog(content)) return;

                    const message = `[Browser Error] ${content}`;
                    console.log(message);
                    smartEmitLog(message, 'error', opts.nodeId);
                    emitExecutionStatus({
                        stepId: opts.nodeId,
                        status: 'warning',
                        error: { message: 'Page error detected' },
                    });
                });
                p.on('requestfailed', (request) => {
                    const url = request.url();
                    const failure = request.failure();
                    const errorText = failure?.errorText || 'Unknown error';

                    if (isNoisyLog(errorText, url)) return;

                    const message = `[Network Error] Failed to load: ${url} - ${errorText}`;
                    console.log(message);
                    smartEmitLog(message, 'error', opts.nodeId);
                    emitExecutionStatus({
                        stepId: opts.nodeId,
                        status: 'warning',
                        error: { message: 'Network resource failed to load' },
                    });
                });
            };

            // Attach to current page
            attachToPage(page);

            // Attach to all future pages in this context (Persistent Collector)
            context.on('page', (p) => {
                console.log('[LogErrors] New page detected, attaching listeners...');
                attachToPage(p);
            });

            return { message: req.t('actions.log_errors.success') + ' (Monitoring enabled)' };
        } else {
            // Playwright does not have an easy method to "unsubscribe" from all anonymous listeners
            // without saving a reference. For now, this action only enables logging.
            // To disable robustly, we would need to manage the listeners.
            return {
                message: 'Disabling logging is not fully supported in this simple version',
            };
        }
    });

export default logErrorsAction;
